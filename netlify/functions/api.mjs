// API for redigeringssidene. All lagring skjer som vanlige endringer i GitHub-repoet,
// så Netlify bygger siden på nytt og historikken tar vare på alt som er endret.
//
//   /api/kirke  – kirken selv: leser og lagrer bare _data/<slug>.praktisk.json
//   /api/admin  – Danbolt: teknisk innhold, bilder, nye kirker
//
// Miljøvariabler i Netlify (scope: Functions):
//   GITHUB_TOKEN       – tilgang til å skrive i repoet (Contents: read and write)
//   ADMIN_PASSORD      – passordet til /admin/
//   LENKE_HEMMELIGHET  – tilfeldig tekst som kirkenes hemmelige lenker lages av
import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { FELT, TOM_PRAKTISK, SLUG_RE, sideSti } from '../../_verktoy/felt.mjs';

const REPO = 'tinecello/danbolt-kirker';
const env = n => Netlify.env.get(n) || '';
const gren = () => env('KIRKER_GREN') || 'main';

class Feil extends Error {
  constructor(status, melding) { super(melding); this.status = status; }
}
const svar = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
const lik = (a, b) => {
  const h = s => createHash('sha256').update(String(s)).digest();
  return timingSafeEqual(h(a), h(b));
};
const tekst = (v, maks) => String(v ?? '').replace(/\r\n?/g, '\n').trim().slice(0, maks);

// ---------- GitHub ----------
async function gh(sti, valg = {}) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${sti}`, {
    ...valg,
    headers: {
      authorization: `Bearer ${env('GITHUB_TOKEN')}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'kirker-danbolt',
      ...(valg.body ? { 'content-type': 'application/json' } : {}),
    },
  });
  return r;
}
async function lesFil(sti) {
  const r = await gh(`${sti}?ref=${encodeURIComponent(gren())}`);
  if (r.status === 404) return null;
  if (r.status === 401 || r.status === 403) throw new Feil(503, 'Lagringen har mistet tilgangen til GitHub. Tilgangsnøkkelen må fornyes.');
  if (!r.ok) throw new Feil(502, 'Fikk ikke kontakt med lagringen. Prøv igjen om litt.');
  const j = await r.json();
  return { sha: j.sha, tekst: Buffer.from(j.content || '', 'base64').toString('utf8') };
}
async function lesJson(sti) {
  const f = await lesFil(sti);
  return f && { sha: f.sha, data: JSON.parse(f.tekst) };
}
async function skrivFil(sti, base64, melding, sha) {
  const r = await gh(sti, {
    method: 'PUT',
    body: JSON.stringify({ message: melding, content: base64, branch: gren(), ...(sha ? { sha } : {}) }),
  });
  if (r.status === 409 || r.status === 422) throw new Feil(409, 'Noen andre har lagret i mellomtiden. Last siden på nytt og gjør endringen en gang til.');
  if (r.status === 401 || r.status === 403 || r.status === 404) throw new Feil(503, 'Lagringen har ikke skrivetilgang til GitHub. Tilgangsnøkkelen må fornyes.');
  if (!r.ok) throw new Feil(502, 'Lagringen feilet. Prøv igjen om litt.');
  return (await r.json()).content.sha;
}
const skrivJson = (sti, data, melding, sha) =>
  skrivFil(sti, Buffer.from(JSON.stringify(data, null, 2) + '\n').toString('base64'), melding, sha);

// ---------- Kirkens hemmelige lenke ----------
const nokkel = (slug, versjon) =>
  createHmac('sha256', env('LENKE_HEMMELIGHET')).update(`${slug}:${versjon || 1}`).digest('base64url').slice(0, 24);

const side = k => sideSti(k, env('LENKE_HEMMELIGHET'));

// ---------- /api/kirke ----------
async function kirke(req) {
  if (!env('GITHUB_TOKEN') || !env('LENKE_HEMMELIGHET')) throw new Feil(503, 'Redigering er ikke satt opp ennå.');
  const ugyldig = new Feil(403, 'Lenken er ikke gyldig lenger. Ta kontakt med Danbolt for å få en ny.');
  const slug = req.headers.get('x-kirke') || '';
  if (!SLUG_RE.test(slug)) throw ugyldig;
  const tek = await lesJson(`_data/${slug}.json`);
  if (!tek || tek.data.kommer || !lik(req.headers.get('x-nokkel') || '', nokkel(slug, tek.data.lenkeversjon))) throw ugyldig;

  const sti = `_data/${slug}.praktisk.json`;
  const fil = await lesJson(sti);
  const naa = { ...TOM_PRAKTISK(), ...(fil ? fil.data : {}) };
  delete naa.oppdatertAv;

  if (req.method === 'GET') {
    return svar({ navn: tek.data.navn, sted: tek.data.sted || '', side: side(tek.data), felt: FELT, data: naa });
  }
  if (req.method === 'PUT') {
    const inn = await req.json().catch(() => ({}));
    const ny = TOM_PRAKTISK();
    for (const f of FELT) ny.felt[f.id] = tekst(inn.felt?.[f.id], 1500);
    ny.kontakt = {
      navn: tekst(inn.kontakt?.navn, 120),
      telefon: tekst(inn.kontakt?.telefon, 40),
      epost: tekst(inn.kontakt?.epost, 120),
    };
    ny.oppdatert = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });
    await skrivJson(sti, ny, `${tek.data.navn}: praktisk informasjon oppdatert av kirken`, fil?.sha);
    return svar({ ok: true, oppdatert: ny.oppdatert });
  }
  throw new Feil(405, 'Ikke støttet.');
}

// ---------- /api/admin ----------
const slugAv = navn => navn.toLowerCase()
  .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Ny kirke med utgangspunkt i en annen: tekstene beholdes, alt som er stedsspesifikt nullstilles.
function tomKopi(kilde, slug, navn, sted) {
  const k = structuredClone(kilde);
  const nullstill = o => {
    if (Array.isArray(o)) return o.forEach(nullstill);
    if (o && typeof o === 'object') {
      if ('src' in o) o.src = '';
      Object.values(o).forEach(nullstill);
    }
  };
  nullstill(k);
  Object.assign(k, { slug, navn, sted, fakta: '', publisert: false, lenkeversjon: 1 });
  delete k.kommer;
  delete k.skjult;
  if (k.plan) {
    delete k.plan.bilde;
    (k.plan.punkter || []).forEach(p => { delete p.x; delete p.y; });
  }
  return k;
}
const grunnmal = (slug, navn, sted) => ({
  slug, navn, sted, fakta: '',
  ingress: 'Her finner du det du trenger for å bruke lyd og lys i kirken, og praktisk informasjon for deg som skal ha et arrangement her.',
  hovedbilde: { src: '', tekst: 'Kirkerommet sett fra inngangen' },
  oppgaver: [],
  plan: { w: 30, h: 36, rom: [], etiketter: [], punkter: [] },
  lys: { tekst: '', hvor: '', bilde: { src: '', tekst: 'Lysbryterne' }, brytere: [], for: '', etter: '', konsertlys: null },
  hjelp: [],
  teknisk: { intro: '', kjede: [], spesifikasjoner: [], bilde: { src: '', tekst: 'Teknisk utstyr' } },
  galleri: [],
  lenkeversjon: 1,
});

async function admin(req) {
  if (!env('GITHUB_TOKEN') || !env('LENKE_HEMMELIGHET') || env('ADMIN_PASSORD').length < 8) throw new Feil(503, 'Admin er ikke satt opp ennå.');
  if (req.method !== 'POST') throw new Feil(405, 'Ikke støttet.');
  if (!lik(req.headers.get('x-passord') || '', env('ADMIN_PASSORD'))) throw new Feil(401, 'Feil passord.');
  const inn = await req.json().catch(() => ({}));
  const slug = inn.slug || '';
  const krevSlug = () => { if (!SLUG_RE.test(slug)) throw new Feil(400, 'Ugyldig kirke.'); };

  switch (inn.handling) {
    case 'liste': {
      const r = await gh(`_data?ref=${encodeURIComponent(gren())}`);
      if (!r.ok) throw new Feil(502, 'Fikk ikke hentet kirkene.');
      const filer = (await r.json()).map(f => f.name).filter(n => n.endsWith('.json') && !n.endsWith('.praktisk.json') && !n.startsWith('_'));
      const kirker = await Promise.all(filer.map(async n => {
        const { data } = await lesJson(`_data/${n}`);
        return { slug: data.slug, navn: data.navn, sted: data.sted || '', kommer: !!data.kommer, publisert: !!data.publisert, skjult: !!data.skjult };
      }));
      return svar({ kirker: kirker.sort((a, b) => a.navn.localeCompare(b.navn, 'nb')) });
    }
    case 'hent': {
      krevSlug();
      const tek = await lesJson(`_data/${slug}.json`);
      if (!tek) throw new Feil(404, 'Fant ikke kirken.');
      const pr = await lesJson(`_data/${slug}.praktisk.json`);
      return svar({
        data: tek.data, sha: tek.sha,
        praktisk: pr ? pr.data : TOM_PRAKTISK(),
        lenke: `/rediger/#${slug}.${nokkel(slug, tek.data.lenkeversjon)}`,
        side: side(tek.data),
      });
    }
    case 'lagre': {
      krevSlug();
      const d = inn.data;
      if (!d || typeof d !== 'object' || d.slug !== slug || !tekst(d.navn, 200)) throw new Feil(400, 'Ugyldig innhold.');
      if (JSON.stringify(d).length > 400_000) throw new Feil(413, 'Innholdet er for stort.');
      const sha = await skrivJson(`_data/${slug}.json`, d, `${d.navn}: ${tekst(inn.hva, 80) || 'innhold oppdatert'}`, inn.sha);
      return svar({ ok: true, sha, lenke: `/rediger/#${slug}.${nokkel(slug, d.lenkeversjon)}`, side: side(d) });
    }
    case 'bilde': {
      krevSlug();
      const navn = String(inn.navn || '');
      const b64 = String(inn.data || '');
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(navn) || navn.length > 80) throw new Feil(400, 'Ugyldig bildenavn.');
      if (!b64.startsWith('/9j/')) throw new Feil(400, 'Bildet må være JPEG.');
      if (b64.length > 5_500_000) throw new Feil(413, 'Bildet er for stort.');
      const sti = `bilder/${slug}/${navn}.jpg`;
      const finnes = await gh(`${sti}?ref=${encodeURIComponent(gren())}`);
      const sha = finnes.ok ? (await finnes.json()).sha : undefined;
      await skrivFil(sti, b64, `${slug}: bilde ${navn}`, sha);
      return svar({ ok: true, src: `/${sti}` });
    }
    case 'ny': {
      const navn = tekst(inn.navn, 120);
      const ny = slugAv(navn);
      if (!navn || !SLUG_RE.test(ny)) throw new Feil(400, 'Skriv inn kirkens navn.');
      const finnes = await lesJson(`_data/${ny}.json`);
      if (finnes && !finnes.data.kommer) throw new Feil(409, 'Det finnes allerede en side for denne kirken.');
      let data = grunnmal(ny, navn, tekst(inn.sted, 120));
      if (inn.kopierFra) {
        if (!SLUG_RE.test(inn.kopierFra)) throw new Feil(400, 'Ugyldig kirke å kopiere fra.');
        const kilde = await lesJson(`_data/${inn.kopierFra}.json`);
        if (!kilde || kilde.data.kommer) throw new Feil(404, 'Fant ikke kirken å kopiere fra.');
        data = tomKopi(kilde.data, ny, navn, tekst(inn.sted, 120));
      }
      if (inn.skjult) data.skjult = true;
      await skrivJson(`_data/${ny}.json`, data, `${navn}: ny kirkeside${inn.skjult ? ' (skjult)' : ''}`, finnes?.sha);
      if (!(await lesFil(`_data/${ny}.praktisk.json`))) await skrivJson(`_data/${ny}.praktisk.json`, TOM_PRAKTISK(), `${navn}: tom praktisk-fil`);
      return svar({ ok: true, slug: ny });
    }
    default:
      throw new Feil(400, 'Ukjent handling.');
  }
}

export default async (req) => {
  try {
    return new URL(req.url).pathname === '/api/kirke' ? await kirke(req) : await admin(req);
  } catch (f) {
    if (f instanceof Feil) return svar({ feil: f.message }, f.status);
    console.error(f);
    return svar({ feil: 'Noe gikk galt. Prøv igjen om litt.' }, 500);
  }
};

export const config = { path: ['/api/kirke', '/api/admin'] };

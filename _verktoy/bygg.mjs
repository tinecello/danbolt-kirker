// Bygger hele nettstedet til _site/. Netlify kjører dette ved hver endring i GitHub.
// Lokalt: node _verktoy/bygg.mjs
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lagSide } from './lag-side.mjs';
import { SLUG_RE, TOM_PRAKTISK } from './felt.mjs';

const rot = join(dirname(fileURLToPath(import.meta.url)), '..');
const ut = join(rot, '_site');
const les = f => JSON.parse(readFileSync(join(rot, '_data', f), 'utf8'));
const e = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

rmSync(ut, { recursive: true, force: true });
mkdirSync(ut, { recursive: true });

// Kirkene: én teknisk datafil per kirke, pluss kirkens egen praktisk-fil.
const kirker = readdirSync(join(rot, '_data'))
  .filter(f => f.endsWith('.json') && !f.endsWith('.praktisk.json') && !f.startsWith('_'))
  .map(f => {
    const k = les(f);
    const slug = f.replace(/\.json$/, '');
    if (!SLUG_RE.test(slug) || k.slug !== slug) throw new Error(`${f}: "slug" må være "${slug}"`);
    const pf = `${slug}.praktisk.json`;
    return { k, pr: existsSync(join(rot, '_data', pf)) ? les(pf) : TOM_PRAKTISK() };
  })
  .sort((a, b) => a.k.navn.localeCompare(b.k.navn, 'nb'));

for (const { k, pr } of kirker) {
  if (k.kommer) continue; // står på forsiden som «Side kommer», har ingen egen side ennå
  mkdirSync(join(ut, k.slug), { recursive: true });
  writeFileSync(join(ut, k.slug, 'index.html'), lagSide(k, pr));
}

// Forsiden lages fra den samme listen, så den alltid stemmer.
const rader = kirker.map(({ k }) => k.kommer
  ? `<div class="kirke church-row pending" data-sok="${e((k.navn + ' ' + (k.sted || '')).toLowerCase().trim())}"><span><strong>${e(k.navn)}</strong><small>${e(k.sted || 'Sted legges inn')}</small></span><span class="row-action">Side kommer</span></div>`
  : `<a class="kirke church-row" href="/${e(k.slug)}/" data-sok="${e((k.navn + ' ' + (k.sted || '')).toLowerCase().trim())}"><span><strong>${e(k.navn)}</strong><small>${e(k.sted)}</small></span><span class="row-action">Åpne veiledningen <span aria-hidden="true">→</span></span></a>`).join('');
const underArbeid = kirker.some(({ k }) => k.kommer || !k.publisert);

writeFileSync(join(ut, 'index.html'), `<!doctype html><html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kirker med Kirkelydpakken | Danbolt</title><meta name="description" content="Finn kirken og brukerveiledningen for lyd, lys og praktisk informasjon."><link rel="canonical" href="https://kirker.danbolt.no/"><meta name="theme-color" content="#25211f"><link rel="stylesheet" href="/stil.css"></head><body>
<header><div style="display:flex;align-items:center;justify-content:space-between;gap:24px;margin:auto"><a class="brand" href="https://danbolt.no/"><img src="/danbolt-rom-logo.png" alt="Danbolt"><small>LYDTEKNIKK FOR KIRKEROM</small></a><a href="https://danbolt.no/">Til danbolt.no</a></div></header>
<main class="portal"><div class="portal-intro"><h1>Finn kirken.<br><em>Finn veiledningen.</em></h1><p>Brukerveiledning for prest, kirketjener, begravelsesbyrå, kor og konsertarrangør. Velg kirke for å finne informasjon om lyd, lys og praktiske forhold.</p></div>
<label class="church-search"><span>Søk etter kirke eller sted</span><input id="sok" type="search" placeholder="Skriv kirkenavn eller sted" autocomplete="off" aria-controls="kirkene"></label>
<div id="kirkene" class="church-list">${rader}<p id="ingen" class="portal-empty" role="status" hidden>Ingen kirker passer søket. Prøv et annet kirkenavn eller sted.</p></div>${underArbeid ? '<p class="portal-note">Sidene er under arbeid. Veiledninger og praktisk informasjon fylles ut fortløpende.</p>' : ''}</main>
<footer><div class="portal-footer"><span>Thorbjørn Danbolt · <a href="tel:+4797721779">+47 977 21 779</a> · <a href="mailto:thorbjorn@danbolt.no">thorbjorn@danbolt.no</a></span><a href="https://danbolt.no/personvern/">Personvern</a></div></footer><script>
var sok=document.getElementById('sok'),kirker=document.querySelectorAll('.kirke'),ingen=document.getElementById('ingen');
sok.addEventListener('input',function(){var q=sok.value.trim().toLowerCase(),n=0;kirker.forEach(function(k){var v=!q||k.dataset.sok.indexOf(q)>-1;k.style.display=v?'':'none';if(v)n++;});ingen.hidden=n>0;});
</script></body></html>
`);

// Statiske filer.
for (const f of ['stil.css', 'kirke.css', 'fonter', 'bilder', 'danbolt-rom-logo.png', 'robots.txt', 'rediger', 'admin']) {
  if (existsSync(join(rot, f))) cpSync(join(rot, f), join(ut, f), { recursive: true });
}

console.log(`Bygget ${kirker.filter(x => !x.k.kommer).length} kirkeside(r) og forsiden.`);

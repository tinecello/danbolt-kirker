// Lager én statisk kirkeside. Felles design for alle kirker.
// k  = teknisk innhold fra _data/<slug>.json (eies av Danbolt)
// pr = praktisk innhold fra _data/<slug>.praktisk.json (eies av kirken)
// Moduler uten data vises ikke. Er siden publisert, skjules også tomme bilde- og videoplasser.
import { FELT } from './felt.mjs';

export function lagSide(k, pr = {}) {
  const pub = !!k.publisert;
  const felt = pr.felt || {};
  const e = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const tom = t => `<span class="tom">${e(t || 'Legges inn')}</span>`;
  const v = (s, t) => s ? e(s) : tom(t);
  const bilde = (b, cls = '') => b && b.src
    ? `<img class="foto ${cls}" src="${e(b.src)}" alt="${e(b.tekst)}" loading="lazy">`
    : pub ? '' : `<div class="bilde ${cls}"><span>Bilde</span>${e(b && b.tekst)}</div>`;
  // Video: lim inn en YouTube- eller Vimeo-lenke, eller adressen til en videofil.
  const video = d => {
    const u = (d && d.src) || '';
    const yt = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{11})/.exec(u);
    const vm = /vimeo\.com\/(?:video\/)?(\d+)/.exec(u);
    const ramme = src => `<iframe class="vid" src="${e(src)}" title="${e(d.tittel || 'Video')}" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    if (yt) return ramme('https://www.youtube-nocookie.com/embed/' + yt[1]);
    if (vm) return ramme('https://player.vimeo.com/video/' + vm[1]);
    if (u) return `<video class="vid" controls preload="none" src="${e(u)}"></video>`;
    return pub ? '' : `<div class="video"><span class="play"></span><span>${e(d.tittel)}${d.varighet ? ' · ' + e(d.varighet) : ''}</span><span class="pille mork">Video kommer</span></div>`;
  };
  const KAT = { lyd: 'Lyd', lys: 'Lys', praktisk: 'Praktisk' };

  // Oppgaver
  const oppg = k.oppgaver || [];
  const oppgKnapper = oppg.map((o, i) => o.lenke
    ? `<a class="oppg" href="${e(o.lenke)}"><b>${e(o.tittel)}</b><span>${e(o.undertittel)} ↓</span></a>`
    : `<button class="oppg" type="button" data-oppg="${e(o.id)}" aria-pressed="${i === 0}"><b>${e(o.tittel)}</b><span>${e(o.undertittel)}</span></button>`).join('');
  const oppgPaneler = oppg.filter(o => o.steg).map((o, i) => `
    <div class="oppgpanel" id="oppg-${e(o.id)}" ${i ? 'data-skjul' : ''}>
      <ol class="steg">${o.steg.map((s, j) => `
        <li>${bilde(s.bilde)}<div class="stegnr"><i>${j + 1}</i></div><p>${v(s.tekst)}</p>${s.tips ? `<p class="tips">${e(s.tips)}</p>` : ''}</li>`).join('')}
      </ol>
      <div class="etter-rad">
        ${o.etter ? `<div class="etter"><span class="etikett">Etter bruk</span><p>${e(o.etter)}</p></div>` : ''}
        ${o.video ? video(o.video) : ''}
      </div>
    </div>`).join('');

  // Panel: bruker skjermbilde med merker hvis panel.ui finnes
  const p = k.panel;
  const panelHtml = p ? `
  <section id="panel" class="del">
    <div class="topp"><span class="etikett">Lyd</span><h2>Slik ser panelet ut</h2><p class="ingress">${e(p.plassering)}. Bokstavene på bildet er forklart under.</p></div>
    <figure class="ui">
      ${p.ui && p.ui.src ? `<img src="${e(p.ui.src)}" alt="${e(p.ui.tekst)}">` : bilde(p.ui || { tekst: 'Skjermbilde av panelet' }, 'bred')}
      ${(p.merker || []).map(m => `<span class="merke" style="left:${m.x}%;top:${m.y}%">${e(m.b)}</span>`).join('')}
    </figure>
    <div class="forklar">${(p.merker || []).map(m => `
      <div><em>${e(m.b)}</em><div><b>${e(m.tittel)}</b><p>${e(m.tekst)}</p>
        ${m.programmer && (p.programmer || []).length ? `<dl>${p.programmer.map(x => `<dt>${e(x.navn)}</dt><dd>${e(x.forklaring)}</dd>`).join('')}</dl>` : ''}
        ${m.skyvere && (p.skyvere || []).length ? `<dl>${p.skyvere.map(x => `<dt>${e(x.navn)}</dt><dd>${e(x.forklaring)}</dd>`).join('')}</dl>` : ''}
      </div></div>`).join('')}
    </div>
    ${p.bilde && bilde(p.bilde) ? `<div style="max-width:520px">${bilde(p.bilde)}</div>` : ''}
  </section>` : '';

  // Kart
  const pl = k.plan;
  let n = 0;
  const pkt = (pl ? pl.punkter : []).map(x => ({ ...x, n: ++n }));
  // Tegningen er enten et opplastet bilde (plan.bilde) eller enkle rektangler (plan.rom).
  // Alle mål skaleres etter tegningens størrelse, så punktene ser like ut uansett.
  const s = pl ? Math.max(pl.w, pl.h) / 36 : 1;
  const pad = 2 * s;
  const r2 = n => Math.round(n * 100) / 100;
  const kartHtml = pl ? `
  <section id="kart" class="del">
    <div class="topp"><span class="etikett">Finn fram</span><h2>Hvor er det?</h2><p class="ingress">Trykk på et nummer for å se bilde og forklaring.</p></div>
    <div class="kart" data-filter="alle">
      <div class="chips" role="group" aria-label="Vis">
        <button type="button" class="chip" data-f="alle" aria-pressed="true">Alt</button>
        ${Object.keys(KAT).filter(c => pkt.some(x => x.kat === c)).map(c => `<button type="button" class="chip" data-f="${c}" aria-pressed="false"><i class="kat-${c}"></i>${KAT[c]}</button>`).join('')}
      </div>
      <div class="to">
        <svg viewBox="${-pad} ${-pad} ${pl.w + pad * 2} ${pl.h + pad * 2}" role="img" aria-label="Plantegning av ${e(k.navn)}">
          ${pl.bilde && pl.bilde.src
            ? `<image href="${e(pl.bilde.src)}" x="0" y="0" width="${pl.w}" height="${pl.h}" preserveAspectRatio="none"></image>`
            : `<g fill="#ebe5d9" stroke="#1d1b17" stroke-width="${r2(.15 * s)}">${(pl.rom || []).map(r => `<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}"></rect>`).join('')}</g>
          <g fill="#8a8274" font-family="Manrope,sans-serif" font-size="${r2(1.05 * s)}" letter-spacing="${r2(.2 * s)}" text-anchor="middle">${(pl.etiketter || []).map(t => `<text x="${t.x}" y="${t.y}">${e(t.t)}</text>`).join('')}</g>`}
          ${pkt.filter(x => x.x != null).map(x => `<a href="#sted-${e(x.id)}" data-kat="${x.kat}"><circle class="kat-${x.kat}" cx="${x.x}" cy="${x.y}" r="${r2(1.35 * s)}"${pl.bilde && pl.bilde.src ? ` stroke="#fff" stroke-width="${r2(.18 * s)}"` : ''}></circle><text x="${x.x}" y="${r2(x.y + .46 * s)}" fill="#fff" font-family="Manrope,sans-serif" font-size="${r2(1.3 * s)}" font-weight="600" text-anchor="middle">${x.n}</text></a>`).join('')}
        </svg>
        <div class="steder">${pkt.map(x => `
          <div class="sted" id="sted-${e(x.id)}" data-kat="${x.kat}">
            <span class="prikk kat-${x.kat}">${x.n}</span>
            <div><b>${e(x.navn)}</b><p>${x.tekst ? e(x.tekst) : tom()}</p>${x.x == null && !pub ? '<p class="ikkeplassert">Ikke plassert på tegningen ennå</p>' : ''}</div>
            ${bilde(x.bilde, 'liten')}
          </div>`).join('')}
        </div>
      </div>
    </div>
  </section>` : '';

  // Lys
  const l = k.lys;
  const lysHtml = l ? `
  <section id="lys" class="del">
    <div class="topp"><span class="etikett">Lys</span><h2>Lys i kirken</h2><p class="ingress">${e(l.tekst)}</p></div>
    <div class="to">
      <div class="blokk">
        <div class="liste">
          <div><span>Hvor er bryterne?</span><span>${v(l.hvor || felt.lys)}</span></div>
          ${((l.brytere || []).length ? l.brytere : pub ? [] : [{}, {}, {}]).map((b, i) => `<div><span>${b.navn ? e(b.navn) : 'Bryter ' + (i + 1)}</span><span>${v(b.styrer, 'Hva den styrer: legges inn')}</span></div>`).join('')}
          <div><span>Før arrangementet</span><span>${v(l.for)}</span></div>
          <div><span>Etter arrangementet</span><span>${v(l.etter)}</span></div>
        </div>
        ${l.konsertlys ? '' : `<div class="kort"><b>Ingen konsertlys</b><p>Skal du ha eget lys til en konsert? Se strøm og rigging under <a href="#praktisk">Praktisk</a>.</p></div>`}
      </div>
      ${bilde(l.bilde)}
    </div>
    ${l.konsertlys ? `
    <div class="blokk"><h3>Konsertlys</h3><p>${e(l.konsertlys.tekst)}</p>
      <ol class="steg">${(l.konsertlys.steg || []).map((s, j) => `<li>${bilde(s.bilde)}<div class="stegnr"><i>${j + 1}</i></div><p>${v(s.tekst)}</p></li>`).join('')}</ol>
    </div>` : ''}
  </section>` : '';

  // Praktisk: fylles ut av kirken selv på redigeringssiden.
  const kort = FELT.filter(f => !f.visesUnder).map(f => ({ tema: f.tema, tekst: felt[f.id] || '' })).filter(x => x.tekst || !pub);
  const dato = /^\d{4}-\d{2}-\d{2}$/.test(pr.oppdatert || '') ? pr.oppdatert.split('-').reverse().join('.') : '';
  const prHtml = kort.length ? `
  <section id="praktisk" class="del">
    <div class="topp"><span class="etikett">Praktisk</span><h2>Praktisk informasjon</h2><p class="ingress">For deg som skal ha et arrangement i kirken. Informasjonen er levert av ${e(k.navn)}.${dato ? ` Sist oppdatert ${dato}.` : ''}</p></div>
    <div class="grid">${kort.map(x => `<div class="kort"><b>${e(x.tema)}</b><p>${x.tekst ? e(x.tekst).replace(/\n/g, '<br>') : tom('Fylles ut av kirken')}</p></div>`).join('')}</div>
  </section>` : '';

  // Hjelp + kontakt
  const kt = pr.kontakt || {};
  const hjelpHtml = `
  <section id="hjelp" class="del">
    <div class="hjelp">
      <div class="topp"><span class="etikett lys">Hjelp</span><h2>Noe virker ikke</h2></div>
      <div class="to">
        <div>${(k.hjelp || []).map(x => `<details><summary>${e(x.q)}</summary><p>${e(x.a)}</p></details>`).join('')}</div>
        <div class="kontakter" id="kontakt">
          ${kt.navn || kt.telefon || kt.epost || !pub ? `<div class="kkort"><span class="etikett lys">Kirkens kontaktperson</span><b>${v(kt.navn, 'Fylles ut av kirken')}</b>${kt.telefon ? `<a href="tel:${e(kt.telefon.replace(/\s/g, ''))}">${e(kt.telefon)}</a>` : ''}${kt.epost ? `<a href="mailto:${e(kt.epost)}">${e(kt.epost)}</a>` : ''}</div>` : ''}
          <div class="kkort"><span class="etikett lys">Teknisk support</span><b>Thorbjørn Danbolt</b><a class="tlf" href="tel:+4797721779">977 21 779</a><a href="mailto:thorbjorn@danbolt.no">thorbjorn@danbolt.no</a></div>
        </div>
      </div>
    </div>
  </section>`;

  // Teknisk
  const t = k.teknisk;
  const tekHtml = t ? `
  <section id="teknisk" class="del">
    <div class="topp"><span class="etikett">For lydteknikere</span><h2>Teknisk informasjon</h2><p class="ingress">${e(t.intro)}</p></div>
    <div class="kjede">${(t.kjede || []).map(x => `<span class="ledd">${e(x)}</span>`).join('<span class="pil">→</span>')}</div>
    <div class="to">
      <div class="liste">${(t.spesifikasjoner || []).filter(r => r[1] || !pub).map(r => `<div><span>${e(r[0])}</span><span>${v(r[1])}</span></div>`).join('')}</div>
      ${bilde(t.bilde)}
    </div>
  </section>` : '';

  const galInnhold = (k.galleri || []).map(g => g.video ? video(g) : bilde(g)).join('');
  const gal = galInnhold ? `
  <section class="del">
    <div class="topp"><h3>Flere bilder og videoer</h3></div>
    <div class="grid">${galInnhold}</div>
  </section>` : '';

  return `<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- Generert fra _data/${e(k.slug)}.json. Endre datafilen, ikke denne filen. -->
<title>${e(k.navn)} – lyd, lys og praktisk informasjon | Danbolt</title>
<meta name="description" content="Slik bruker du lyd og lys i ${e(k.navn)}, ${e(k.sted)}. Praktisk informasjon for ansatte, frivillige, begravelsesbyråer, kor og konsertarrangører.">
${k.publisert ? '' : '<meta name="robots" content="noindex">'}
<link rel="canonical" href="https://kirker.danbolt.no/${e(k.slug)}/">
<meta name="theme-color" content="#f3efe6">
<link rel="stylesheet" href="/kirke.css">
<link rel="stylesheet" href="/stil.css">
</head>
<body>
<header style="position:sticky;top:0;z-index:10;background:rgba(243,239,230,.94);backdrop-filter:blur(8px);border-bottom:1px solid rgba(29,27,23,.1)">
  <div class="wrap" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px 24px;padding-top:12px;padding-bottom:12px">
    <a href="/" style="display:flex;flex-direction:column;color:#1d1b17;line-height:1.1"><span style="font-family:'Cormorant Garamond',serif;font-size:22px">${e(k.navn)}</span><span style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#6d665b">← Alle kirker</span></a>
    <nav style="display:flex;flex-wrap:wrap;gap:4px 20px;font-size:15px;font-weight:500">
      <a href="#start">Kom i gang</a>${kartHtml ? '<a href="#kart">Finn fram</a>' : ''}${panelHtml ? '<a href="#panel">Panelet</a>' : ''}${lysHtml ? '<a href="#lys">Lys</a>' : ''}${prHtml ? '<a href="#praktisk">Praktisk</a>' : ''}<a href="#hjelp">Hjelp og kontakt</a>${tekHtml ? '<a href="#teknisk">Teknisk</a>' : ''}
    </nav>
  </div>
</header>
<main class="wrap" style="padding-bottom:140px">
  ${k.publisert ? '' : '<p class="draft-notice">Denne veiledningen er under arbeid. Enkelte bilder og opplysninger mangler.</p>'}
  <section class="church-intro" style="padding-top:56px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:36px;align-items:end">
    <div style="display:flex;flex-direction:column;gap:16px">
      <span class="etikett">${e(k.sted)} · ${e(k.fakta)}</span>
      <h1 style="font-size:clamp(54px,7.5vw,104px);line-height:.92;letter-spacing:-.03em">${e(k.navn)}</h1>
      <p class="ingress">${e(k.ingress)}</p>
      ${tekHtml ? '<p class="snarvei"><a href="#teknisk">Lydtekniker? Gå rett til teknisk informasjon →</a></p>' : ''}
    </div>
    ${bilde(k.hovedbilde, 'bred')}
  </section>

  <section id="start" class="del" style="padding-top:72px">
    <div class="topp"><span class="etikett">Kom i gang</span><h2>Hva skal du gjøre?</h2></div>
    <div class="oppgaver">${oppgKnapper}</div>
    ${oppgPaneler}
  </section>
  ${kartHtml}
  ${panelHtml}
  ${lysHtml}
  ${prHtml}
  ${hjelpHtml}
  ${tekHtml}
  ${gal}
</main>
<a class="hjelpknapp" href="#hjelp">Hjelp</a>
<footer style="border-top:1px solid rgba(29,27,23,.08)">
  <div class="wrap" style="padding-top:36px;padding-bottom:36px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px 32px;font-size:15px;color:#6d665b">
    <span>Kirkelydpakken fra <a href="https://danbolt.no/">Danbolt</a></span>
    <a href="https://danbolt.no/personvern/" style="color:#6d665b;text-decoration:underline">Personvern</a>
  </div>
</footer>
<script>
document.querySelectorAll('[data-oppg]').forEach(function(b){b.addEventListener('click',function(){
  document.querySelectorAll('[data-oppg]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});
  document.querySelectorAll('.oppgpanel').forEach(function(p){p.toggleAttribute('data-skjul',p.id!=='oppg-'+b.dataset.oppg)});
})});
document.querySelectorAll('.chip').forEach(function(c){c.addEventListener('click',function(){
  c.closest('.kart').dataset.filter=c.dataset.f;
  document.querySelectorAll('.chip').forEach(function(x){x.setAttribute('aria-pressed',x===c)});
})});
</script>
</body>
</html>
`;
}

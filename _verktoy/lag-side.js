// Lager én statisk kirkeside fra en datafil i _data/. Felles design for alle kirker.
// Moduler uten data vises ikke (f.eks. konsertlys, video, galleri).
function lagSide(k) {
  const e = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const tom = t => `<span class="tom">${e(t || 'Legges inn')}</span>`;
  const v = (s, t) => s ? e(s) : tom(t);
  const bilde = (b, cls = '') => b && b.src
    ? `<img class="foto ${cls}" src="${e(b.src)}" alt="${e(b.tekst)}" loading="lazy">`
    : `<div class="bilde ${cls}"><span>Bilde</span>${e(b && b.tekst)}</div>`;
  const video = d => d.src
    ? `<video class="vid" controls preload="none" src="${e(d.src)}"></video>`
    : `<div class="video"><span class="play"></span><span>${e(d.tittel)}${d.varighet ? ' · ' + e(d.varighet) : ''}</span><span class="pille mork">Video kommer</span></div>`;
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
        ${m.programmer ? `<dl>${p.programmer.map(x => `<dt>${e(x.navn)}</dt><dd>${e(x.forklaring)}</dd>`).join('')}</dl>` : ''}
        ${m.skyvere ? `<dl>${p.skyvere.map(x => `<dt>${e(x.navn)}</dt><dd>${e(x.forklaring)}</dd>`).join('')}</dl>` : ''}
      </div></div>`).join('')}
    </div>
    ${p.bilde ? `<div style="max-width:520px">${bilde(p.bilde)}</div>` : ''}
  </section>` : '';

  // Kart
  const pl = k.plan;
  let n = 0;
  const pkt = (pl ? pl.punkter : []).map(x => ({ ...x, n: ++n }));
  const pad = 2;
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
          <g fill="#ebe5d9" stroke="#1d1b17" stroke-width=".15">${pl.rom.map(r => `<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}"></rect>`).join('')}</g>
          <g fill="#8a8274" font-family="Manrope,sans-serif" font-size="1.05" letter-spacing=".2" text-anchor="middle">${(pl.etiketter || []).map(t => `<text x="${t.x}" y="${t.y}">${e(t.t)}</text>`).join('')}</g>
          ${pkt.filter(x => x.x != null).map(x => `<a href="#sted-${e(x.id)}" data-kat="${x.kat}"><circle class="kat-${x.kat}" cx="${x.x}" cy="${x.y}" r="1.35"></circle><text x="${x.x}" y="${x.y + .46}" fill="#fff" font-family="Manrope,sans-serif" font-size="1.3" font-weight="600" text-anchor="middle">${x.n}</text></a>`).join('')}
        </svg>
        <div class="steder">${pkt.map(x => `
          <div class="sted" id="sted-${e(x.id)}" data-kat="${x.kat}">
            <span class="prikk kat-${x.kat}">${x.n}</span>
            <div><b>${e(x.navn)}</b><p>${x.tekst ? e(x.tekst) : tom()}</p>${x.x == null ? '<p class="ikkeplassert">Ikke plassert på tegningen ennå</p>' : ''}</div>
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
          <div><span>Hvor er bryterne?</span><span>${v(l.hvor)}</span></div>
          ${(l.brytere.length ? l.brytere : [{}, {}, {}]).map((b, i) => `<div><span>${b.navn ? e(b.navn) : 'Bryter ' + (i + 1)}</span><span>${v(b.styrer, 'Hva den styrer: legges inn')}</span></div>`).join('')}
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

  // Praktisk
  const prHtml = `
  <section id="praktisk" class="del">
    <div class="topp"><span class="etikett">Praktisk</span><h2>Praktisk informasjon</h2><p class="ingress">For deg som skal ha et arrangement i kirken. Informasjonen er levert av ${e(k.navn)}.</p></div>
    <div class="grid">${(k.praktisk || []).map(x => `<div class="kort"><b>${e(x.tema)}</b><p>${v(x.tekst, 'Fylles ut av kirken')}</p></div>`).join('')}</div>
  </section>`;

  // Hjelp + kontakt
  const kt = k.kontakt || {};
  const hjelpHtml = `
  <section id="hjelp" class="del">
    <div class="hjelp">
      <div class="topp"><span class="etikett lys">Hjelp</span><h2>Noe virker ikke</h2></div>
      <div class="to">
        <div>${(k.hjelp || []).map(x => `<details><summary>${e(x.q)}</summary><p>${e(x.a)}</p></details>`).join('')}</div>
        <div class="kontakter" id="kontakt">
          <div class="kkort"><span class="etikett lys">Kirkens kontaktperson</span><b>${v(kt.navn, 'Fylles ut av kirken')}</b>${kt.telefon ? `<a href="tel:${e(kt.telefon.replace(/\s/g, ''))}">${e(kt.telefon)}</a>` : ''}${kt.epost ? `<a href="mailto:${e(kt.epost)}">${e(kt.epost)}</a>` : ''}</div>
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
    <div class="kjede">${t.kjede.map(x => `<span class="ledd">${e(x)}</span>`).join('<span class="pil">→</span>')}</div>
    <div class="to">
      <div class="liste">${t.spesifikasjoner.map(r => `<div><span>${e(r[0])}</span><span>${v(r[1])}</span></div>`).join('')}</div>
      ${bilde(t.bilde)}
    </div>
  </section>` : '';

  const gal = (k.galleri || []).length ? `
  <section class="del">
    <div class="topp"><h3>Flere bilder og videoer</h3></div>
    <div class="grid">${k.galleri.map(g => g.video ? video(g) : bilde(g)).join('')}</div>
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



<style>
html{scroll-behavior:smooth;scroll-padding-top:84px}
body{margin:0;background:#f3efe6;color:#1d1b17;font-family:'Manrope',sans-serif;font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:#a8432a;text-decoration:none}
a:hover{color:#7a2e1b}
h1,h2,h3{font-family:'Cormorant Garamond',serif;font-weight:300;margin:0;letter-spacing:-.015em}
h2{font-size:clamp(38px,4.4vw,58px);line-height:1}
h3{font-size:30px;line-height:1.1;font-weight:400}
p{margin:0;text-wrap:pretty}
.wrap{max-width:1140px;margin:0 auto;padding:0 24px}
.del{padding-top:104px;display:flex;flex-direction:column;gap:36px}
.topp{display:flex;flex-direction:column;gap:12px;max-width:720px}
.etikett{font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#a8432a;font-weight:600}
.etikett.lys{color:#e0a27f}
.ingress{font-size:19px;color:#4a453c}
.blokk{display:flex;flex-direction:column;gap:20px}
.to{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr));gap:32px;align-items:start}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:14px}
.kort{background:#ebe5d9;border-radius:10px;padding:22px;display:flex;flex-direction:column;gap:8px}
.kort b{font-size:18px;font-weight:600}
.tom{color:#8a8274;font-style:italic}
.bilde{aspect-ratio:4/3;border-radius:10px;border:1.5px dashed #b9b0a0;background:#ebe5d9;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center;padding:16px;color:#6d665b;font-size:14px;line-height:1.35;box-sizing:border-box}
.bilde span{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:#8a8274}
.bred{aspect-ratio:16/9}
.foto{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px;display:block}
.foto.bred{aspect-ratio:16/9}
.video,.vid{width:100%;aspect-ratio:16/9;border-radius:10px;background:#1d1b17;display:block}
.video{color:#d9d1c2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:18px;font-size:15px;box-sizing:border-box}
.play{width:0;height:0;border-left:20px solid #e0a27f;border-top:12px solid transparent;border-bottom:12px solid transparent}
.pille{font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:5px 12px;border-radius:999px;background:#e8e1d4;color:#6d665b}
.pille.mork{background:#3a352d;color:#d9d1c2}
.liste{display:flex;flex-direction:column;border-top:1px solid rgba(29,27,23,.15)}
.liste>div{display:grid;grid-template-columns:minmax(0,210px) minmax(0,1fr);gap:4px 24px;padding:14px 4px;border-bottom:1px solid rgba(29,27,23,.15)}
.liste>div>span:first-child{font-weight:600}
@media (max-width:600px){.liste>div{grid-template-columns:1fr}}
nav a{color:#1d1b17;padding:6px 0;border-bottom:2px solid transparent}
nav a:hover{color:#a8432a;border-color:#a8432a}
.oppgaver{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:12px}
.oppg{text-align:left;font:inherit;color:#1d1b17;background:#fbf9f4;border:0;box-shadow:inset 0 0 0 1.5px rgba(29,27,23,.14);border-radius:12px;padding:22px;cursor:pointer;display:flex;flex-direction:column;justify-content:space-between;gap:10px;min-height:128px;box-sizing:border-box}
.oppg b{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:400;line-height:1.1}
.oppg span{color:#6d665b;font-size:15px}
.oppg:hover{box-shadow:inset 0 0 0 1.5px #a8432a;color:#1d1b17}
.oppg[aria-pressed=true]{background:#1d1b17;color:#f3efe6;box-shadow:none}
.oppg[aria-pressed=true] span{color:#bdb4a5}
.oppgpanel{display:flex;flex-direction:column;gap:28px;background:#fbf9f4;border-radius:14px;padding:28px}
.oppgpanel[data-skjul]{display:none}
.steg{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:22px}
.steg li{display:flex;flex-direction:column;gap:12px}
.stegnr i{font-style:normal;width:38px;height:38px;border-radius:50%;background:#a8432a;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:17px}
.steg p{font-size:18px;line-height:1.5}
.steg .tips{font-size:15px;color:#4a453c;background:#ebe5d9;border-radius:8px;padding:10px 12px}
.etter-rad{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:22px;align-items:center;border-top:1px solid rgba(29,27,23,.12);padding-top:24px}
.etter{display:flex;flex-direction:column;gap:8px;font-size:18px}
.panel{background:#1d1b17;border-radius:22px;padding:22px;box-shadow:0 0 0 10px #3a352d;display:flex;flex-direction:column;gap:18px;color:#f3efe6;margin:10px}
.prad{display:grid;grid-template-columns:28px minmax(0,1fr);gap:12px;align-items:center}
.prad em,.forklar em{font-style:normal;width:28px;height:28px;border-radius:50%;background:#e0a27f;color:#1d1b17;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;flex:none}
.pknapper{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px}
.pk{border-radius:8px;padding:14px 10px;background:#2f2a24;font-size:14px;font-weight:600;text-align:center}
.pk.valgt{background:#f3efe6;color:#1d1b17}
.fadere{display:flex;justify-content:space-between;gap:6px;background:#26221d;border-radius:10px;padding:14px 8px}
.fader{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:11px;color:#bdb4a5;text-align:center;flex:1}
.spor{width:6px;height:96px;background:#3a352d;border-radius:3px;position:relative}
.knott{position:absolute;left:50%;transform:translateX(-50%);width:24px;height:12px;background:#d9d1c2;border-radius:3px}
.avk{background:#b3261e;color:#fff;border-radius:8px;padding:14px;text-align:center;font-weight:600;font-size:14px;letter-spacing:.06em}
.ui{position:relative;margin:0;border-radius:14px;overflow:hidden;background:#111;box-shadow:0 0 0 10px #2a2621;margin:10px}
.ui img{width:100%;display:block}
.merke{position:absolute;transform:translate(-50%,-50%);width:clamp(26px,3.4vw,40px);height:clamp(26px,3.4vw,40px);border-radius:50%;background:#e0a27f;color:#1d1b17;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:clamp(13px,1.6vw,19px);box-shadow:0 0 0 3px #1d1b17}
.forklar{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:26px 36px}
.forklar>div{display:grid;grid-template-columns:28px minmax(0,1fr);gap:14px}
.forklar b{font-size:19px;display:block;margin-bottom:4px}
.forklar p{color:#4a453c}
.forklar dl{margin:8px 0 0;display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 14px;font-size:16px}
.forklar dt{font-weight:600}
.forklar dd{margin:0;color:#4a453c}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}
.chip{font:500 15px 'Manrope',sans-serif;color:#1d1b17;background:transparent;border:0;box-shadow:inset 0 0 0 1px rgba(29,27,23,.25);border-radius:999px;padding:10px 18px;cursor:pointer;display:flex;align-items:center;gap:8px}
.chip i{width:10px;height:10px;border-radius:50%}
.chip[aria-pressed=true]{background:#1d1b17;color:#f3efe6;box-shadow:none}
.kart svg{width:100%;max-width:480px;background:#fbf9f4;border-radius:12px;display:block}
.kat-lyd{background:#a8432a;fill:#a8432a}.kat-lys{background:#8f6512;fill:#8f6512}.kat-praktisk{background:#3f6b5a;fill:#3f6b5a}
.kart[data-filter=lyd] [data-kat]:not([data-kat=lyd]),.kart[data-filter=lys] [data-kat]:not([data-kat=lys]),.kart[data-filter=praktisk] [data-kat]:not([data-kat=praktisk]){display:none}
.steder{display:flex;flex-direction:column;gap:6px}
.sted{display:grid;grid-template-columns:32px minmax(0,1fr) 120px;gap:14px;align-items:start;padding:12px;border-radius:10px}
.sted:target{background:#ebe5d9}
.sted b{font-size:17px}
.sted p{font-size:15px;color:#4a453c}
.sted .ikkeplassert{font-size:13px;color:#8a8274}
.bilde.liten{padding:8px;font-size:12px;border-radius:8px}
.bilde.liten span{font-size:9px}
.prikk{width:30px;height:30px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px}
@media (max-width:520px){.sted{grid-template-columns:32px minmax(0,1fr)}.sted .bilde,.sted .foto{grid-column:2}}
.fra-kirken{font-size:15px;color:#6d665b}
.hjelp{background:#1d1b17;color:#f3efe6;border-radius:16px;padding:44px 36px;display:flex;flex-direction:column;gap:32px}
.hjelp details{border-bottom:1px solid #3a352d;padding:16px 2px}
.hjelp summary{cursor:pointer;font-weight:600;font-size:18px;list-style:none;display:flex;justify-content:space-between;gap:16px}
.hjelp summary::-webkit-details-marker{display:none}
.hjelp summary::after{content:"+";color:#e0a27f;font-size:24px;line-height:1}
.hjelp details[open] summary::after{content:"–"}
.hjelp details p{margin-top:10px;color:#d9d1c2}
.kontakter{display:flex;flex-direction:column;gap:12px}
.kkort{background:#2a2621;border-radius:12px;padding:22px;display:flex;flex-direction:column;gap:6px}
.kkort b{font-size:19px}
.kkort a{color:#f3efe6}
.kkort a:hover{color:#e0a27f}
.kkort .tlf{font-family:'Cormorant Garamond',serif;font-size:38px;line-height:1.1}
.kkort .tom{color:#a39a8b}
.kjede{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.ledd{background:#fbf9f4;box-shadow:inset 0 0 0 1px rgba(29,27,23,.15);border-radius:8px;padding:10px 14px;font-size:15px;font-weight:500}
.pil{color:#a8432a}
.hjelpknapp{position:fixed;right:18px;bottom:18px;z-index:20;background:#a8432a;color:#fff;border-radius:999px;padding:14px 22px;font-weight:600;box-shadow:0 8px 24px rgba(29,27,23,.22)}
.hjelpknapp:hover{background:#7a2e1b;color:#fff}
</style>
<link rel="stylesheet" href="/rom.css">
</head>
<body>
<header style="position:sticky;top:0;z-index:10;background:rgba(243,239,230,.94);backdrop-filter:blur(8px);border-bottom:1px solid rgba(29,27,23,.1)">
  <div class="wrap" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px 24px;padding-top:12px;padding-bottom:12px">
    <a href="/" style="display:flex;flex-direction:column;color:#1d1b17;line-height:1.1"><span style="font-family:'Cormorant Garamond',serif;font-size:22px">${e(k.navn)}</span><span style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#6d665b">← Alle kirker</span></a>
    <nav style="display:flex;flex-wrap:wrap;gap:4px 20px;font-size:15px;font-weight:500">
      <a href="#start">Kom i gang</a>${kartHtml ? '<a href="#kart">Finn fram</a>' : ''}${panelHtml ? '<a href="#panel">Panelet</a>' : ''}${lysHtml ? '<a href="#lys">Lys</a>' : ''}<a href="#praktisk">Praktisk</a><a href="#kontakt">Kontakt</a>${tekHtml ? '<a href="#teknisk">Teknisk</a>' : ''}
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

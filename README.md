# kirker.danbolt.no

Én veiledningsside per kirke med Kirkelydpakken. Alle sidene lages fra samme mal.

## Hvem endrer hva

| Hvem | Hvor | Hva |
|---|---|---|
| Kirken | Sin egen hemmelige lenke (`/rediger/#…`) | Praktisk informasjon og kontaktperson |
| Danbolt | `/admin/` (passord) | Bilder, plantegning og punkter, panel, tekster, nye kirker, kirkens lenke |

Alt som lagres, blir en vanlig endring i dette repoet. Netlify bygger da sidene på nytt, og endringen er ute etter omtrent ett minutt. Historikken i GitHub viser hvem som endret hva, og alt kan rulles tilbake.

## Filene

- `_data/<kirke>.json` – teknisk innhold (Danbolt)
- `_data/<kirke>.praktisk.json` – praktisk innhold (kirken)
- `bilder/<kirke>/` – bilder, lastet opp fra `/admin/`
- `_verktoy/lag-side.mjs` – malen for kirkesidene. Endres den, endres alle kirkene.
- `_verktoy/felt.mjs` – feltene kirken fyller ut
- `_verktoy/bygg.mjs` – bygger alle sider og forsiden til `_site/`
- `kirke.css`, `stil.css`, `fonter/` – design
- `admin/`, `rediger/` – redigeringssidene
- `netlify/functions/api.mjs` – lagringen bak redigeringssidene

En kirke med `"kommer": true` vises på forsiden som «Side kommer». En side med `"publisert": true` er ferdig: «under arbeid» fjernes, tomme plasser skjules og søkemotorer slipper til.

## Oppsett i Netlify (gjøres én gang)

Tre miljøvariabler på prosjektet `danbolt-kirker`, med scope **Functions**:

- `GITHUB_TOKEN` – fine-grained token fra GitHub med tilgang til bare dette repoet og rettigheten **Contents: Read and write**
- `ADMIN_PASSORD` – passordet til `/admin/` (minst 8 tegn, helst en lang setning)
- `LENKE_HEMMELIGHET` – en lang tilfeldig tekst. Byttes den, slutter alle kirkenes lenker å virke.

Etter at variablene er lagt inn, må siden deployes på nytt.

## Bygge lokalt

```
node _verktoy/bygg.mjs
```

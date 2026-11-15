import { createHmac } from 'node:crypto';

// Feltene kirken selv fyller ut. Brukes av redigeringssiden, API-et og sidemalen.
// Legg til et felt her, så dukker det opp alle tre steder.
export const FELT = [
  { id: 'parkering', tema: 'Parkering', gruppe: 'Ankomst og adgang', hjelp: 'Hvor kan man parkere, hvor mange plasser, HC-parkering?' },
  { id: 'nokkel', tema: 'Nøkkel og adgang', gruppe: 'Ankomst og adgang', hjelp: 'Hvem låser opp, hvor hentes nøkkel, alarm?' },
  { id: 'universell', tema: 'Universell utforming', gruppe: 'Ankomst og adgang', hjelp: 'Rullestolinngang, trinnfri adkomst, HC-toalett, reserverte plasser?' },
  { id: 'lasting', tema: 'Lasting og rigging', gruppe: 'Ankomst og adgang', hjelp: 'Hvor kan man kjøre inn utstyr, bæreavstand, trapper, når kan man rigge?' },
  { id: 'toalett', tema: 'Toalett', gruppe: 'I kirken', hjelp: 'Hvor er det, og er det åpent under arrangementer?' },
  { id: 'garderobe', tema: 'Garderobe', gruppe: 'I kirken', hjelp: 'For publikum og for medvirkende.' },
  { id: 'kjokken', tema: 'Kjøkken', gruppe: 'I kirken', hjelp: 'Finnes det, og kan arrangører bruke det?' },
  { id: 'wifi', tema: 'Wi-Fi', gruppe: 'I kirken', hjelp: 'Nettverk og passord, eller hvem man spør. Husk at siden er åpen for alle.' },
  { id: 'oppvarming', tema: 'Oppvarming om vinteren', gruppe: 'Temperatur og strøm', hjelp: 'Hvor lang tid tar det å varme opp kirken, hvem skrur på, hvilken temperatur kan man forvente? Viktig for instrumenter og kor.' },
  { id: 'strom', tema: 'Strøm til eget utstyr', gruppe: 'Temperatur og strøm', hjelp: 'Hvor er stikkontaktene, hvor mye kan belastes, finnes det 16A/32A?' },
  { id: 'brann', tema: 'Brann og nødutgang', gruppe: 'Sikkerhet', hjelp: 'Nødutganger, brannslukkere, maks antall personer, hvem er ansvarlig?' },
  { id: 'lys', tema: 'Lysbrytere', gruppe: 'Lys', hjelp: 'Hvor er bryterne, og hva styrer de?', visesUnder: 'lys' },
  { id: 'annet', tema: 'Annet', gruppe: 'Annet', hjelp: 'Noe mer arrangører bør vite? Regler, ting som ofte går galt, tips.' },
];

export const TOM_PRAKTISK = () => ({
  felt: Object.fromEntries(FELT.map(f => [f.id, ''])),
  kontakt: { navn: '', telefon: '', epost: '' },
  oppdatert: '',
});

// Adressen til kirkesiden. En skjult kirke får en forhåndsvisning på en adresse som ikke kan gjettes.
export const sideSti = (k, hemmelighet) => k.skjult
  ? `/utkast/${k.slug}-${createHmac('sha256', hemmelighet).update('utkast:' + k.slug).digest('hex').slice(0, 14)}/`
  : `/${k.slug}/`;

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

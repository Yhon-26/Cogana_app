import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const source = readFileSync('design/store-redesign/App.tsx', 'utf8');
mkdirSync('src/assets/store/redesign', { recursive: true });
function saveSvg(markup, name, size, color = '#295D43') {
  const svg = markup
    .replace(
      '<svg ',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" color="${color}" `,
    )
    .replace(/ aria-hidden="[^"]*"/g, '')
    .replaceAll('strokeWidth', 'stroke-width')
    .replaceAll('strokeLinecap', 'stroke-linecap');
  writeFileSync(`src/assets/store/redesign/${name}.svg`, `${svg}\n`);
}
const art = [...source.matchAll(/<svg viewBox="0 0 48 48"[\s\S]*?<\/svg>/g)];
saveSvg(art[0][0], 'oil', 48);
saveSvg(art[2][0], 'grains', 48);
for (const name of ['pin', 'search']) {
  const body = source.match(new RegExp(`${name}: <>((?:.|\\n)*?)</>,`))[1];
  saveSvg(
    `<svg viewBox="0 0 24 24" fill="none" stroke="#295D43" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`,
    name,
    24,
  );
}
writeFileSync(
  'src/assets/store/redesign/banner-pattern.svg',
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160" viewBox="0 0 400 160"><defs><pattern id="grain" width="26" height="20" patternUnits="userSpaceOnUse"><ellipse cx="0" cy="0" rx="2" ry="2" fill="#FCF9F1"/><ellipse cx="13" cy="10" rx="2" ry="2" fill="#FCF9F1"/></pattern></defs><rect x="-100" y="-100" width="600" height="400" fill="url(#grain)" transform="rotate(-16 200 80)"/></svg>\n',
);

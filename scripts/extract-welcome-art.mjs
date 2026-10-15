import { readFileSync, writeFileSync } from 'node:fs';

// Preserve the vector artwork supplied in the welcome redesign ZIP.
const source = readFileSync('design/welcome-redesign/App.tsx', 'utf8');
const names = {
  RiceGrains: 'rice-grains',
  LentilCluster: 'lentil-cluster',
  CornCob: 'corn-cob',
  GrainSack: 'grain-sack',
  WoodenSpoon: 'wooden-spoon',
  ChickpeaSprig: 'chickpea-sprig',
  LocationIcon: 'redesign-map-pin',
};
function svgAsset(markup, name) {
  const viewBox = markup.match(/viewBox="([^"]+)"/)[1].split(' ');
  const svg = markup
    .replace(
      '<svg ',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${viewBox[2]}" height="${viewBox[3]}" `,
    )
    .replace(/ className="[^"]*"| aria-hidden="[^"]*"/g, '')
    .replaceAll('strokeWidth', 'stroke-width')
    .replaceAll('strokeLinecap', 'stroke-linecap')
    .replaceAll('strokeLinejoin', 'stroke-linejoin')
    .replaceAll('strokeDasharray', 'stroke-dasharray');
  writeFileSync(`src/assets/welcome/${name}.svg`, `${svg}\n`);
}
for (const [component, name] of Object.entries(names)) {
  const body = source.slice(source.indexOf(`function ${component}()`));
  let markup = body.match(/<svg[\s\S]*?<\/svg>/)[0];
  if (component === 'LocationIcon') {
    markup = markup.replace('<svg ', '<svg fill="none" stroke="#fffdf6" stroke-width="1.8" ');
  }
  svgAsset(markup, name);
}
const arrow = source.match(
  /<svg viewBox="0 0 24 24" aria-hidden="true">\s*<path d="M5 12h14[\s\S]*?<\/svg>/,
)[0];
svgAsset(
  arrow.replace(
    '<svg ',
    '<svg fill="none" stroke="#fffdf7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ',
  ),
  'redesign-arrow',
);

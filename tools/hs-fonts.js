// Serves Hourstone's three Google fonts (Big Shoulders Display, Hanken Grotesk, VT323) from the @fontsource npm packages, because the sandbox can't reach Google Fonts.
const path = require('path');
const NM = path.join(__dirname, 'node_modules', '@fontsource');
const FACES = [['Big Shoulders Display', 'big-shoulders-display', [700, 800, 900], 'normal'], ['Hanken Grotesk', 'hanken-grotesk', [400, 700], 'normal'], ['Hanken Grotesk', 'hanken-grotesk', [400], 'italic'], ['VT323', 'vt323', [400], 'normal']];
const CSS = FACES.flatMap(([fam, dir, ws, st]) => ws.map(w => `@font-face{font-family:'${fam}';font-style:${st};font-weight:${w};src:url(https://fonts.local/${dir}/files/${dir}-latin-${w}-${st}.woff2) format('woff2')}`)).join('\n');
module.exports = async function routeFonts(page) {
  await page.route(/fonts\.googleapis\.com/, r => r.fulfill({ body: CSS, contentType: 'text/css' }));
  await page.route(/fonts\.gstatic\.com/, r => r.abort());
  await page.route(/fonts\.local/, r => r.fulfill({ path: path.join(NM, r.request().url().split('fonts.local/')[1]), contentType: 'font/woff2' }));
};

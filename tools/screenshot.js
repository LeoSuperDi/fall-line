// Screenshots of places around the resort, saved to tools/shots/.
//   node tools/screenshot.js                       title, village and every summit
//   node tools/screenshot.js crater dunes_base     any spawn names from SPAWNS in js/data.js
//   node tools/screenshot.js --mobile village      phone-sized
const fs = require('fs'), path = require('path');
const { openGame, travelTo } = require('./harness');
const args = process.argv.slice(2), mobile = args.includes('--mobile');
const places = args.filter(a => !a.startsWith('--'));
const list = places.length ? places : ['village', 'summit', 'pine_top', 'ember_top', 'dunes_top', 'crags_top', 'aurora_top'];
(async () => {
  const dir = path.join(__dirname, 'shots'); fs.mkdirSync(dir, { recursive: true });
  const { browser, page, errors } = await openGame({ mobile });
  await page.waitForTimeout(1500); await page.screenshot({ path: path.join(dir, 'title.png') });
  await page.click('#tNew'); await page.waitForTimeout(800);
  await page.evaluate(() => { __fl.save.time = 0.3; });
  for (const p of list) { await travelTo(page, p); await page.waitForTimeout(3000); await page.screenshot({ path: path.join(dir, p + (mobile ? '-mobile' : '') + '.png') }); console.log('saved', p); }
  await page.evaluate(() => __fl.openOv('mapOv')); await page.waitForTimeout(6000); await page.screenshot({ path: path.join(dir, 'map.png') });
  console.log('errors', errors); await browser.close();
})();

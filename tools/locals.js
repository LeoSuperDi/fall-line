// Portraits of each mountain's local, plus a look at the volcano and the dunes.
const fs = require('fs'), path = require('path');
const { openGame, travelTo } = require('./harness');
(async () => {
  const dir = path.join(__dirname, 'shots'); fs.mkdirSync(dir, { recursive: true });
  const { browser, page, errors } = await openGame({ width: 960, height: 540 });
  await page.click('#tNew'); await page.waitForTimeout(800); await page.evaluate(() => { __fl.save.time = 0.3; });
  const spots = { wren: 'pine_base', ignis: 'ember_base', sabi: 'dunes_base', brann: 'crags_base', lumi: 'aurora_base' };
  for (const id in spots) {
    await travelTo(page, spots[id]); await page.waitForTimeout(2500);
    await page.evaluate(id => { const n = __fl.npcs.find(n => n.id === id), a = n.yaw || 0; __fl.CAM.lock = { pos: { x: n.x + Math.sin(a) * 2.6 + 0.8, y: n.y + 1.5, z: n.z - Math.cos(a) * 2.6 }, look: { x: n.x, y: n.y + 1.0, z: n.z } }; }, id);
    await page.waitForTimeout(500); await page.screenshot({ path: path.join(dir, 'local-' + id + '.png'), clip: { x: 230, y: 40, width: 500, height: 460 } });
    await page.evaluate(() => { __fl.CAM.lock = null; });
  }
  for (const s of ['ember_top', 'dunes_top']) { await travelTo(page, s); await page.waitForTimeout(5000); await page.screenshot({ path: path.join(dir, 'vib-' + s + '.png') }); }
  console.log('errors', errors); await browser.close();
})();

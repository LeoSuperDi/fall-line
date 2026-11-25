// Carve a few turns and look back at the tracks from close behind.
const fs = require('fs'), path = require('path');
const { openGame, travelTo } = require('./harness');
(async () => {
  const dir = path.join(__dirname, 'shots'); fs.mkdirSync(dir, { recursive: true });
  const { browser, page, errors } = await openGame({ width: 960, height: 540 });
  await page.click('#tNew'); await page.waitForTimeout(800); await page.evaluate(() => { __fl.save.time = 0.3; });
  for (const spot of process.argv.slice(2).length ? process.argv.slice(2) : ['summit', 'pine_top']) {
    await travelTo(page, spot); await page.keyboard.down('ArrowUp'); await page.waitForTimeout(1500); await page.keyboard.up('ArrowUp');
    for (let i = 0; i < 4; i++) { const k = i % 2 ? 'ArrowLeft' : 'ArrowRight'; await page.keyboard.down(k); await page.waitForTimeout(700); await page.keyboard.up(k); }
    await page.evaluate(() => { const P = __fl.P, b = P.h + Math.PI, d = 5; __fl.CAM.lock = { pos: { x: P.x + Math.sin(P.h) * d, y: P.y + 3, z: P.z - Math.cos(P.h) * d }, look: { x: P.x - Math.sin(P.h) * 6, y: P.y - 1, z: P.z + Math.cos(P.h) * 6 } }; __fl.P.s = 0; });
    await page.waitForTimeout(500); await page.screenshot({ path: path.join(dir, 'tracks-' + spot + '.png') });
    await page.evaluate(() => { __fl.CAM.lock = null; });
  }
  console.log('errors', errors); await browser.close();
})();

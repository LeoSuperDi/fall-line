// Ski down from every summit and report how far you dropped, your top speed, crashes and time in the air.
// A healthy run: tens of metres dropped, 40-90 km/h, no unasked-for air time.
//   node tools/ride.js [spawn names...]
const fs = require('fs'), path = require('path');
const { openGame, travelTo } = require('./harness');
const list = process.argv.slice(2).length ? process.argv.slice(2) : ['summit', 'pine_top', 'ember_top', 'dunes_top', 'crags_top', 'aurora_top'];
(async () => {
  const dir = path.join(__dirname, 'shots'); fs.mkdirSync(dir, { recursive: true });
  const { browser, page, errors } = await openGame({ width: 960, height: 540 });
  await page.click('#tNew'); await page.waitForTimeout(800);
  for (const spot of list) {
    await travelTo(page, spot); await page.waitForTimeout(800);
    const y0 = await page.evaluate(() => __fl.P.y);
    await page.keyboard.down('ArrowUp'); await page.waitForTimeout(1500); await page.keyboard.up('ArrowUp');
    let top = 0, air = 0, crashes = 0;
    for (let i = 0; i < 24; i++) {
      if (i % 6 === 0) { const k = (i / 6) % 2 ? 'ArrowLeft' : 'ArrowRight'; await page.keyboard.down(k); setTimeout(() => page.keyboard.up(k), 350); }
      await page.waitForTimeout(250);
      const r = await page.evaluate(() => [Math.hypot(__fl.P.vx, __fl.P.vz) * 3.6, __fl.P.air, __fl.P.crash > 0]);
      top = Math.max(top, r[0]); if (r[1]) air++; if (r[2]) crashes++;
    }
    const y1 = await page.evaluate(() => __fl.P.y);
    console.log(spot.padEnd(12), 'dropped', String(Math.round(y0 - y1)).padStart(4), 'm   top', String(Math.round(top)).padStart(3), 'km/h   airborne samples', air, '  crash samples', crashes);
    await page.screenshot({ path: path.join(dir, 'ride-' + spot + '.png') });
  }
  console.log('errors', errors); await browser.close();
})();

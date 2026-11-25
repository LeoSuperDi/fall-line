// Stand on each connector just before its bridge, tunnel or canyon and look ahead along it.
//   node tools/features.js
const fs = require('fs'), path = require('path');
const { openGame, travelTo } = require('./harness');
(async () => {
  const dir = path.join(__dirname, 'shots'); fs.mkdirSync(dir, { recursive: true });
  const { browser, page, errors } = await openGame({ width: 960, height: 540 });
  await page.click('#tNew'); await page.waitForTimeout(800); await page.evaluate(() => { __fl.save.time = 0.3; });
  const BACK = +(process.env.BACK || 12);
  const names = process.argv.slice(2).length ? process.argv.slice(2) : ['Pine Gap Traverse', 'Echo Canyon Road', 'Crystal Tunnel Run', 'Red Rock Canyon', 'Lowpine Bridge Way'];
  for (const n of names) {
    const ok = await page.evaluate(([n, back, mode]) => {
      const R = __fl.RUNS.find(r => r.name === n); if (!R) return false;
      let k = mode ? R.path.findIndex(p => p.mode === mode) : R.path.findIndex(p => p.mode || Math.abs(p.cut) > 8); if (k < 0) k = R.path.length >> 1; k = Math.max(0, k - back);
      const p = R.path[k], P = __fl.P; P.x = p.x; P.z = p.z; P.h = Math.atan2(p.tx, -p.tz); P.s = 0; P.vx = P.vz = 0; P.y = p.hc + 2; P.air = false; __fl.CAM.yaw = P.h; return true;
    }, [n, BACK, process.env.MODE || '']);
    if (!ok) { console.log('missing', n); continue; }
    await page.waitForTimeout(7000);
    await page.screenshot({ path: path.join(dir, 'feat-' + n.split(' ')[0].toLowerCase() + (BACK !== 12 ? '-' + BACK : '') + '.png') });
    console.log('saved', n, JSON.stringify(await page.evaluate(() => [Math.round(__fl.P.y), __fl.P.air])));
  }
  console.log('errors', errors); await browser.close();
})();

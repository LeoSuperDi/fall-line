// Lands 20 flips in a row in one stage and logs what each one paid out, to see where rewards stop.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { __hs.startStage(0, 0, true); __hs.L.obs.length = 0; setInterval(() => { __hs.P.hearts = 9; }, 100); });
  for (let n = 0; n < 20; n++) {
    await p.waitForFunction(() => __hs.state === 'play' && __hs.P.ground, null, { timeout: 15000 }).catch(() => {});
    await p.waitForTimeout(300);
    const before = await p.evaluate(() => ({ t: __hs.L.tricks, f: __hs.L.finds.length, sc: __hs.L.score }));
    await p.keyboard.press('Space'); await p.waitForTimeout(80);
    await p.evaluate(() => { if (!__hs.P.ground) __hs.P.trick = 6.6; });
    let reel = false; for (let k = 0; k < 120; k++) { await p.waitForTimeout(25); const st = await p.evaluate(() => __hs.state); if (st === 'slow' || st === 'reel') reel = true; if (st === 'play' && await p.evaluate(() => __hs.P.ground) && k > 6) break; }
    await p.waitForFunction(() => __hs.state === 'play', null, { timeout: 8000 }).catch(() => {});
    const after = await p.evaluate(() => ({ t: __hs.L.tricks, f: __hs.L.finds.length, sc: __hs.L.score, st: __hs.state, x: Math.round(__hs.P.x), fin: __hs.L.finish }));
    console.log(n + 1, 'trick counted:', after.t > before.t, 'points +' + (after.sc - before.sc), 'reel:', reel, 'find:', after.f > before.f, after.st, after.x + '/' + after.fin);
  }
  console.log('errors', errs); await b.close();
})();

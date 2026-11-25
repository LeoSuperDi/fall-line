// Lands a real flip in play and screenshots the time-stop reel mid-spin and stopped.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { __hs.save.album = { 0: 1, 3: 1 }; __hs.startStage(0, 0, true); __hs.L.obs.length = 0; });
  let got = false;
  await p.evaluate(() => setInterval(() => { __hs.P.hearts = 9; }, 100));
  for (let tries = 0; tries < 10 && !got; tries++) {
    await p.waitForTimeout(800); await p.keyboard.press('Space'); await p.waitForTimeout(80);
    await p.evaluate(() => { if (!__hs.P.ground) __hs.P.trick = 6.6; }); /* count the jump as one full flip, skis stay level for a clean landing */
    for (let k = 0; k < 60; k++) { await p.waitForTimeout(25); if (await p.evaluate(() => __hs.state) === 'reel') { got = true; break; } }
  }
  console.log('reel started from a real flip:', got);
  if (!got) await p.evaluate(() => __hs.startReel(__hs.rollFind([0, 0, 1, 0], 0)));
  await p.waitForTimeout(600); await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-reel-spin.png') });
  await p.waitForTimeout(1200); await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-reel-stop.png') });
  await p.waitForTimeout(1500); console.log('state after', await p.evaluate(() => __hs.state), 'errors', errs); await b.close();
})();

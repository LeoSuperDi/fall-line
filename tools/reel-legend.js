// Forces a mythic and a legendary reel to screenshot the big win animation.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { __hs.startStage(4, 0, true); });
  await p.waitForTimeout(800);
  await p.evaluate(() => __hs.startReel(__hs.rollFind([0, 0, 0, 0, 1], 4), null, 2));
  await p.waitForTimeout(3050); await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-reel-mythic.png') });
  await p.waitForTimeout(3000); console.log('state', await p.evaluate(() => __hs.state), 'errors', errs); await b.close();
})();

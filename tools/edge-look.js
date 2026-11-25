// Wide-screen check of the left edge of Basecamp and of a stage start.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 640 } }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { __hs.save.told.welcome = 1; __hs.startHub(); }); await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(1500); await p.keyboard.up('ArrowLeft');
  await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-edge-hub.png') });
  await p.evaluate(() => __hs.startStage(0, 0, true)); await p.waitForTimeout(200); await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-edge-stage.png') });
  console.log('errors', errs); await b.close();
})();

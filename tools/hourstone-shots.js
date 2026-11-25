// Mid-run screenshots of every era in Hourstone.
const { chromium } = require('playwright'), path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\./, r => r.abort());
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(600);
  for (let c = 0; c < 6; c++) {
    const s = +(process.env.STAGE || 2);
    await p.evaluate(([c, s]) => __hs.startStage(c, s, true), [c, s]);
    await p.waitForTimeout(5200); await p.keyboard.down('Space'); await p.waitForTimeout(60); await p.keyboard.up('Space'); await p.waitForTimeout(220);
    await p.screenshot({ path: path.join(__dirname, 'shots', `hsplay-${c}.png`) });
  }
  await p.evaluate(() => __hs.startStage(2, 1)); await p.waitForTimeout(700); await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-dialog.png') });
  console.log('errors', errs); await b.close();
})();

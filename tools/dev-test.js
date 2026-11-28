// Opens developer mode in a stage, turns on the debug readout and can't-crash, and checks unlock and finish work.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.keyboard.press('Backquote'); await p.waitForTimeout(200);
  await p.click('[data-a="unlock"]'); await p.click('[data-t="info"]'); await p.click('[data-t="god"]');
  await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-dev.png') });
  await p.selectOption('#dStage', '4-1'); await p.click('[data-a="go"]'); await p.waitForTimeout(2500);
  await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-dev-play.png') });
  await p.keyboard.press('Backquote'); await p.waitForTimeout(150); await p.click('[data-a="finish"]'); await p.waitForTimeout(600);
  console.log('state after finish:', await p.evaluate(() => __hs.state), 'unlocked tape 6:', await p.evaluate(() => !!__hs.save.best['4-2']), 'errors', errs);
  await p.evaluate(() => localStorage.clear()); await b.close();
})();

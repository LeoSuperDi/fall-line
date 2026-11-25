// Screenshots one gap in each era, with the player paused just before it.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  for (const c of [0, 1, 2, 4]) {
    await p.evaluate(c => { __hs.startStage(c, 1, true); const L = __hs.L; L.obs.length = 0; const i = L.gap.findIndex((v, k) => v && k * 10 > 900); window.__gx = i * 10; setInterval(() => { __hs.P.hearts = 9; __hs.P.inv = 0.05; }, 40); }, c);
    await p.waitForFunction(() => __hs.P.x > window.__gx - 380, null, { timeout: 40000 }).catch(async () => console.log('stuck', c, await p.evaluate(() => [__hs.P.x, window.__gx, __hs.L.crashes]))); await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-gap-' + c + '.png') });
  }
  console.log('errors', errs); await b.close();
})();

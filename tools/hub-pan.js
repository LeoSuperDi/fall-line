// Screenshots the whole Basecamp strip in slices.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { const S = __hs.save; S.told.welcome = 1; S.best = { '0-0': { time: 50, medal: 3 }, '0-1': { time: 60, medal: 2 }, '0-2': { time: 60, medal: 1 }, '1-0': { time: 50, medal: 1 } }; __hs.startHub(0); });
  for (const [n, x] of [['a', 900], ['b', 1950], ['c', 2900], ['d', 4000]]) { await p.evaluate(x => { __hs.P.x = x; }, x); await p.waitForTimeout(900); await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-pan-' + n + '.png') }); }
  console.log('errors', errs); await b.close();
})();

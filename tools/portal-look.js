// Screenshots the time portal at the end of a chase stage and the hut portals in camp.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 720 } }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { __hs.startStage(0, 2, true); });
  await p.waitForTimeout(600);
  await p.evaluate(() => { const L = __hs.L, P = __hs.P, x = L.finish - 520; P.x = x; P.y = L.gy[Math.floor(x / 10)]; P.vy = 0; P.ground = true; L.yeti.x = x + 300; });
  await p.waitForTimeout(650); await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-portal-chase.png') });
  await p.evaluate(() => { const S = __hs.save; S.told.welcome = 1; S.best['0-2'] = { time: 50, medal: 2 }; __hs.startHub(1); __hs.P.x = 1000; }); await p.waitForTimeout(900);
  await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-portal-hut.png'), clip: { x: 300, y: 200, width: 700, height: 340 } });
  console.log('errors', errs); await b.close();
})();

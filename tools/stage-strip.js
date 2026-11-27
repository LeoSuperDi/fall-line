// Plays a stage with the bot inputs and screenshots it every 1.5 s, to eyeball object placement.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const [c, s] = [+(process.argv[2] || 0), +(process.argv[3] || 0)];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(([c, s]) => { __hs.startStage(c, s, true); setInterval(() => { const P = __hs.P, L = __hs.L; P.hearts = 9; if (P.ground) { const o = L.obs.find(o => o.x - P.x > 10 && o.x - P.x < 30 + P.s * 0.2 && !o.fly); if (o) { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' })); } } }, 16); }, [c, s]);
  for (let i = 0; i < 12; i++) { await p.waitForTimeout(1500); await p.screenshot({ path: path.join(__dirname, 'shots', `strip-${c}${s}-${i}.png`) }); }
  await b.close();
})();

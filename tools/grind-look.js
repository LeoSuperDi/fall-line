// Jumps onto the opening rail, screenshots the grind, then chains a flip and screenshots the combo and goals HUD.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { __hs.startStage(0, 0, true); window.__r = __hs.L.rails[0]; });
  await p.waitForFunction(() => __hs.P.x > window.__r[0] - 110, null, { timeout: 20000 }); await p.keyboard.press('Space');
  const ok = await p.waitForFunction(() => __hs.P.grind, null, { timeout: 3000 }).then(() => true).catch(() => false);
  console.log('grinding:', ok); await p.waitForTimeout(250); await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-grind.png') });
  await p.waitForFunction(() => !__hs.P.grind, null, { timeout: 5000 }).catch(() => {});
  await p.keyboard.press('Space'); await p.waitForTimeout(80); await p.evaluate(() => { if (!__hs.P.ground) __hs.P.trick = 6.6; });
  await p.waitForFunction(() => ['reel', 'slow'].includes(__hs.state) || (__hs.P.ground && __hs.L.tricks > 1), null, { timeout: 5000 }).catch(() => {});
  await p.waitForFunction(() => __hs.state === 'play', null, { timeout: 8000 }).catch(() => {});
  await p.keyboard.down('ShiftLeft'); await p.waitForTimeout(500); await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-combo.png') }); await p.keyboard.up('ShiftLeft');
  console.log(await p.evaluate(() => JSON.stringify({ tricks: __hs.L.tricks, combo: __hs.L.maxCombo, grind: __hs.L.st.grind.toFixed(2), boost: __hs.L.boost.toFixed(2), score: __hs.L.score, goals: __hs.L.goals, done: __hs.L.goalDone })));
  console.log('errors', errs); await b.close();
})();

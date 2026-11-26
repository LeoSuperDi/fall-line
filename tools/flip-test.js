// Real input flip test: jump, hold Right in the air, release to land. Counts flips landed per jump, on flat ground and off kickers.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { __hs.startStage(3, 1, true); __hs.L.obs.length = 0; setInterval(() => { __hs.P.hearts = 9; }, 100); window.__log = []; });
  for (let n = 0; n < 10; n++) {
    await p.waitForFunction(() => __hs.state === 'play' && __hs.P.ground, null, { timeout: 15000 }).catch(() => {});
    const kick = await p.evaluate(() => { const L = __hs.L, P = __hs.P; const k = L.kickers.find(([a0, a1, big]) => big && a1 > P.x + 200); return k ? k[1] : null; });
    if (kick) await p.waitForFunction(k => __hs.P.x > k - 40, kick, { timeout: 15000 }).catch(() => {}); else await p.waitForTimeout(250);
    const t0 = await p.evaluate(() => __hs.L.tricks);
    await p.keyboard.press('Space'); await p.waitForTimeout(40); await p.keyboard.down('ArrowRight');
    let air = 0; for (let k = 0; k < 200; k++) { await p.waitForTimeout(10); const st = await p.evaluate(() => [__hs.P.ground, __hs.P.vy, __hs.P.trick]); if (st[0]) break; air += 10;
      if (st[1] > 0 && (st[2] % 6.283) > 4.9 && (await p.evaluate(() => { const P = __hs.P; return P.y; })) ) { /* release near the end of a rotation when falling and low */ const nearGround = await p.evaluate(() => { const L = __hs.L, P = __hs.P; return L.gy[Math.floor(P.x / 10)] - P.y < 90; }); if (nearGround) { await p.keyboard.up('ArrowRight'); } } }
    await p.keyboard.up('ArrowRight');
    await p.waitForFunction(() => __hs.state === 'play', null, { timeout: 8000 }).catch(() => {});
    const r = await p.evaluate(() => ({ why: (__hs.L.whys || []).slice(-1)[0], crashes: __hs.L.crashes, tricks: __hs.L.tricks, recent: (__hs.L.recent.slice(-1)[0] || {}).n }));
    console.log(kick ? 'kicker' : 'flat  ', 'air ms ~' + air, 'landed trick:', r.tricks > t0 ? r.recent : 'none', 'crashes so far', r.crashes, r.why);
  }
  console.log('errors', errs); await b.close();
})();

// Rides a stage without ever jumping and logs every moment Arlo snaps upward onto a wall.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const [c, s] = [+(process.argv[2] || 0), +(process.argv[3] || 0)];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(([c, s]) => { __hs.startStage(c, s, true); __hs.P.hearts = 99; window.__ev = []; let py = null, pg = true;
    setInterval(() => { const P = __hs.P, L = __hs.L; if (py !== null && P.crash <= 0) { const k = L.kickers.find(([a0, a1]) => P.x > a0 - 40 && P.x < a1 + 400);
      if (P.y < py - 12 && !(k && P.x < k[1] + 5)) window.__ev.push({ x: Math.round(P.x), dy: Math.round(P.y - py), ground: P.ground, wasGround: pg, kick: k ? Math.round(P.x - k[1]) : null }); }
      py = P.y; pg = P.ground; P.hearts = 99; }, 8); }, [c, s]);
  await p.waitForTimeout(25000);
  console.log(JSON.stringify(await p.evaluate(() => window.__ev.slice(0, 20))), await p.evaluate(() => ({ falls: __hs.L.crashes, x: Math.round(__hs.P.x), fin: __hs.L.finish }))); await b.close();
})();

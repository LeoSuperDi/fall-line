// Cave stages: launch off every kicker with a full-speed jump and count how often Arlo touches the ceiling.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  for (const s of [0, 1, 2]) {
    const r = await p.evaluate(s => { __hs.startStage(1, s, true); const L = __hs.L; let hits = 0, jumps = 0;
      /* simulate: from each kicker lip, fly a max-speed jump and check the clamp line */
      for (const [a0, lip] of L.kickers) { jumps++; let x = lip, y = L.gy[Math.floor(lip / 10)], vx = 900 * Math.cos(-0.5), vy = 900 * Math.sin(-0.5) - 640;
        for (let t = 0; t < 2.5; t += 1 / 120) { vy += 1750 * (1 / 120); x += vx / 120; y += vy / 120; const i = Math.floor(x / 10); if (i >= L.n - 2) break; if (y > L.gy[i]) break;
          const g2 = d => L.gy[Math.max(0, Math.min(L.n - 1, i + d))], top = Math.min(g2(-70), g2(-50), g2(-30), g2(-15), g2(0), g2(15)); if (y < top - 480 + 60 + 48) { hits++; break; } } }
      return { jumps, hits }; }, s);
    console.log('cave stage', s + 1, JSON.stringify(r));
  }
  await b.close();
})();

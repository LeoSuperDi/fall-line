// Plays Hourstone stages with a simple bot and reports whether each can be finished.
//   node tools/hourstone-bot.js [chapter stage ...]
const { chromium } = require('playwright'), path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route(/fonts\./, r => r.abort());
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-title.png') });
  const args = process.argv.slice(2).map(Number), list = [];
  for (let i = 0; i < args.length; i += 2) list.push([args[i], args[i + 1]]);
  if (!list.length) for (let c = 0; c < 6; c++) for (let s = 0; s < 3; s++) list.push([c, s]);
  for (const [c, s] of list) {
    await p.evaluate(([c, s]) => __hs.startStage(c, s, true), [c, s]); await p.waitForTimeout(200);
    const t0 = Date.now(); let shot = false;
    const res = await p.evaluate(() => new Promise(done => {
      const H = __hs; let crashes = 0;
      const iv = setInterval(() => {
        const P = H.P, L = H.L;
        if (H.state !== 'play') { clearInterval(iv); done({ state: H.state, crashes: L.crashes, time: Math.round(L.time), shards: L.got + '/' + L.shards.length, x: Math.round(P.x), fin: L.finish }); return; }
        const near = L.obs.find(o => o.x - P.x > 20 && o.x - P.x < 40 + P.s * 0.16);
        const gy = isNaN(groundAtProbe(P.x + 40 + P.s * 0.1));
        if (P.ground && (near || gy)) document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
        document.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }));
        function groundAtProbe(x) { const i = Math.floor(x / 10); return L.gap[i] ? NaN : 0; }
      }, 16);
    }));
    console.log('chapter', c + 1, 'stage', s + 1, JSON.stringify(res));
    await p.screenshot({ path: path.join(__dirname, 'shots', `hs-${c}-${s}.png`) });
  }
  console.log('errors', errs.slice(0, 5)); await b.close();
})();

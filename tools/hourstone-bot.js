// Plays Hourstone stages with a bot that tucks, pushes and jumps what needs jumping, and reports whether each can be finished.
//   node tools/hourstone-bot.js [chapter stage ...]     (zero-based numbers; no arguments plays all 18 stages)
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); await routeFonts(p);
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(800);
  const args = process.argv.slice(2).map(Number), list = [];
  for (let i = 0; i < args.length; i += 2) list.push([args[i], args[i + 1]]);
  if (!list.length) for (let c = 0; c < 6; c++) for (let s = 0; s < 3; s++) list.push([c, s]);
  for (const [c, s] of list) {
    await p.evaluate(([c, s]) => __hs.startStage(c, s, true), [c, s]); await p.waitForTimeout(200);
    const res = await p.evaluate(() => new Promise(done => {
      const H = __hs, key = (t, code) => window.dispatchEvent(new KeyboardEvent(t, { code, bubbles: true }));
      key('keydown', 'ArrowDown'); key('keydown', 'ArrowRight'); // a decent player tucks and pushes the whole way
      const iv = setInterval(() => {
        const P = H.P, L = H.L;
        if (H.state !== 'play') { clearInterval(iv); key('keyup', 'ArrowDown'); key('keyup', 'ArrowRight'); done({ state: H.state, crashes: L.crashes, why: (L.whys || []).join(','), time: Math.round(L.time), shards: L.got + '/' + L.shards.length, x: Math.round(P.x), fin: L.finish }); return; }
        if (!P.ground) { key('keyup', 'ArrowRight'); return; } // no flipping by accident
        key('keydown', 'ArrowRight');
        const reach = 30 + P.s * 0.2, o = L.obs.find(o => o.x - P.x > 10 && o.x - P.x < reach && (!o.fly || o.k === 'geyser') && (o.k !== 'geyser' || true));
        const ahead = L.gap[Math.floor((P.x + 30 + P.s * 0.13) / 10)] && !L.gap[Math.floor(P.x / 10)];
        if (o || ahead) { key('keydown', 'Space'); key('keyup', 'Space'); }
      }, 16);
    }));
    console.log('chapter', c + 1, 'stage', s + 1, JSON.stringify(res));
  }
  console.log('errors', errs.slice(0, 5)); await b.close();
})();

// Clears a stage with the bot to record a ghost, then starts it again and screenshots the ghost and the ahead/behind readout.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  const bot = () => p.evaluate(() => new Promise(done => { const H = __hs, key = (t, code) => window.dispatchEvent(new KeyboardEvent(t, { code })); key('keydown', 'ArrowDown');
    const iv = setInterval(() => { const P = H.P, L = H.L; if (H.state !== 'play') { if (H.state === 'results') { clearInterval(iv); key('keyup', 'ArrowDown'); done(); } return; } if (!P.ground) return; const o = L.obs.find(o => o.x - P.x > 10 && o.x - P.x < 30 + P.s * 0.2 && !o.fly); const gap = L.gap[Math.floor((P.x + 30 + P.s * 0.13) / 10)] && !L.gap[Math.floor(P.x / 10)]; if (o || gap) { key('keydown', 'Space'); key('keyup', 'Space'); } }, 16); }));
  await p.evaluate(() => __hs.startStage(0, 0, true)); await bot();
  console.log('ghost saved:', await p.evaluate(() => !!localStorage.getItem('hourstone_ghost_0-0')));
  await p.evaluate(() => __hs.startStage(0, 0, true)); bot(); await p.waitForTimeout(5000);
  await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-ghost.png') });
  console.log('readout:', await p.evaluate(() => document.getElementById('ghostN').textContent), 'errors', errs); await b.close();
})();

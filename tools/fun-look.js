// New player on tape 1 stage 1: captures the first hint, a flip callout and speed lines.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { __hs.startStage(0, 0, true); setInterval(() => { __hs.P.hearts = 9; }, 100); });
  await p.waitForFunction(() => !document.getElementById('hint').classList.contains('hidden'), null, { timeout: 30000 }).catch(() => {});
  await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-hint.png') });
  await p.keyboard.press('Space'); await p.waitForTimeout(80); await p.evaluate(() => { if (!__hs.P.ground) __hs.P.trick = 13; });
  await p.waitForFunction(() => document.getElementById('callout').classList.contains('go'), null, { timeout: 8000 }).catch(() => {});
  await p.waitForFunction(() => __hs.state === 'play', null, { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(120);
  await p.evaluate(() => { const c = document.getElementById('callout'); c.classList.remove('go'); void c.offsetWidth; c.classList.add('go'); }); await p.waitForTimeout(350);
  await p.keyboard.down('ArrowDown'); await p.evaluate(() => { __hs.P.s = 1000; }); await p.waitForTimeout(200);
  await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-callout.png') }); await p.keyboard.up('ArrowDown');
  console.log('errors', errs); await b.close();
})();

// Fakes the Claude account storage: an older browser save is replaced by a newer account save, and new progress is written back to the account.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage(); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => {
    const docs = (window.__docs = {});
    docs['data/users/u1/hourstone'] = { v: 1, savedAt: 2e12, json: JSON.stringify({ save: { savedAt: 2e12, bank: 777, told: { welcome: 1 }, album: { 0: 1, 1: 1 } }, runStats: { time: 5, shards: 9, crashes: 0 } }) };
    localStorage.setItem('hourstone_save', JSON.stringify({ savedAt: 1e12, bank: 5, told: { welcome: 1 } }));
    const db = { doc: path => ({ get: async () => ({ exists: !!docs[path], data: () => docs[path] }), set: async d => { docs[path] = d; window.__writes = (window.__writes || 0) + 1; } }) };
    const user = { id: async () => 'u1' };
    window.claude = { use: async n => n === 'db' ? db : n === 'user' ? user : null };
  });
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(800);
  console.log('loaded from account:', await p.evaluate(() => [__hs.save.bank, Object.keys(__hs.save.album).length, document.getElementById('saveNote').textContent, !document.getElementById('bCont').disabled].join(' | ')));
  await p.evaluate(() => { __hs.save.bank = 999; __hs.startHub(); }); await p.evaluate(() => { __hs.save.cones.push(0); });
  await p.evaluate(() => { const S = __hs.save; S.bank = 1234; }); await p.evaluate(() => __hs.openShop && __hs.openShop());
  await p.evaluate(() => { localStorage.setItem('x', '1'); }); await p.evaluate(() => { /* trigger a persist through a normal action */ document.querySelector('#bHubMenu').click(); });
  await p.evaluate(() => __hs.startStage(0, 0, true)); await p.evaluate(() => __hs.finishStage()); await p.waitForTimeout(1800);
  console.log('written back:', await p.evaluate(() => { const d = window.__docs['data/users/u1/hourstone']; const j = JSON.parse(d.json); return [window.__writes || 0, j.save.bank, !!j.save.best['0-0']].join(' | '); }));
  console.log('errors', errs); await b.close();
})();

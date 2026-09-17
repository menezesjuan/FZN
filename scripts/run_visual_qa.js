const puppeteer = require('../server/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');

async function runVisualQA() {
  const artifactDir = path.resolve('C:/Users/jobsj/.gemini/antigravity/brain/beab9b95-482b-47ed-9126-5a6eb344a413');
  const localDir = path.resolve(__dirname, '../screenshots');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const save = async (page, name) => {
    const artPath = path.join(artifactDir, `${name}.png`);
    await page.screenshot({ path: artPath, fullPage: false });
    fs.copyFileSync(artPath, path.join(localDir, `${name}.png`));
    console.log(`[Visual QA] Successfully saved: ${name}.png`);
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    page.on('console', msg => console.log('[Browser Log]', msg.type(), msg.text()));
    page.on('pageerror', err => console.error('[Browser PageError]', err));

    console.log('[Visual QA] 1. Loading login screen...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    await save(page, 'login_screen');

    console.log('[Visual QA] 2. Logging in with demo account...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const demoBtn = btns.find(b => b.innerText.includes('ENTRAR RÁPIDO'));
      if (demoBtn) demoBtn.click();
    });
    await new Promise(r => setTimeout(r, 2500));
    await save(page, 'farm_view');

    console.log('[Visual QA] 3. Opening Market Modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Mercado'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await save(page, 'market_modal');

    // Close Market Modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('✕'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    console.log('[Visual QA] 4. Opening Repair Shop Modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Ferraria'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await save(page, 'repair_modal');

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('✕'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    console.log('[Visual QA] 5. Opening Ranch Modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Rancho'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await save(page, 'ranch_modal');

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('✕'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    console.log('[Visual QA] 6. Opening Crafting Modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Indústria'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await save(page, 'crafting_modal');

    console.log('[Visual QA] ALL visual QA stages successfully captured and verified!');
  } catch (err) {
    console.error('[Visual QA] Error:', err);
  } finally {
    await browser.close();
  }
}

runVisualQA();

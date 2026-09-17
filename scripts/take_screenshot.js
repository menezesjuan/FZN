const puppeteer = require('../server/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');

async function capture(name = 'baseline', url = 'http://localhost:3001') {
  const artifactDir = path.resolve('C:/Users/jobsj/.gemini/antigravity/brain/beab9b95-482b-47ed-9126-5a6eb344a413');
  const localScreenshotsDir = path.resolve(__dirname, '../screenshots');
  if (!fs.existsSync(localScreenshotsDir)) fs.mkdirSync(localScreenshotsDir, { recursive: true });

  console.log(`[QA Screenshot] Launching browser to capture ${name} at ${url}...`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));

    const artifactPath = path.join(artifactDir, `${name}.png`);
    const localPath = path.join(localScreenshotsDir, `${name}.png`);

    await page.screenshot({ path: artifactPath, fullPage: false });
    fs.copyFileSync(artifactPath, localPath);

    console.log(`[QA Screenshot] Successfully captured: ${name}`);
  } catch (err) {
    console.error(`[QA Screenshot] Error:`, err);
  } finally {
    await browser.close();
  }
}

const nameArg = process.argv[2] || 'baseline';
const urlArg = process.argv[3] || 'http://localhost:3001';
capture(nameArg, urlArg);

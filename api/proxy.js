const express = require('express');
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

const app = express();

app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing url parameter' });

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    const pairDetails = await page.evaluate(() => {
      const pd = window?.__SERVER_DATA?.route?.data?.pairDetails;
      return pd ? {
        schemaVersion: pd.schemaVersion,
        gp: pd.gp ?? null,
        cg: pd.cg ?? null,
        holdersCount: pd.holders?.count ?? null,
        holdersTotalSupply: pd.holders?.totalSupply ?? null
      } : null;
    });

    await browser.close();
    res.json(pairDetails || { error: 'pairDetails not found' });
  } catch (err) {
    if (browser) await browser.close();
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy failed', message: err.message });
  }
});

module.exports = app;

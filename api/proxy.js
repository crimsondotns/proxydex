const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });

    const pairDetails = await page.evaluate(() => {
      try {
        const data = window.__SERVER_DATA;
        const pd = data?.route?.data?.pairDetails;
        return {
          debug: {
            hasWindow: typeof window !== 'undefined',
            hasServerData: !!data,
            serverDataKeys: data ? Object.keys(data) : [],
            foundPairDetails: !!pd
          },
          result: pd ?? null
        };
      } catch (e) {
        return {
          debug: {
            error: true,
            message: e.message
          },
          result: null
        };
      }
    });

    res.status(200).json(pairDetails);

  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy failed', message: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

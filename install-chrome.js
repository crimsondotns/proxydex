const puppeteer = require('puppeteer');
puppeteer
  .install()
  .then(() => console.log('✅ Chromium installed successfully'))
  .catch(err => console.error('❌ Failed to install Chromium:', err));

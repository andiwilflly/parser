const pptr = require('puppeteer-core');

(async () => {
    const browser = await pptr.launch({
        headless: false,
        // /usr/bin/google-chrome
        // executablePath: '/Applications/Google Chrome.app/',
        // executablePath: '/usr/bin/google-chrome-stable', // because we are using puppeteer-core so we must define this option
        args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });

    const page = await browser.newPage();
    await page.goto(`google.com`, {
        waitUntil: 'networkidle2'
    });
    await page.waitFor(1000);


})();
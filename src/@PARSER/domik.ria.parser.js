const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const CONFIG = require('./utils/config.json');


const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));


const offers = {};

//const url = `https://dom.ria.com/ru/search/#category=1&realty_type=2&operation_type=1&state_id=10&city_id=10&inspected=0&period=0&notFirstFloor=1&notLastFloor=1&with_photo=1&inspected_realtors=1&fullCategoryOperation=1_2_1&page=0&limit=20&sort=inspected_sort&ch=209_f_3,214_f_${CONFIG.minArea},234_f_${CONFIG.minPrice},234_t_${CONFIG.maxPrice},242_239,247_252,265_0,1644_1644,1645_1645`;
const url = `https://dom.ria.com/ru/search/#category=4&realty_type=5&operation_type=1&state_id=10&city_id=10&inspected=0&period=0&notFirstFloor=0&notLastFloor=0&limit=0&ch=215_f_${CONFIG.minArea},219_f_4,226_0,234_f_${CONFIG.minPrice},234_t_${CONFIG.maxPrice},242_239,265_0&page=0`;

let browser = null;
let totalPages = 0;


async function parsePage(browser, number = 0) {
    try {
        const page = await browser.newPage();
        await page.goto(`${url}&page=${number}`, {
            // waitUntil: 'networkidle2'
        });

        await page.waitFor(3000);

        console.log('✨DOMIK.RIA ENTER page', number);

        totalPages = totalPages || await page.evaluate(()=> {
            return Math.max(...[...document.querySelectorAll('.pagerMobileScroll .page-link')]
                .map($link => +$link.innerText).filter(Boolean));
        });

        const rows = await page.evaluate(()=> {
            return [...document.querySelectorAll('.ticket-clear') ].map($row => {
                const link = $row.querySelector('.size18 .blue') && $row.querySelector('.size18 .blue').getAttribute('href');
                if(!link) return;
                return {
                    img: $row.querySelector('.loaded img') ? $row.querySelector('.loaded img').getAttribute('src') : 'https://www.samsung.com/etc/designs/smg/global/imgs/support/cont/NO_IMG_600x600.png',
                    title: $row.querySelector('.size18 .blue').innerText,
                    link: 'https://dom.ria.com' + link,
                    price: $row.querySelector('.size22').innerText,
                    district: '', //$row.querySelector('.i-block') ? $row.querySelector('.i-block').innerText : '',
                    color: '#ffa02b',
                    address: $row.querySelector('.size18 .blue').innerText,
                    source: 'domik.ria'
                }
            }).filter(Boolean);
        });

        rows.forEach(row => offers[row.title] = row);
        console.log('page number: ', number, 'totalPages: ', totalPages);

        await page.close();
        if(number < totalPages) await parsePage(browser, number+1);
    } catch(e) {
        console.log('✨DOMIK.RIA PAGE ERROR | ', e);
        await parsePage(browser, number+1);
    }
}


async function start() {
    console.log('DOMIK.RIA PARSER:START');

    browser = await puppeteer.launch({ headless: true });
    const context = browser.defaultBrowserContext();
    context.overridePermissions("https://dom.ria.com", ["geolocation", "notifications"]);


    await parsePage(browser, 0);
    browser.close();

    console.log('DOMIK.RIA PARSER:END');

    fs.writeFileSync(__dirname + `/reports/domik.ria.offers.json`, JSON.stringify(offers, null, 4));
}

start();
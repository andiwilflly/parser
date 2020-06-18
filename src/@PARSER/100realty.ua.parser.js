const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const CONFIG = require('./utils/config.json');


const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const offers = {};

//const url = `https://100realty.ua/realty_search/apartment/sale/nr_3,4,5_/st_${CONFIG.minArea}_/f_notfirst,notlast/p_${CONFIG.minPrice}_${CONFIG.maxPrice}/cur_4/kch_2`;
const url = `https://100realty.ua/realty_search/house/sale/st_${CONFIG.minArea}_320/sln_4_/p_${CONFIG.minPrice}_${CONFIG.maxPrice}/cur_4`;

let browser = null;
let totalPages = 0;


async function parsePage(browser, number = 0) {
    try {

        console.log('✨ 100realty.ua ENTER page', number);

        const page = await browser.newPage();
        await page.goto(`${url}?page=${number}`, {
            waitUntil: 'networkidle2'
        });

        totalPages = totalPages || await page.evaluate(()=> {
            const $links = document.querySelectorAll('.pager-item');
            if(!$links) return totalPages;
            return +$links[$links.length-2].innerText
        });

        const rows = await page.evaluate(()=> {
            return [...document.querySelectorAll('.realty-object-card') ].map($row => {
                const link = $row.querySelector('.object-address > a') && $row.querySelector('.object-address > a').getAttribute('href');
                if(!link) return;
                return {
                    img: $row.querySelector('.slides__item img') ? $row.querySelector('.slides__item img').getAttribute('src') : 'https://www.samsung.com/etc/designs/smg/global/imgs/support/cont/NO_IMG_600x600.png',
                    title: $row.querySelector('.object-address > a').innerText,
                    link: 'https://100realty.ua' + link,
                    price: $row.querySelector('.cost-field > span').innerText,
                    district: '', //$row.querySelector('.i-block') ? $row.querySelector('.i-block').innerText : '',
                    color: '#ff78c9',
                    address: $row.querySelector('.object-address > a').innerText,
                    source: '100realty.ua'
                }
            }).filter(Boolean);
        });

        rows.forEach(row => offers[row.title] = row);
        console.log('page number: ', number, 'totalPages: ', totalPages);

        await page.close();
        if(number < totalPages) await parsePage(browser, number+1);
    } catch(e) {
        console.log('✨ 100realty.ua PAGE ERROR | ', e);
        await parsePage(browser, number+1);
    }
}


async function start() {
    console.log(' 100realty.ua PARSER:START');

    browser = await puppeteer.launch({ headless: true });
    await parsePage(browser, 0);
    browser.close();

    console.log(' 100realty.ua PARSER:END');

    fs.writeFileSync(__dirname + `/reports/100realty.ua.offers.json`, JSON.stringify(offers, null, 4));
}

start();
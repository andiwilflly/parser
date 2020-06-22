const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const CONFIG = require('./utils/config.json');


const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const scrollPageToBottom = require('puppeteer-autoscroll-down');
puppeteer.use(StealthPlugin());
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const offers = {};

const url = `https://flatfy.lun.ua/продажа-домов-киевская-область?areaTotalMin=${CONFIG.minArea}&landAreaMin=5&priceMax=${CONFIG.maxPrice}&priceMin=${CONFIG.minPrice}`;

let browser = null;
let totalPages = 0;


async function parsePage(browser, number = 1) {
    try {

        console.log('✨LUN.UA ENTER page', number);

        const page = await browser.newPage();
        await page.goto(`${url}&page=${number}`, {
            waitUntil: 'networkidle2'
        });

        await scrollPageToBottom(page, 10, 10);

        totalPages = totalPages || await page.evaluate(()=> {
            return Math.max(...[...document.querySelectorAll('main + div > *')].map($link => +$link.innerText));
        });


        const rows = await page.evaluate(()=> {
            return [...document.querySelectorAll('.jss212 > article')].map($row => {
                const district = $row.querySelector('.jss241') ?
                    $row.querySelector('.jss241').innerText.trim()
                    :
                    $row.querySelector('.jss302').innerText.trim();
                return {
                    img: $row.querySelector('picture img') ?
                        $row.querySelector('picture img').getAttribute('src')
                        :
                        '',
                    title: $row.querySelector('.jss236') ?
                        $row.querySelector('.jss236').innerText.replace(/(?:\r\n|\r|\n)/g, '')
                        :
                        $row.querySelector('.jss301').innerText.replace(/(?:\r\n|\r|\n)/g, ''),
                    link: 'https://flatfy.lun.ua' +($row.querySelector('.jss295') ?
                        $row.querySelector('.jss295').getAttribute('href')
                        :
                        $row.querySelector('.jss235').getAttribute('href')),
                    price: $row.querySelector('.jss247') ?
                        $row.querySelector('.jss247').innerText
                        :
                        $row.querySelector('.jss307').innerText,
                    district,
                    color: '#218992',
                    address: $row.querySelector('.jss236') ?
                        $row.querySelector('.jss236').innerText.replace(/(?:\r\n|\r|\n)/g, '')
                        :
                        $row.querySelector('.jss301').innerText.replace(/(?:\r\n|\r|\n)/g, ''),
                    source: 'lun.ua'
                }
            })
        });

        rows.forEach(row => offers[row.title] = row);
        console.log('page number: ', number, 'totalPages: ', totalPages);

        await page.close();
        if(number < totalPages) await parsePage(browser, number+1);
    } catch(e) {
        console.log('✨LUN.UA PAGE ERROR | ', e);
        await parsePage(browser, number+1);
    }
}


async function start() {
    console.log('LUN.UA PARSER:START');

    browser = await puppeteer.launch({ headless: true });
    await parsePage(browser, 1);
    browser.close();

    console.log('LUN.UA PARSER:END');

    fs.writeFileSync(__dirname + `/reports/lun.ua.offers.json`, JSON.stringify(offers, null, 4));
}

start();
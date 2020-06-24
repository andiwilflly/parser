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

// const url = `https://www.olx.ua/nedvizhimost/kvartiry-komnaty/prodazha-kvartir-komnat/kiev/q-%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D0%B0/?search%5Bfilter_float_price%3Afrom%5D=${CONFIG.minPrice}&search%5Bfilter_float_price%3Ato%5D=${CONFIG.maxPrice}&search%5Bfilter_float_floor%3Afrom%5D=2&search%5Bfilter_float_total_area%3Afrom%5D=${CONFIG.minArea}&search%5Bfilter_float_number_of_rooms%3Afrom%5D=3&search%5Bphotos%5D=1&currency=USD`;
const url = `https://r24.ua/купить-дом-киев?price_min=${CONFIG.minPrice*26.5}&price_max=${CONFIG.maxPrice*26.5}&area_min=${CONFIG.minArea}&lot_area_min=4`;

let browser = null;
let totalPages = 0;


async function parsePage(browser, number = 1) {
    try {

        console.log('✨R24.UA ENTER page', number);

        const page = await browser.newPage();
        await page.goto(`${url}&page=${number}`, {
            waitUntil: 'networkidle2'
        });

        await scrollPageToBottom(page, 10, 10);

        totalPages = totalPages || await page.evaluate(()=> {
            return Math.max(...[...document.querySelectorAll('.pagination a')].map($el => +$el.innerText))
        });

        const rows = await page.evaluate(()=> {
            return [...document.querySelectorAll('.object_item.js-offer') ].map($row => {
                let img = $row.querySelector('.swiper-slide img');
                if(img) img = img.getAttribute('src');
                if(img && img.includes && !img.includes('base64,')) img = `https://r24.ua${img}`;
                img = img.replace('98x98', '500x500')
                return {
                    img,
                    title: $row.querySelector('.object_title_section').innerText,
                    link: `https://r24.ua/redirect/${$row.getAttribute('data-id')}`,
                    price: $row.querySelector('.object_price').innerText.split('USD')[0] + 'USD',
                    district: '',
                    color: '#ff524d',
                    address: $row.querySelector('.object_title_section').innerText.trim(),
                    source: 'r24.ua'
                }
            })
        });

        rows.forEach(row => offers[row.title] = row);
        console.log('page number: ', number, 'totalPages: ', totalPages);

        await page.close();
        if(number < totalPages) await parsePage(browser, number+1);
    } catch(e) {
        console.log('✨R24.UA PAGE ERROR | ', e);
        await parsePage(browser, number+1);
    }
}


async function start() {
    console.log('R24.UA PARSER:START');

    browser = await puppeteer.launch({ headless: true });
    await parsePage(browser, 1);
    browser.close();

    console.log('R24.UA PARSER:END');

    fs.writeFileSync(__dirname + `/reports/r24.ua.offers.json`, JSON.stringify(offers, null, 4));
}

start();
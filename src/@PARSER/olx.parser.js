const fs = require('fs');
const puppeteer = require('puppeteer-extra');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());

const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const offers = {};

const url = 'https://www.olx.ua/nedvizhimost/kvartiry-komnaty/prodazha-kvartir-komnat/kiev/q-%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D0%B0/?search%5Bfilter_float_price%3Afrom%5D=20000&search%5Bfilter_float_price%3Ato%5D=75000&search%5Bfilter_float_floor%3Afrom%5D=2&search%5Bfilter_float_total_area%3Afrom%5D=65&search%5Bfilter_float_number_of_rooms%3Afrom%5D=3&search%5Bphotos%5D=1&currency=USD';

let browser = null;
let totalPages = 0;


async function parsePage(browser, number = 1) {
    try {

        console.log('✨OLX ENTER page', number);

        const page = await browser.newPage();
        await page.goto(`${url}&page=${number}`, {
            waitUntil: 'networkidle2'
        });

        const totalPages = totalPages || await page.evaluate(()=> {
            const $links = document.querySelectorAll('.item.fleft');
            if(!$links) return totalPages;
            return +$links[$links.length-1].innerText
        });
        const rows = await page.evaluate(()=> {
            return [...document.querySelectorAll('#offers_table tr.wrap') ].map($row => {
                return {
                    img: $row.querySelector('.fleft') ? $row.querySelector('.fleft').getAttribute('src') : 'https://www.samsung.com/etc/designs/smg/global/imgs/support/cont/NO_IMG_600x600.png',
                    title: $row.querySelector('.link').innerText,
                    link: $row.querySelector('.link').getAttribute('href'),
                    price: $row.querySelector('.price').innerText,
                    district: $row.querySelector('.bottom-cell .lheight16').firstElementChild.innerText,
                    color: '#ff524d',
                    source: 'OLX'
                }
            })
        });

        rows.forEach(row => offers[row.title] = row);
        console.log('page number: ', number, 'totalPages: ', totalPages);

        await page.close();
        if(number < totalPages) await parsePage(browser, number+1);
    } catch(e) {
        console.log('✨OLX PAGE ERROR | ', e);
        await parsePage(browser, number+1);
    }
}


async function start() {
    console.log('OLX PARSER:START');

    browser = await puppeteer.launch({ headless: true });
    await parsePage(browser, 1);
    browser.close();

    console.log('OLX PARSER:END');

    fs.writeFileSync(__dirname + `/reports/olx.offers.json`, JSON.stringify(offers, null, 4));
}

start();
const fs = require('fs');
const puppeteer = require('puppeteer-extra');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());

const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const offers = {};

const url = 'https://dom.ria.com/ru/search/#category=1&realty_type=2&operation_type=1&state_id=10&city_id=10&inspected=0&period=0&notFirstFloor=0&notLastFloor=0&with_photo=1&banks_only=0&photos_count_from=0&inspected_realtors=1&limit=0&ch=209_f_3,209_t_0,214_f_60,234_t_75000,242_239,247_252,265_0,1644_1644,1645_1645';

let browser = null;
let totalPages = 50;


async function parsePage(browser, number = 0) {
    try {

        console.log('✨DOMIK.RIA ENTER page', number);

        const page = await browser.newPage();
        await page.goto(`${url}&page=${number}`, {
            waitUntil: 'networkidle2'
        });

        const maxLinks = await page.evaluate(()=> {
            const $links = document.querySelectorAll('.item.fleft');
            if(!$links) return totalPages;
            return +$links[$links.length-1].innerText
        });
        const rows = await page.evaluate(()=> {
            return [...document.querySelectorAll('#offers_table tr.wrap') ].map($row => {
                return {
                    img: $row.querySelector('.fleft') ? $row.querySelector('.fleft').getAttribute('src') : 'https://www.samsung.com/etc/designs/smg/global/imgs/support/cont/NO_IMG_600x600.png',
                    title: $row.querySelector('.link').innerText,
                    link: $row.querySelector('.link').getAttribute('href') ,
                    district: $row.querySelector('.bottom-cell .lheight16').firstElementChild.innerText
                }
            })
        });

        rows.forEach(row => offers[row.title] = row);
        console.log('page number: ', number, 'maxLinks: ', maxLinks);

        await page.close();
        if(number < maxLinks) await parsePage(browser, number+1);
    } catch(e) {
        console.log('✨DOMIK.RIA PAGE ERROR | ', e);
        await parsePage(browser, number+1);
    }
}


async function start() {
    console.log('DOMIK.RIA PARSER:START');

    browser = await puppeteer.launch({ headless: true });
    await parsePage(browser, 0);
    browser.close();

    console.log('DOMIK.RIA PARSER:END');

    fs.writeFileSync(__dirname + `/reports/domik.ria.offers.json`, JSON.stringify(offers, null, 4));
}

start();
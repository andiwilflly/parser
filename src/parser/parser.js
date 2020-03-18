const fs = require('fs');
const puppeteer = require('puppeteer-extra');

const oldOffers = require('./reports/offers.json');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());

const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const offers = {};
// const url = 'https://www.olx.ua/nedvizhimost/doma/prodazha-domov/kiev/?search%5Bfilter_float_price%3Ato%5D=75000&search%5Bfilter_float_price%3Afrom%5D=20000&search%5Bfilter_float_total_floors%3Ato%5D=3&search%5Bfilter_float_total_area%3Afrom%5D=90&search%5Bfilter_float_land_area%3Afrom%5D=15&search%5Bphotos%5D=1&search%5Bdist%5D=15&currency=USD';
const url = 'https://www.olx.ua/nedvizhimost/kvartiry-komnaty/prodazha-kvartir-komnat/kiev/q-%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D0%B0/?search%5Bfilter_float_price%3Afrom%5D=20000&search%5Bfilter_float_price%3Ato%5D=75000&search%5Bfilter_float_floor%3Afrom%5D=2&search%5Bfilter_float_total_area%3Afrom%5D=65&search%5Bfilter_float_number_of_rooms%3Afrom%5D=3&search%5Bphotos%5D=1&currency=USD';
let browser = null;
let TOTAL_PAGES = 50;


async function parsePage(browser, number = 1) {
    console.log('✨ ENTER page', number);

    const page = await browser.newPage();
    await page.goto(`${url}&page=${number}`, {
        waitUntil: 'networkidle2'
    });
    await page.waitFor(1000);

    const maxLinks = await page.evaluate(()=> {
        const $links = document.querySelectorAll('.item.fleft');
        if(!$links) return TOTAL_PAGES;
        return +$links[$links.length-1].innerText
    });
    const links = await page.evaluate(()=> [...document.querySelectorAll('#offers_table a.detailsLink') ].map($el => $el.getAttribute('href')));

    console.log('page', number, 'links:', links.length, maxLinks);

    if(links.length) {
        for(let i = 0; i < links.length; i++) {
            console.log('ENTER sub page', number, i);
            if(!links[i]) continue;
            await page.goto(links[i], { waitUntil: 'networkidle2' });

            try {
                const offer = await page.evaluate(()=> {
                    return {
                        title: document.querySelectorAll('h1')[0].innerText,
                        date: document.querySelector('.offer-titlebox__details > em').innerText,
                        address: document.querySelectorAll('.show-map-link')[0].innerText,
                        price: document.querySelectorAll('.price-label')[0].innerText.replace('$', '').replace(/ /g, ''),
                        description: document.querySelectorAll('#textContent')[0].innerText,
                        images: [ ...document.querySelectorAll('.photo-glow > img')].map($img => $img.getAttribute('src')),
                        details: [ ...new Set(document.querySelectorAll('.details')[0].innerText.replace(/\t/g, ' ').split("\n").filter(Boolean)) ]
                    };
                });
                offers[links[i]] = {
                    ...offer,
                    page: number,
                    isNew: !oldOffers[links[i]],
                    link: links[i],
                };
            } catch(e) {
                console.log('PARSE page', number, i, 'ERROR, ');
            }
        }

        await page.close();
        if(number < maxLinks) await parsePage(browser, number+1);
    } else {
       await page.close();
        console.log('RETRY THE SAME PAGE...');
        await parsePage(browser, number);
    }
}


async function start() {
    console.log('PARSER:START');

    browser = await puppeteer.launch({ headless: true });
    await parsePage(browser, 1);
    browser.close();

    console.log('PARSER:END');
    fs.writeFileSync(__dirname + `/reports/offers.json`, JSON.stringify(offers, null, 4));
}

start();
module.exports = start;


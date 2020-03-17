const fs = require('fs');
const puppeteer = require('puppeteer-extra');

const oldOffers = require('./reports/offers.json');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());


const offers = {};
// const url = 'https://www.olx.ua/nedvizhimost/doma/prodazha-domov/kiev/?search%5Bfilter_float_price%3Ato%5D=75000&search%5Bfilter_float_price%3Afrom%5D=20000&search%5Bfilter_float_total_floors%3Ato%5D=3&search%5Bfilter_float_total_area%3Afrom%5D=90&search%5Bfilter_float_land_area%3Afrom%5D=15&search%5Bphotos%5D=1&search%5Bdist%5D=15&currency=USD';
const url = 'https://www.olx.ua/nedvizhimost/kvartiry-komnaty/prodazha-kvartir-komnat/kiev/q-%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D0%B0/?search%5Bfilter_float_price%3Afrom%5D=20000&search%5Bfilter_float_price%3Ato%5D=75000&search%5Bfilter_float_floor%3Afrom%5D=2&search%5Bfilter_float_total_area%3Afrom%5D=65&search%5Bfilter_float_number_of_rooms%3Afrom%5D=3&search%5Bphotos%5D=1&currency=USD';
let browser = null;


async function parsePage(number = 1) {
    browser = await puppeteer.launch({ headless: true });

    console.log('ENTER page', number);
    const page = await browser.newPage();

    await page.goto(`${url}&page=${number}`, { waitUntil: 'networkidle2' });

    const links = await page.evaluate(()=> [...document.querySelectorAll('#offers_table a.detailsLink') ].map($el => $el.getAttribute('href')));

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
    browser.close();
}


async function start(pages) {
    console.log('PARSER:START | total pages:', pages);

    for(let i = 1; i <= pages; i++) {
        await parsePage(i);
    }
    console.log('PARSER:END');
    fs.writeFileSync(__dirname + `/reports/offers.json`, JSON.stringify(offers, null, 4));
}

start(5);
module.exports = start;


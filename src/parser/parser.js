const fs = require('fs');
const puppeteer = require('puppeteer-extra');

const oldOffers = require('./reports/offers.json');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());


const offers = {};
const parsePages = 6;
const url = 'https://www.olx.ua/nedvizhimost/doma/prodazha-domov/kiev/?search%5Bfilter_float_price%3Ato%5D=75000&search%5Bfilter_float_price%3Afrom%5D=20000&search%5Bfilter_float_total_floors%3Ato%5D=3&search%5Bfilter_float_total_area%3Afrom%5D=90&search%5Bfilter_float_land_area%3Afrom%5D=15&search%5Bphotos%5D=1&search%5Bdist%5D=15&currency=USD';
let browser = null;


function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    });
}

async function parsePage(number = 1) {
    browser = await puppeteer.launch({ headless: true });

    console.log('ENTER page', number);
    const page = await browser.newPage();

    await page.goto(`${url}&page=${number}`, { waitUntil: 'networkidle2' });

    //await delay(4000); // Async load links

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
}


async function start(pages) {
    console.log('PARSER:START | total pages:', pages);

    for(let i = 1; i <= pages; i++) {
        await parsePage(i);
    }
    console.log('PARSER:END');
    fs.writeFileSync(`./reports/offers.json`, JSON.stringify(offers, null, 4));

    browser.close();
}

module.exports = start;


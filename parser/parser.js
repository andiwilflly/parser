const fs = require('fs');
const puppeteer = require('puppeteer-extra');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());


const offers = {};
const parsePages = 3;
const url = 'https://www.olx.ua/nedvizhimost/doma/prodazha-domov/kiev/?search%5Bfilter_float_price%3Ato%5D=75000&search%5Bfilter_float_price%3Afrom%5D=20000&search%5Bfilter_float_total_floors%3Ato%5D=3&search%5Bfilter_float_total_area%3Afrom%5D=90&search%5Bfilter_float_land_area%3Afrom%5D=15&search%5Bphotos%5D=1&search%5Bdist%5D=15&currency=USD';
let browser = null;


async function parsePage(number = 1) {
    browser = await puppeteer.launch({ headless: true });

    console.log('ENTER page', number);
    const page = await browser.newPage();

    await page.goto(`${url}&page=${number}`, { waitUntil: 'networkidle2' });

    const links = await page.evaluate(()=> [...document.querySelectorAll('#offers_table a.detailsLink') ].map($el => $el.getAttribute('href')));

    for(let i = 0; i < links.length; i++) {
        let page = await browser.newPage();

        console.log('ENTER sub page', number, i);
        if(!links[i]) continue;
        await page.goto(links[i], { waitUntil: 'networkidle2' });

        try {
            offers[links[i]] = {
                page: number,
                link: links[i],
                title: await page.evaluate(()=> document.querySelectorAll('h1')[0].innerText ),
                address: await page.evaluate(()=> document.querySelectorAll('.show-map-link')[0].innerText),
                price: await page.evaluate(()=> document.querySelectorAll('.price-label')[0].innerText.replace('$', '').replace(/ /g, '')),
                description: await page.evaluate(()=> document.querySelectorAll('#textContent')[0].innerText),
                images: await page.evaluate(()=> [ ...document.querySelectorAll('.photo-glow > img')].map($img => $img.getAttribute('src'))),
                details: await page.evaluate(()=> [ ...new Set(document.querySelectorAll('.details')[0].innerText.replace(/\t/g, ' ').split("\n").filter(Boolean)) ])
            };
        } catch {
            console.log('PARSE page', number, i, 'ERROR');
        }

        page.close();
    }
}


async function start() {
    for(let i = 1; i <= parsePages; i++) {
        await parsePage(i);
    }
    console.log('END');
    fs.writeFileSync(__dirname + `/reports/offers.json`, JSON.stringify(offers, null, 4));

    browser.close();
}


start();
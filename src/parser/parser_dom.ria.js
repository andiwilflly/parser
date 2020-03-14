const fs = require('fs');
const puppeteer = require('puppeteer-extra');

const oldOffers = require('./reports/offers.json');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());


const offers = {};
const url = 'https://dom.ria.com/ru/search/#category=4&realty_type=0&operation_type=1&state_id=10&city_id=10&inspected=0&period=0&notFirstFloor=0&notLastFloor=0&selectType=on&ch=215_f_99,215_t_330,219_f_15,226_0,234_f_20000,234_t_75000,242_239,265_0';
let browser = null;

// https://dom.ria.com/ru/search/#category=4&realty_type=0&operation_type=1&state_id=10&city_id=10&inspected=0&period=0&notFirstFloor=0&notLastFloor=0&selectType=on&ch=215_f_99,215_t_330,219_f_15,226_0,234_f_20000,234_t_75000,242_239,265_0
async function parsePage(number = 1) {
    browser = await puppeteer.launch({ headless: false });

    console.log('ENTER page', number);
    const page = await browser.newPage();

    await page.goto(`${url}&page=${number}`, { waitUntil: 'networkidle2' });

    await new Promise(resolve => setTimeout(resolve, 5000));

    let links = await page.evaluate(()=> [...document.querySelectorAll('.wrap_desc a.blue') ].map($el => $el.getAttribute('href') ? 'https://dom.ria.com' + $el.getAttribute('href') : null).filter(Boolean));

    for(let i = 0; i < links.length; i++) {
        console.log('ENTER sub page', number, i);
        if(!links[i]) continue;
        await page.goto(links[i], { waitUntil: 'networkidle2' });

        try {
            const offer = await page.evaluate(()=> {
                return {
                    title:       document.querySelector('h1').innerText,
                    date:        'date',
                    address:     'address',
                    price:       document.querySelector('.price').innerText,
                    description: document.querySelector('#descriptionBlock').innerText,
                    images:      [...document.querySelectorAll('.tumbs.unstyle img')].map($el => $el.getAttribute('src')),
                    details:     [...document.querySelectorAll('.description ul.unstyle li')].map($el => $el.innerText)
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


async function start(pages = 0) {
    console.log('PARSER(dom.ria):START | total pages:', pages);

    for(let i = 0; i <= pages; i++) {
        await parsePage(i);
    }
    console.log('PARSER(dom.ria):END');
    fs.writeFileSync(__dirname + `/reports/offers_dom.ria.json`, JSON.stringify(offers, null, 4));
}

module.exports = start;


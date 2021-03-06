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
// const url = 'http://us4.freeproxy.win/index.php?q=ztak1qegkGCssK6Rps6xZamUZKfKyqye3p_Lz9Clq2XR2JHYqM_TqmKkptClw62wY6OnqMnHsJ3FZM3YwqSrn9iPm9Wh1MKlZKSgyK2RqmRZd2Vep6dbeZRcpJSGdmdbqJJVqmWLmWFafWiIb5Ree2RYd3GKqmdanGeHppFXeWaVoaPLldjEmVpuecmgzq2cppKbpdTHqpTUqcvFxldqd8zUn9NZm6VuZ2lnk2eIrJyVpZihipt4m82j1sfTkZ2i1cOkxaTYypSaXmqkq9FebHhwbG6VlmZb15zD1MSaXGuoyJnSqMvTkJulpsSrwZ-jo6KnXpinnKfTpIeXpW9pXNnHkdiXzoZmd5-gz6vHq5aan6Sa2cWqpNiYzsHCpJyXi5VxzKbVzlZqfXSZbIisnJWlmKGKm3ibzaPWx9ORnaLVw6TFotvOk5qrltKdwaumo6CoXpinnKfTpIeXpW9qXNnHkdiXzoZmd6mf0qvRrFxpd3Jqi8mrp9ac0MXab4yJqg';
let browser = null;
let TOTAL_PAGES = 50;


async function parsePage(browser, number = 1) {
    console.log('✨ ENTER page', number);

    // const page = await browser.newPage();
    // await page.goto(`https://freeproxy.win/`, {
    //     waitUntil: 'networkidle2'
    // });

    // await page.focus('#inputurl');
    // await page.keyboard.type(url);
    //
    // await page.waitFor(500);
    // await page.$eval('#surfbtn', $elem => $elem.click());
    // await page.waitFor(5000);


    const page = await browser.newPage();
    await page.goto(`${url}&page=${number}`, {
        waitUntil: 'networkidle2'
    });
    await page.waitFor(1000);

    // await page.authenticate({
    //     username: 'joel',
    //     password: 'browserless-rocks',
    // });
    // await page.setExtraHTTPHeaders({
    //     'SomeHeader': 'test'
    // });

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

            await page.waitFor(500);
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

    browser = await puppeteer.launch({
        headless: false,
        // ignoreHTTPSErrors: true,
        // args: [
        //     '--proxy-server=188.134.1.20:63756'
        // ]
    });
    await parsePage(browser, 1);
    browser.close();

    console.log('PARSER:END');

    // Save new [offers] to history
    Object.values(offers).forEach(offer => {
        let flatsHistory = fs.readFileSync(__dirname + `/reports/flatsHistory.json`);
        flatsHistory = [...new Set(JSON.parse(flatsHistory))];
        if(!flatsHistory.includes(offer.title)) {
            flatsHistory.push(offer.title);
            fs.writeFileSync(__dirname + `/reports/flatsHistory.json`, JSON.stringify(flatsHistory, null, 4));
        } else {
            console.log('old offer');
        }
    });

    console.log('PARSER:HISTORY:SAVED');

    fs.writeFileSync(__dirname + `/reports/offers.json`, JSON.stringify(offers, null, 4));
}

start();
module.exports = start;


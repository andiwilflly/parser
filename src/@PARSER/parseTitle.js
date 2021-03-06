const fs = require('fs');
const fetch = require('node-fetch');
const Fuse = require('fuse.js');
const offers = [
    ...Object.values(require('./reports/olx.offers.json')),
    ...Object.values(require('./reports/domik.ria.offers.json')),
    ...Object.values(require('./reports/100realty.ua.offers.json')),
    ...Object.values(require('./reports/lun.ua.offers.json')),
    ...Object.values(require('./reports/r24.ua.offers.json'))
];
const kievStreets = require('../parser/kievData/kievStreets.json');
const kievPlaces = require('../parser/kievData/kievPlaces.json');


function geoCoderUrl(searchText) {
    return `https://geocoder.ls.hereapi.com/6.2/geocode.json?xnlp=CL_JSMv3.1.14.0&apikey=yNXTO7pg5KdL_J8_BkDe0_PUDGfbTdwagSXAUs37pTY&searchText=${encodeURIComponent(`${searchText}, Київ, 02095, Україна`)}&jsonattributes=1`;
}

async function init() {

    let restOffers = 0;
    let parsedOffers = offers.map(offer => {
        return offer;

        const subwayMatch = Object.keys(kievPlaces.subways).find(subway => offer.title.includes(subway) ? subway : null);

        // Streets
        let streetMatch = kievStreets.filter(street => offer.title.includes(`${street}`) ? street : null);

        // Case when we have subway Житомирская and streets like: [Житомирская, Полевая, Хуевая]
        if(subwayMatch && streetMatch.length > 1) {
            streetMatch = streetMatch.filter(street => street !== subwayMatch);
        }

        streetMatch = streetMatch.sort(function (a, b) { return b.length - a.length; })[0];
        if(streetMatch && streetMatch.length >= 4) {
            let sub = 'улица ';
            if(offer.title.includes('Ул.') || offer.title.includes('ул') || offer.title.includes('вул')) sub = 'улица';
            if(offer.title.includes('пл.')) sub = 'площадь';
            if(offer.title.includes('пл ')) sub = 'площадь';
            if(offer.title.includes(' пл')) sub = 'площадь';
            if(offer.title.includes('пер')) sub = 'переулок';
            if(offer.title.includes('просп')) sub = 'проспект';
            if(offer.title.includes('Пр-кт')) sub = 'проспект';
            if(offer.title.includes('пр-кт')) sub = 'проспект';
            if(offer.title.includes('П. ')) sub = 'проспект';
            if(offer.title.includes(' пр')) sub = 'проспект';
            if(offer.title.includes(' М.')) sub = 'метро';
            if(offer.title.includes('бульв')) sub = 'бульвар';
            if(offer.title.includes('бульвар')) sub = 'бульвар';
            if(offer.title.includes('спуск')) sub = 'спуск';
            if(offer.title.includes('шоссе')) sub = 'шоссе';
            if(offer.title.includes('дор ')) sub = 'дорога';
            if(offer.title.includes('наб ')) sub = 'набережная';
            if(offer.title.includes(' наб')) sub = 'набережная';
            if(offer.title.includes(' проезд')) sub = 'проезд';
            if(offer.title.includes(' шоссе')) sub = 'шоссе';
            if(offer.title.includes(' ш. ')) sub = 'шоссе';

            const houseNumberStr = ` ${offer.title.split(streetMatch)[1]}`;
            const houseNumber = houseNumberStr.match(/[ ][\d\/]+[-]?[\W\w]/);

            return {
                ...offer,
                address: `${sub} ${streetMatch} ${houseNumber || ''}`
            };
        } else


        // Subways
        if(subwayMatch) {
            return {
                ...offer,
                address: kievPlaces.subways[subwayMatch]
            };
        }


        // JK
        if(
            (
                offer.title.match('ЖК ') ||
                offer.title.match('жк.') ||
                offer.title.match('ЖК.') ||
                offer.title.match('жк ')
            )
            && offer.title.match(/(жк|ЖК)[ ][\D][^,.]+/)
        ) {
            const match = offer.title.match(/(жк|ЖК)[ ][\D][^,.]+/);
            return {
                ...offer,
                address: `ЖК ${match[0].replace(/ЖК/g, '').replace(/жк/g, '').replace(/ /g, '')}`
            };
        }


        // Districts
        let options = {
            shouldSort: false,
            includeScore: false,
            includeMatches: false, // TODO
            threshold: 0.3,
            location: 0,
            distance: 200,
            maxPatternLength: 200,
            minMatchCharLength: 3,
            keys: ["title"]
        };
        let fuse = new Fuse([offer], options);
        const districtMatch = kievPlaces.districts.find(district => fuse.search(district).length);
        if(districtMatch) {
            return {
                ...offer,
                address: `район ${districtMatch}`
            };
        }

        console.log('rest... ', offer.address);
        restOffers+=1;
        return null;
    }).filter(Boolean);



    // Deduplicate
    const uniqTitle = [ ...new Set(parsedOffers.map(offer => offer.title)) ];
    parsedOffers = uniqTitle.map(title => parsedOffers.find(offer => offer.title === title));



    parsedOffers = await Promise.all(parsedOffers.map(async offer => fetch(geoCoderUrl(offer.address))
        .then(response => response.json())
        .then(geo => {
            if(!geo.response.view[0]) return { geo: { relevance: 0 } };
            return {
                geo: geo.response.view[0].result[0],
                ...offer
            }
        }))).catch(e => console.log(e));


    let badOffers = parsedOffers.filter(offer => offer.address && offer.address.split(',')[1] && offer.geo.relevance <= 0.75);
    let moreGoodOffers = [];
    badOffers = await Promise.all(badOffers.map(async offer => fetch(geoCoderUrl(offer.address.split(',')[1]))
        .then(response => response.json())
        .then(geo => {
            console.log('=>', offer.address.split(',')[1], geo.response.view[0]);
            if(!geo.response.view[0]) return { geo: { relevance: 0 } };
            moreGoodOffers.push({
                ...offer,
                geo: geo.response.view[0].result[0],
            });
            return {
                ...offer,
                geo: geo.response.view[0].result[0],
            }
        }))).catch(e => console.log(e));


    parsedOffers = [
        ...parsedOffers.filter(offer => offer.geo.relevance > 0.75),
        ...moreGoodOffers.filter(offer => offer.geo.relevance > 0.75),
    ];

    const history = JSON.parse(fs.readFileSync(__dirname + '/utils/history.json', 'utf8'));

    let newOffers = 0;
    parsedOffers = parsedOffers.map(offer => {
        const isNew = history[offer.title] === undefined;

        history[offer.title] = new Date().toLocaleString();
        if(isNew) newOffers +=1;
        return {
            ...offer,
            isNew
        }
    });

    console.table({
        TOTAL: offers.length,
        GOOD: parsedOffers.length,
        NEW: newOffers,
        REST: restOffers
    });

   fs.writeFileSync(__dirname + "/utils/history.json", JSON.stringify(history, null, 4));
   fs.writeFileSync(__dirname + `/reports/offers.parsed.json`, JSON.stringify(parsedOffers, null, 4));
}

init().catch(console.log);

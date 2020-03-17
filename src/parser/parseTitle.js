const fs = require('fs');
const Fuse = require("fuse.js");
const offers = Object.values(require('./reports/offers.json'));
const kievStreets = require('./kievStreets.json');

async function init() {

    const parsedOffers = offers.map(offer => {
        let streetMatch = kievStreets.filter(street => offer.title.includes(`${street}`) ? street : null);
        streetMatch = streetMatch.sort(function (a, b) { return b.length - a.length; })[0];

        if(streetMatch) {
            let sub = 'улица ';
            if(offer.title.includes('ул') || offer.title.includes('вул')) sub = 'улица';
            if(offer.title.includes('пл.')) sub = 'площадь';
            if(offer.title.includes('пл ')) sub = 'площадь';
            if(offer.title.includes(' пл')) sub = 'площадь';
            if(offer.title.includes('пер')) sub = 'переулок';
            if(offer.title.includes('просп')) sub = 'проспект';
            if(offer.title.includes(' пр')) sub = 'проспект';
            if(offer.title.includes(' М.')) sub = 'метро';
            if(offer.title.includes('бульв')) sub = 'бульвар';
            if(offer.title.includes('спуск')) sub = 'спуск';
            if(offer.title.includes('шоссе')) sub = 'шоссе';
            if(offer.title.includes('дор ')) sub = 'дорога';
            if(offer.title.includes('наб ')) sub = 'набережная';
            if(offer.title.includes(' наб')) sub = 'набережная';
            if(offer.title.includes(' проезд')) sub = 'проезд';

            const houseNumberStr = ` ${offer.title.split(streetMatch)[1]}`;
            const houseNumber = houseNumberStr.match(/[ ][\d\/]+[-]?[\W\w]/);

            return {
                ...offer,
                address: `${sub} ${streetMatch} ${houseNumber || ''}`
            };
        }

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
                address: `ЖК ${match}`
            };
        }

        console.log('rest... ', offer.title);

        return offer;
    });

    fs.writeFileSync(__dirname + `/reports/parsedOffers.json`, JSON.stringify(parsedOffers, null, 4));
}

init();
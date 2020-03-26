const fs = require('fs');
const Fuse = require('fuse.js');
const offers = Object.values(require('./reports/olx.offers.json'));
const kievStreets = require('../parser/kievData/kievStreets.json');
const kievPlaces = require('../parser/kievData/kievPlaces.json');


async function init() {

    let restOffers = 0;
    let parsedOffers = offers.map(offer => {

        // Streets
        let streetMatch = kievStreets.filter(street => offer.title.includes(`${street}`) ? street : null);
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
        }


        // Subways
        const subwayMatch = Object.keys(kievPlaces.subways).find(subway => offer.title.includes(subway) ? subway : null);
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

        //console.log('rest... ', offer.title);
        restOffers+=1;
        return offer;
    });

    console.log('TOTAL/REST', offers.length, '/', restOffers);

    // Deduplicate
    const uniqTitle = [ ...new Set(parsedOffers.map(offer => offer.title)) ];
    parsedOffers = uniqTitle.map(title => parsedOffers.find(offer => offer.title === title));

    fs.writeFileSync(__dirname + `/reports/olx.offers.parsed.json`, JSON.stringify(parsedOffers, null, 4));
}

init();
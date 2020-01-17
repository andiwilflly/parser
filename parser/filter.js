const fs = require('fs');
const Fuse = require("fuse.js");
const locations = require("./locations");
const goodWords =  require("./goodWords");
const offersObject = require('./reports/offers.json');

function f() {
    const offers = Object.values(offersObject);

    const fuse = new Fuse(offers, {
        shouldSort: true,
        // includeScore: true,
        // includeMatches: true, // TODO
        threshold: 0.2,

        // tokenize: true,
        // matchAllTokens: false,

        location: 0,
        distance: 1000,
        maxPatternLength: 1000,
        minMatchCharLength: 3,
        keys: [ "location", 'description' ]
    });

    let goodOffers = [ ...new Set([].concat.apply([], locations.map(location => fuse.search(location))).map(offer => offer.link)) ];

    const goodOffersFuse = new Fuse(goodOffers.map(link => offersObject[link]), {
        shouldSort: true,
        // includeScore: true,
        // includeMatches: true, // TODO
        threshold: 0.4,
        // tokenize: true,
        // matchAllTokens: false,
        location: 0,
        distance: 1000,
        maxPatternLength: 1000,
        minMatchCharLength: 3,
        keys: [ "location", 'description' ]
    });

    let goodOffersWords = [ ...new Set([].concat.apply([], goodWords.map(word => goodOffersFuse.search(word))).map(offer => offer.link)) ];

    fs.writeFileSync(__dirname + `/reports/goodLocation.json`, JSON.stringify(goodOffers.map(link => offersObject[link]), null, 4));
    fs.writeFileSync(__dirname + `/reports/goodLocationAndWords.json`, JSON.stringify(goodOffersWords.map(link => offersObject[link]), null, 4));

    return {
        byLocation: goodOffers.map(link => offersObject[link]),
        byLocationAndWords: goodOffersWords.map(link => offersObject[link])
    }
}

f();




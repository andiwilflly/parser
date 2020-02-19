const fs = require('fs');
const Fuse = require("fuse.js");
const locations = require("./locations");
const locationsLeft = require("./locationsLeft");
const goodWords =  require("./goodWords");
const badWords =  require("./badWords");
const offersObject = require('./reports/offers.json');

function filter() {
    console.log('FILTER:START');

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
    let goodOffersLeft = [ ...new Set([].concat.apply([], locationsLeft.map(location => fuse.search(location))).map(offer => offer.link)) ];

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

    const goodOffersFuseLeft = new Fuse(goodOffersLeft.map(link => offersObject[link]), {
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
    let goodOffersWordsLeft = [ ...new Set([].concat.apply([], goodWords.map(word => goodOffersFuseLeft.search(word))).map(offer => offer.link)) ];


    let badWordsMatched = {};
    goodOffersWords = goodOffersWords.map(link => offersObject[link]).filter(offer => !badWords.find(word => {
        if(offer.description.includes(word)) badWordsMatched[word] = !!badWordsMatched[word] ? badWordsMatched[word]+1 : 1;
        return offer.description.includes(word);
    })).map(offer => offer.link);

    goodOffersWordsLeft = goodOffersWordsLeft.map(link => offersObject[link]).filter(offer => !badWords.find(word => {
        if(offer.description.includes(word)) badWordsMatched[word] = !!badWordsMatched[word] ? badWordsMatched[word]+1 : 1;
        return offer.description.includes(word);
    })).map(offer => offer.link);

    console.table(badWordsMatched);

    console.table({
        RIGHT: {
            'total ': offers.length,
            'good': goodOffers.length,
            'good words': goodOffersWords.length,
            'good words w.o. bad' : goodOffersWords.length,
        }
    });

    console.table({
        LEFT: {
            'total ': offers.length,
            'good': goodOffersLeft.length,
            'good words' : goodOffersWordsLeft.length,
            'good words w.o. bad' : goodOffersWordsLeft.length
        }
    });

    fs.writeFileSync(__dirname + `/reports/goodLocation.json`, JSON.stringify(goodOffers.map(link => offersObject[link]), null, 4));
    fs.writeFileSync(__dirname + `/reports/goodLocationAndWords.json`, JSON.stringify(goodOffersWords.map(link => offersObject[link]), null, 4));

    fs.writeFileSync(__dirname + `/reports/goodLocationLeft.json`, JSON.stringify(goodOffersLeft.map(link => offersObject[link]), null, 4));
    fs.writeFileSync(__dirname + `/reports/goodLocationAndWordsLeft.json`, JSON.stringify(goodOffersWordsLeft.map(link => offersObject[link]), null, 4));

    console.log('FILTER:END');
}

module.exports = filter;




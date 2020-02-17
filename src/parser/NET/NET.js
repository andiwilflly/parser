const fs = require('fs');
const NET = require('brain.js');
const DBOffers = require('../reports/offers');
const DBGoodWords = require('../goodWords');
const DBLocations = [...require("../locations"), ...require("../locationsLeft")];

let DATA = [];
const PRICE_RANGE = [20000, 75000];


const convertNumberToPercent = (number = 0, range = [0, 10])=> (range[1] - parseInt(number) + range[0]) * 100 / range[1];
const convertPercentToNET = (percents = 100)=> parseFloat((percents / 100).toFixed(1)) < 0 ? 0 : parseFloat((percents / 100).toFixed(1));

Object.values(DBOffers).forEach(offer => {
    const isGoodLocation = !!DBLocations.find(location => offer.description.match(location));
    const goodWords = isGoodLocation ? DBGoodWords.filter(word => offer.description.match(word)) : [];
    const square = parseInt(offer.details.find(detail => detail.includes('Общая площадь')).match(/[0-9]+/)[0]);

    DATA.push({
        input: {
            price: convertPercentToNET(convertNumberToPercent(offer.price, PRICE_RANGE)), // 0.1 - 0.9 range
            isNew: offer.isNew ? 0.9 : 0.1,
            images: offer.images.length <= 9 ? offer.images.length/10 : 0.9,
            location: isGoodLocation ? 0.9 : 0,
            goodWords: goodWords.length <= 9 ? goodWords.length/10 : 0.9,
            s: square,
            square: square >= 100 && square <= 250 ? 0.9 : convertPercentToNET(convertNumberToPercent(square, [0, 250]))
        },
        output: {
            score: !isGoodLocation ? 0 : -1
        }
    });
});

// create a simple feed forward neural network with backpropagation
const net = new NET.NeuralNetwork();

net.train([
    { input: { "тест": 0, y: 0 }, output: { z: 0 } },
    { input: { "тест": 0, y: 1 }, output: { z: 1 } },
    { input: { "тест": 1, y: 0 }, output: { z: 1 } },
    { input: { "тест": 1, y: 1 }, output: { z: 0 } },
]);

const output = net.run({ "тест": 1, y: 0 }) ;// [0.987]


fs.writeFileSync(__dirname + `/DATA.json`, JSON.stringify(DATA, null, 4));



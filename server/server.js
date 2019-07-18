const $ = require('cheerio');
var fs = require('fs');

const {Builder, By } = require('selenium-webdriver');
let webdriver = require('selenium-webdriver');
let chrome = require('selenium-webdriver/chrome');
let chromedriver = require('chromedriver');

chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());


const offers = {};
const parsePages = 8;
const parseOffersPerPage = null; // Int, null


async function getOffers() {
	let driver = await new Builder().forBrowser('chrome').build();

	for(let i = 1; i <= parsePages; i++) {
		await getOffersPage(driver, i);
	}

	fs.readFile('./offers.json', 'utf8', function(err, oldOffers) {
		try {
			oldOffers = JSON.parse(oldOffers);
		} catch (e) {
			oldOffers = {};
		}

		const newOffers = Object.keys(offers)
								.filter(offerLink => !oldOffers[offerLink])
								.reduce((res, offerId) => {
									res[offerId] = offers[offerId];
									return res;
								}, {});

		fs.writeFileSync(__dirname + `/newOffers.json`, JSON.stringify(newOffers, null, 4));
		//fs.writeFileSync(__dirname + `/offers.json`, JSON.stringify(offers, null, 4));
		console.log(`===> PARSE END`);
	});

}


async function getOffersPage(driver, page = 1) {

	await driver.get('https://www.olx.ua/nedvizhimost/doma/prodazha-domov/kiev/?search%5Bfilter_float_price%3Ato%5D=75000&search%5Bfilter_float_price%3Afrom%5D=20000&search%5Bfilter_float_total_floors%3Ato%5D=3&search%5Bfilter_float_total_area%3Afrom%5D=90&search%5Bfilter_float_land_area%3Afrom%5D=15&search%5Bphotos%5D=1&search%5Bdist%5D=15&currency=USD' + '&page=' + page);
	let $offersTable = await driver.findElement(By.id('offers_table'));
	$offersTable = $(await driver.executeScript("return arguments[0].innerHTML;", $offersTable));

	$offersTable.find('a.detailsLink').each(function() {
		const link = $(this).attr('href').replace(';promoted', '');
		offers[link] = { link };

		if($(this).find('img')[0]) offers[link].image = $($(this).find('img')[0]).attr('src');
	});

	// await getOfferDetails(driver, Object.keys(offers)[0]);
	for (let i = 0; i < (parseOffersPerPage || Object.keys(offers).length); i++) {
		await getOfferDetails(driver, Object.keys(offers)[i]);
	}

	console.log(`===> PAGE ${page} PARSE END`);
}


async function getOfferDetails(driver, link) {

	console.log('===> getOfferDetails...');
	await driver.get(link);

	try {
		// Get details
		let $detailsTable = await driver.findElement(By.className('details'));
		$detailsTable = $(await driver.executeScript("return arguments[0].innerHTML;", $detailsTable));
		$detailsTable.find('table.item th').each(function(index) {
			offers[link][$(this).text()] = $($detailsTable.find('table.item .value strong')[index]).text().trim(); // .replace(/\t/g, '');
		});

		// Get price
		let $priceLabel = await driver.findElement(By.className('price-label'));
		$priceLabel = $(await driver.executeScript("return arguments[0].innerHTML;", $priceLabel));
		offers[link].price = $priceLabel.text().trim().replace(/\t/g, '');  //.replace(/\n/g, ' ');

		// Get description
		let $descriptioncontent = await driver.findElement(By.className('descriptioncontent'));
		$descriptioncontent = $(await driver.executeScript("return arguments[0].innerHTML;", $descriptioncontent));
		offers[link].description = $descriptioncontent.text().trim(); //.replace(/\t/g, '').replace(/\n/g, ' ');

		// Images
		let $images = await driver.findElement(By.className('img-item'));
		$images = $(await driver.executeScript("return arguments[0].innerHTML;", $images));
		offers[link].images = $images.length;

		// Location
		let $location = await driver.findElement(By.tagName('address'));
		$location = $(await driver.executeScript("return arguments[0].innerHTML;", $location));
		offers[link].location = $location.text().trim();
	} catch (e) {
		console.log('!!! NOT FOUND !!!', link);
		delete offers[link];
	}

}


async function startServer() {
	await getOffers();

	const express = require('express');
	const path = require('path');
	const app = express();
	app.use(express.static(path.join(__dirname, '../build')));


	app.get('/offers', function (req, res) {
		fs.readFile('./offers.json', 'utf8', function(err, offers) {
			return res.send(err || offers);
		});
	});

	app.get('/newOffers', function (req, res) {
		fs.readFile('./newOffers.json', 'utf8', function(err, offers) {
			return res.send(err || offers);
		});
	});

	app.get('/', function (req, res) {
		res.sendFile(path.join(__dirname, '../build', 'index.html'));
	});

	app.listen(process.env.PORT || 8080);
}

startServer();

import locations from "./locations";
import goodWords from "./goodWords";
import Fuse from 'fuse.js';


export default function(offers = []) {

	console.time('analyzer');

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

	const goodOffers = [
		...new Set(locations.map(location => fuse.search(location))
							.flat()
							.map(offer => offer.link))
	].map(offerLink => offers.find(offer => offer.link === offerLink));


	const goodOffersFuse = new Fuse(goodOffers, {
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

	const goodOffersWords = [
		...new Set(goodWords.map(location => goodOffersFuse.search(location))
		.flat()
		.map(offer => offer.link))
	].map(offerLink => offers.find(offer => offer.link === offerLink));

	console.timeEnd('analyzer');

	return {
		goodOffers,
		goodOffersWords
	}
}
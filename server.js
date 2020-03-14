const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'build')));


app.get('/api/goodLocations', function (req, res) {
    const data = require('./src/parser/reports/goodLocation.json');
    return res.send(JSON.stringify(data));
});

app.get('/api/goodLocationsAndWords', function (req, res) {
    const data = require('./src/parser/reports/goodLocationAndWords.json');
    return res.send(JSON.stringify(data));
});


app.get('/api/goodLocationsLeft', function (req, res) {
    const data = require('./src/parser/reports/goodLocationLeft');
    return res.send(JSON.stringify(data));
});

app.get('/api/goodLocationsAndWordsLeft', function (req, res) {
    const data = require('./src/parser/reports/goodLocationAndWordsLeft.json');
    return res.send(JSON.stringify(data));
});

app.get('/api/parse', async function(req, res) {
    const pages = req.query.pages || 6;
    const parser = require('./src/parser/parser');
    const filter = require('./src/parser/filter');

    try {
        await parser(pages);
        filter();
    } catch(e) {
        return res.status(500).send(e);
    }

    return res.send({ success: true });
});

app.get('/api/parse_dom_ria', async function(req, res) {
    const pages = req.query.pages;
    const parser = require('./src/parser/parser_dom.ria');

    try {
        await parser(pages);
    } catch(e) {
        return res.status(500).send(e);
    }

    return res.send({ success: true });
});


app.listen(8080, function() {
    console.log('proxy server listening on *:8080');
});
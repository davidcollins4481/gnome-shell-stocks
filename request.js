#!/usr/bin/gjs

const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

var Stock = new Lang.Class({
    Name: "Stock",
    _init: function(s, mV, c, pC) {
        this.symbol = s;
        this.marketValue = mV;
        this.change = c;
        this.previousClose = pC;
    }
});

let _httpSession = undefined;

let url = 'https://query.yahooapis.com/v1/public/yql';
let symbols = ["FUSVX", "RDFN", "SNAP", "F", "CRM", "SWPPX", "XOM"];
let params = {
    'q': 'select * from yahoo.finance.quotes where symbol in ' + '(' + symbols.join(',')  + ')',
    'format' : 'json',
    'env' : "store://datatables.org/alltableswithkeys"
};

let paramsEncoded = Object.keys(params).map(function(key) {
    return `${key}=${encodeURIComponent(params[key])}`;
});

url += `?${paramsEncoded.join('&')}`;

var request = Soup.Message.new('GET', url);

var session = new Soup.SessionAsync();
session.queue_message(request, function(session, message) {
    let data = JSON.parse(message.response_body.data);
    let results = data.query.results.quote;

    var stocks = results.map(q => {
        return new Stock(q.symbol, q.LastTradePriceOnly, q.PercentChange, q.PreviousClose);
    });

    print(stocks[0].symbol);

    Mainloop.quit();
});

Mainloop.run();


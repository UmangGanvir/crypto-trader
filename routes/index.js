const ccxt = require('ccxt');
const express = require('express');
const router = express.Router();

let BinanceClient = new ccxt.binance({
    apiKey: process.env.BINANCE_API_KEY,
    secret: process.env.BINANCE_SECRET/*,
    verbose: true*/
});

router.get('/binance/exchange', function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(BinanceClient));
});

router.get('/binance/markets', function (req, res, next) {
    BinanceClient.loadMarkets().then((markets) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({markets: markets}));
    });
});

router.get('/binance/ticker/:baseCrypto/:quoteCrypto', function (req, res, next) {
    const symbol = `${req.params.baseCrypto}/${req.params.quoteCrypto}`;
    BinanceClient.fetchTicker(symbol).then((ticker) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(ticker));
    });
});

router.get('/binance/order/:orderId/:baseCrypto/:quoteCrypto', function (req, res, next) {
    const symbol = `${req.params.baseCrypto}/${req.params.quoteCrypto}`;
    BinanceClient.fetchOrder(req.params.orderId, symbol).then((order) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(order));
    });
});

router.get('/binance/trades/:baseCrypto/:quoteCrypto', function (req, res, next) {
    const symbol = `${req.params.baseCrypto}/${req.params.quoteCrypto}`;
    BinanceClient.fetchTrades(symbol).then((trades) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({trades: trades}));
    });
});

router.get('/binance/ohlcv/:timeframe/:baseCrypto/:quoteCrypto', function (req, res, next) {
    const symbol = `${req.params.baseCrypto}/${req.params.quoteCrypto}`;
    BinanceClient.fetchOHLCV(symbol, req.params.timeframe).then((ohlcv) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ohlcv: ohlcv}));
    });
});

router.get('/binance/balance', function (req, res, next) {
    BinanceClient.fetchBalance().then((balance) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(balance));
    });
});

module.exports = router;

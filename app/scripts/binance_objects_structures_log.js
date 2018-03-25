const ccxt = require('ccxt');

const binanceExchange = new ccxt.binance();

const SYMBOL = 'ETH/USDT';

binanceExchange.loadMarkets().then(( markets ) => {
    console.log(`binanceExchange.markets['${SYMBOL}']: `, binanceExchange.markets[SYMBOL]);

    binanceExchange.fetchTicker(SYMBOL).then((ticker) => {
        console.log("ticker: ", ticker);
    });
});
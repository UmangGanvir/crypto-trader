const Pr = require('bluebird');
const ccxt = require('ccxt');
const EventEmitter = require('events');

const dataStore = require('./data_store');

/*
* stateful components
* */
let BinanceClient = new ccxt.binance({
    apiKey: process.env.BINANCE_API_KEY,
    secret: process.env.BINANCE_SECRET/*,
    verbose: true*/
});
let opportunityEmitter = new EventEmitter();
const REQUEST_RATE_LIMIT_PER_SECOND = 20;


/*
* sub apps - stateless components
* */
const OpportunityBot = require('./sub_apps/opportunity/opportunity_bot');
const OpportunityArchiver = require('./sub_apps/opportunity_archiver/opportunity_archiver');
const Trader = require('./sub_apps/trader');

/**
 * @desc
 * 0 - initializes core project dependencies
 * 0 - initializes all the sub apps of the project
 */
exports.initialize = () => {

    return Pr.join(dataStore.initialize(), () => {
        // 0 - opportunity bot
        let opportunityBot = new OpportunityBot(
            BinanceClient,
            REQUEST_RATE_LIMIT_PER_SECOND,
            opportunityEmitter
        );

        // 1 - opportunity archiver
        let opportunityArchiver = new OpportunityArchiver(
            opportunityEmitter
        );

        // 2 - trader
        let trader = new Trader(
            BinanceClient,
            REQUEST_RATE_LIMIT_PER_SECOND,
            opportunityEmitter
        );

        return Pr.join(
            opportunityBot.start(),
            opportunityArchiver.initialize(),
            trader.start(),
            (opportunityBotStartTime, opportunityArchiverStartTime, traderStartTime) => {
                console.log("Opportunity Bot - Start Time: ", opportunityBotStartTime);
                console.log("Opportunity Archiver - Start Time: ", opportunityArchiverStartTime);
                console.log("Trader - Start Time: ", traderStartTime);
                console.log();
            });
    });
};
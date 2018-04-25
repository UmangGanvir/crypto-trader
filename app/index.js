const MODULE_NAME = "$CRYPTO_TRADER$";

const Pr = require('bluebird');
const ccxt = require('ccxt');
const EventEmitter = require('events');
const logger = require('./modules/logger')(MODULE_NAME);

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

const TraderModuleClass = require('./modules/trader');

/**
 * @desc
 * Crypto Trader includes the following sub-apps
 * 0 - Opportunity Bot
 * 1 - Opportunity Archiver
 * 2 - Trader
 */
class CryptoTrader {
    constructor(exchange, requestRateLimitPerSecond, emitter) {
        // sub-apps
        this.opportunityBot = new OpportunityBot(exchange, requestRateLimitPerSecond, emitter);
        this.opportunityArchiver = new OpportunityArchiver(emitter);
        this.trader = new Trader(exchange, requestRateLimitPerSecond, emitter);
    }

    initialize() {
        return Pr.join(dataStore.initialize(), () => {
            return Pr.join(
                this.opportunityBot.initialize(),
                this.opportunityArchiver.initialize(),
                this.trader.initialize(),
                (opportunityBotInitialized, opportunityArchiverInitialized, traderInitialized) => {
                    logger.info(`Opportunity Bot - initialized!`);
                    logger.info(`Opportunity Archiver - initialized!`);
                    logger.info(`Trader - initialized!`);
                    return true;
                });
        });
    }

    start() {
        const $this = this;
        return TraderModuleClass.areTradesInProgress().then(areTradesInProgress => {
            if (areTradesInProgress) {
                logger.info(`found trades in progress... starting trader!`);
                return $this.trader.start();
            }
            logger.info(`found no trades in progress... starting opportunity bot!`);
            return $this.opportunityBot.start();
        });
    }

    stop() {
        const $this = this;
        return TraderModuleClass.areTradesInProgress().then(areTradesInProgress => {
            if (areTradesInProgress) {
                return Pr.reject("trades are in progress - can not stop");
            }
            return $this.opportunityBot.stop();
        });
    }
}

module.exports = new CryptoTrader(BinanceClient, REQUEST_RATE_LIMIT_PER_SECOND, opportunityEmitter);

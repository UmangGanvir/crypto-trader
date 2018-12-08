const MODULE_NAME = "TRADE_INITIATOR";

const Pr = require('bluebird');
const CONSTANTS = require('../../constants');
const logger = require('../../modules/logger')(MODULE_NAME);

const TraderModuleClass = require('../../modules/trader');
const GlobalMarketSentiment = require('../../modules/market_sentiment');

class TradeInitiator {
    constructor(exchange, requestRateLimitPerSecond, emitter) {
        this.trader = new TraderModuleClass(exchange, requestRateLimitPerSecond);
        this.emitter = emitter;
        this._quoteMarketSentiment = GlobalMarketSentiment.getMarketSentimentForQuote("USDT");
    }

    initialize() {
        const $this = this;
        $this.emitter.on(CONSTANTS.EVENT_OPPORTUNITY_FOUND, (opportunity) => {

            if ($this._quoteMarketSentiment.isBearish()) {
                logger.info(`skipping opportunity: ${opportunity.symbol} | reason: market is bearish`);
                return;
            }

            if (!opportunity.isValid()) {
                logger.info(`skipping opportunity: ${opportunity.symbol} | reason: opportunity is invalid`);
                return;
            }

            if (!opportunity.isGreat()) {
                logger.info(`skipping opportunity: ${opportunity.symbol} | reason: ${opportunity.ungreatnessReason()}`);
                return;
            }

            logger.info(`event: ${CONSTANTS.EVENT_OPPORTUNITY_FOUND} received with great opportunity!`);
            logger.info(opportunity.toObject());

            $this.trader.createTradeForOpportunity(opportunity).then((createdTrade) => {
                logger.info(`emitting created trade..`);
                logger.info(createdTrade.toObject());
                $this.emitter.emit(CONSTANTS.EVENT_TRADE_CREATED, createdTrade);
            }).catch((err) => {
                logger.error(`createTradeForOpportunity error`);
                logger.error(err);
            });
        });
        return Pr.resolve(true);
    }
}

module.exports = TradeInitiator;
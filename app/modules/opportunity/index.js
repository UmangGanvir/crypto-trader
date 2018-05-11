const MODULE_NAME = "OPPORTUNITY_MODULE";

const Pr = require('bluebird');
const _ = require('underscore');
const utils = require('../../utils/index');
const CONSTANTS = require('../../constants');
const logger = require('../../modules/logger')(MODULE_NAME);
const TradingUtils = require('../../utils/trading_utils');

let Opportunity = require('../../models/opportunity');
const OpportunityDataStore = require('../../data_store/mysql/opportunity').getModelClass();

class OpportunityModule {
    constructor(exchange, requestRateLimitPerSecond, emitter) {
        this.exchange = exchange;
        this.requestRateLimitPerSecond = requestRateLimitPerSecond;
        this.emitter = emitter;
        this._disableFindingOpportunities = false;
    }

    /*
    * used to save rate limit
    * */
    disableFindingOpportunities() {
        this._disableFindingOpportunities = true;
    }

    enableFindingOpportunities() {
        this._disableFindingOpportunities = false;
    }

    findOpportunityForSymbol(symbol) {
        let $this = this;

        if ($this._disableFindingOpportunities) {
            return Pr.resolve(Opportunity.getInvalidOpportunity());
        }

        return $this._findGreatOpportunityForSymbol(symbol).then((opportunity) => {
            if (!opportunity.isValid()) {
                return opportunity;
            }

            // if opportunity is valid re-validate - cure for instant spike in demand
            return $this._findGreatOpportunityForSymbol(symbol);
        });
    }

    /*
    * For faster emitting of opportunities, we validate the to-be-opportunity's parameters on ad-hoc basis
    * */
    _findGreatOpportunityForSymbol(symbol) {

        const OPPORTUNITY_MIN_QUOTE_VOLUME = parseFloat(process.env.OPPORTUNITY_MIN_QUOTE_VOLUME);
        const OPPORTUNITY_MIN_STD_DEVIATION_MEAN_PERCENTAGE = parseFloat(process.env.OPPORTUNITY_MIN_STD_DEVIATION_MEAN_PERCENTAGE);
        const OPPORTUNITY_MAX_STD_DEVIATION_MEAN_PERCENTAGE = parseFloat(process.env.OPPORTUNITY_MAX_STD_DEVIATION_MEAN_PERCENTAGE);
        const OPPORTUNITY_GREATNESS_RATIO = parseFloat(process.env.OPPORTUNITY_GREATNESS_RATIO);

        let $this = this;
        return utils.delayPromise(
            $this.exchange.fetchTicker(symbol),
            (1000 / $this.requestRateLimitPerSecond)
        ).then((ticker) => {

            if (ticker.quoteVolume < OPPORTUNITY_MIN_QUOTE_VOLUME) {
                return Opportunity.getInvalidOpportunity();
            }

            return utils.delayPromise(
                $this.exchange.fetchOHLCV(symbol, '1m'),
                (1000 / $this.requestRateLimitPerSecond)
            ).then((OHLCVs) => {

                const standardDeviationMeanPercentage1min = TradingUtils.getStandardDeviationMeanPercentageFromOHLCVs(OHLCVs);
                if (
                    standardDeviationMeanPercentage1min < OPPORTUNITY_MIN_STD_DEVIATION_MEAN_PERCENTAGE ||
                    standardDeviationMeanPercentage1min > OPPORTUNITY_MAX_STD_DEVIATION_MEAN_PERCENTAGE
                ) {
                    return Opportunity.getInvalidOpportunity();
                }

                return utils.delayPromise(
                    $this.exchange.fetchOrderBook(symbol),
                    (1000 / $this.requestRateLimitPerSecond)
                ).then((orderBook) => {

                    const buySellRatio = TradingUtils.getBuySellRatio(orderBook.bids, orderBook.asks);
                    if (
                        buySellRatio.r100 < OPPORTUNITY_GREATNESS_RATIO ||
                        buySellRatio.r50 < OPPORTUNITY_GREATNESS_RATIO ||
                        buySellRatio.r20 < OPPORTUNITY_GREATNESS_RATIO ||
                        buySellRatio.r10 < OPPORTUNITY_GREATNESS_RATIO ||
                        buySellRatio.r5 < OPPORTUNITY_GREATNESS_RATIO
                    ) {
                        return Opportunity.getInvalidOpportunity();
                    }

                    return new Opportunity(ticker, orderBook, OHLCVs);
                });
            });
        });
    }

    /*
    * Loads the market and finds opportunity for each symbol
    * Note: currently restricted to ETH market
    * returns: array of found opportunities (which might be stale)
    * Also allows to emit opportunities for real time consumption
    * */
    findMarketOpportunities(emit = false) {
        let $this = this;

        if ($this._disableFindingOpportunities) {
            return Pr.resolve([Opportunity.getInvalidOpportunity()]);
        }

        return utils.delayPromise(
            $this.exchange.loadMarkets(),
            (1000 / $this.requestRateLimitPerSecond)
        ).then((markets) => {
            let marketsArr = _.values(markets);
            let ethereumMarketsArr = _.filter(marketsArr, (market) => {
                return market.quoteId === "ETH";
            });

            return Pr.reduce(ethereumMarketsArr, (opportunities, ethereumMarket) => {
                return $this.findOpportunityForSymbol(ethereumMarket.symbol).then((opportunity) => {
                    if (opportunity.isValid()) {
                        // emit opportunity for trader
                        if (emit) {
                            logger.info(`emitting opportunity: ${opportunity.symbol}`);
                            $this.emitter.emit(CONSTANTS.EVENT_OPPORTUNITY_FOUND, opportunity);
                        }
                        opportunities.push(opportunity);
                    }
                    return opportunities;
                });
            }, []).then((opportunities) => {
                logger.info(`market's one round complete. opportunities found: ${opportunities.length} / ${ethereumMarketsArr.length}`);
                return opportunities;
            });
        });
    }

    static save(opportunity) {
        return OpportunityDataStore.createNew({
            symbol: opportunity.symbol,
            price: opportunity.price,
            quoteVolume: opportunity.quoteVolume,
            standardDeviationMeanPercentage1min: opportunity.standardDeviationMeanPercentage1min,
            buySellRatio100: opportunity.buySellRatio.r100,
            buySellRatio50: opportunity.buySellRatio.r50,
            buySellRatio20: opportunity.buySellRatio.r20,
            buySellRatio10: opportunity.buySellRatio.r10,
            buySellRatio5: opportunity.buySellRatio.r5,
        });
    }
}

module.exports = OpportunityModule;

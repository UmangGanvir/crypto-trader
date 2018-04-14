const Pr = require('bluebird');
const _ = require('underscore');
const utils = require('../../utils/index');
const CONSTANTS = require('../../constants');

let Opportunity = require('../../models/opportunity');
const OpportunityDataStore = require('../../data_store/mysql/opportunity').getModelClass();

const MODULE_NAME = "OPPORTUNITY_MODULE";

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

        return utils.delayPromise(
            $this.exchange.fetchTicker(symbol),
            (1000 / $this.requestRateLimitPerSecond)
        ).then((ticker) => {

            return utils.delayPromise(
                $this.exchange.fetchOHLCV(symbol, '1m'),
                (1000 / $this.requestRateLimitPerSecond)
            ).then((OHLCVs) => {

                return utils.delayPromise(
                    $this.exchange.fetchOrderBook(symbol),
                    (1000 / $this.requestRateLimitPerSecond)
                ).then((orderBook) => {
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
                            console.log("");
                            console.log(`${MODULE_NAME} - emitting opportunity: `, opportunity.symbol);
                            console.log("");
                            $this.emitter.emit(CONSTANTS.EVENT_OPPORTUNITY_FOUND, opportunity);
                        }
                        opportunities.push(opportunity);
                    }
                    return opportunities;
                });
            }, []).then((opportunities) => {
                console.log("=============================");
                console.log("market's one round complete. opportunities found: " + opportunities.length + " / " + ethereumMarketsArr.length);
                console.log("=============================");
                console.log();
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
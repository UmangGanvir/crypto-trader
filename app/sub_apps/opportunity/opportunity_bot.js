const Pr = require('bluebird');
const _ = require('underscore');
const utils = require('../../utils/index');

const CONSTANTS = require('../../constants');

let Bot = require('../../modules/bot/index');
let Trader = require('../../modules/trader');
let Opportunity = require('../../models/opportunity');
let opportunityEmitter = require('../../modules/opportunity/opportunity_emitter');

class OpportunityBot extends Bot {
    constructor(exchange, requestRateLimitPerSecond) {
        super(
            "OPPORTUNITY",
            (1000 / requestRateLimitPerSecond)
        );
        super.setTaskFunction(this.emitOpportunities.bind(this));
        this.exchange = exchange;
        this.requestRateLimitPerSecond = requestRateLimitPerSecond;
    }

    findOpportunityForSymbol(symbol) {
        let $this = this;
        return Trader.areTradesInProgress().then(isTradeInProgress => {
            if (isTradeInProgress) {
                return Opportunity.getInvalidOpportunity();
            }

            return utils.delayPromise(
                $this.exchange.fetchTicker(symbol),
                (1000 / $this.requestRateLimitPerSecond)
            ).then((ticker) => {
                return utils.delayPromise(
                    $this.exchange.fetchOrderBook(symbol),
                    (1000 / $this.requestRateLimitPerSecond)
                ).then((orderBook) => {
                    let opportunity = new Opportunity(ticker, orderBook);
                    return Pr.resolve(opportunity);
                })
            });
        });
    }

    emitOpportunities() {
        let $this = this;
        return new Pr((resolve, reject) => {

            Trader.areTradesInProgress().then(isTradeInProgress => {
                if (isTradeInProgress) {
                    return resolve([]);
                }

                setTimeout(() => {

                    $this.exchange.loadMarkets().then((markets) => {
                        let marketsArr = _.values(markets);
                        let ethereumMarketsArr = _.filter(marketsArr, (market) => {
                            return market.quoteId === "ETH";
                        });

                        return Pr.reduce(ethereumMarketsArr, (opportunities, ethereumMarket) => {
                            return $this.findOpportunityForSymbol(ethereumMarket.symbol).then((opportunity) => {
                                if (opportunity.isValid()) {
                                    // 0 - emit opportunity for trader
                                    opportunityEmitter.emit(CONSTANTS.OPPORTUNITY_FOUND_EVENT_NAME, opportunity);
                                    opportunities.push(opportunity);
                                }
                                return opportunities;
                            });
                        }, []).then((opportunities) => {
                            console.log("=============================");
                            console.log("market's one round complete. opportunities found: " +  opportunities.length + " / " + ethereumMarketsArr.length);
                            console.log("=============================");
                            console.log();
                            resolve(opportunities);
                        });

                    }).catch((err) => {
                        reject(err);
                    });

                }, (1000 / $this.requestRateLimitPerSecond));

            }).catch((err) => {
                reject(err);
            });
        });
    }
}

module.exports = OpportunityBot;
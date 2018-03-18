const Pr = require('bluebird');
const _ = require('underscore');
const EventEmitter = require('events');
const utils = require('../../utils/index');

let Bot = require('../../modules/bot/index');
let Opportunity = require('../../models/opportunity');

class TradeWorkflowBot extends Bot {
    constructor(exchange, requestRateLimitPerSecond) {
        super(
            "OPPORTUNITY",
            (1000/requestRateLimitPerSecond)
        );
        super.setTaskFunction(this.emitOpportunities.bind(this));
        this.exchange = exchange;
        this.requestRateLimitPerSecond = requestRateLimitPerSecond;
        this.opportunityEmitter = new EventEmitter();
    }

    findOpportunityForSymbol(symbol) {
        let $this = this;
        return utils.delayPromise(
            $this.exchange.fetchTicker(symbol),
            (1000/$this.requestRateLimitPerSecond)
        ).then((ticker) => {
            return utils.delayPromise(
                $this.exchange.fetchOrderBook(symbol),
                (1000/$this.requestRateLimitPerSecond)
            ).then((orderBook) => {
                let opportunity = new Opportunity(ticker, orderBook);
                return Pr.resolve(opportunity);
            })
        });
    }

    emitOpportunities() {
        let $this = this;
        return new Pr((resolve, reject) => {
            setTimeout(() => {

                $this.exchange.loadMarkets().then((markets) => {
                    let marketsArr = _.values(markets);
                    let ethereumMarketsArr = _.filter(marketsArr, (market) => {
                        return market.quoteId === "ETH";
                    });

                    return Pr.reduce(ethereumMarketsArr, (opportunities, ethereumMarket) => {
                        return $this.findOpportunityForSymbol(ethereumMarket.symbol).then((opportunity) => {
                            if (opportunity.isValid()) {
                                $this.opportunityEmitter.emit('OPPORTUNITY_FOUND', opportunity);
                                // // store into db + emit (elsewhere - trade initiator)
                                // console.log(ethereumMarket.symbol + ": ", JSON.stringify(opportunity));
                                //
                                // if (opportunity.isGreat()) {
                                //     console.log("\n----------GREAT---------------");
                                //     console.log(ethereumMarket.symbol + ": ", opportunity);
                                //     console.log("--------------------------------\n");
                                // }
                                opportunities.push(opportunity);
                            }
                            return opportunities;
                        });
                    }, []).then((opportunities) => {
                        // console.log("=============================");
                        // console.log("opportunities found: " +  opportunities.length + " / " + ethereumMarketsArr.length);
                        // console.log("=============================");
                        // console.log();
                        resolve(opportunities);
                    });

                }).catch((err) => {
                    reject(err);
                })

            }, (1000/$this.requestRateLimitPerSecond));
        });
    }
}

module.exports = TradeWorkflowBot;
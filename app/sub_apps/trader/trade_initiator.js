const Pr = require('bluebird');

let opportunityEmitter = require('../../modules/opportunity/opportunity_emitter');

class TradeInitiator {
    constructor(trader, eventName) {
        this.trader = trader;
        this.eventName = eventName;
    }

    initialize() {
        const $this = this;
        return new Pr((resolve, reject) => {
            opportunityEmitter.on($this.eventName, (opportunity) => {
                // console.log("TRADE INITIATOR received opportunity as: ", opportunity.symbol);

                if (opportunity.isGreat()) {
                    console.log(`TRADE_INITIATOR - great opportunity found!`);
                    console.log(`TRADE_INITIATOR - placing buy order...`);
                    console.log("");
                    $this.trader.createBuyOrderForOpportunity(opportunity).then((createdBuyOrder) => {
                        console.log("createdBuyOrder: ", createdBuyOrder);
                    }).catch((err) => {
                        console.error(`TRADE_INITIATOR - createBuyOrderForOpportunity error: ${err}`);
                    });
                }
            });
            resolve(new Date().toString());
        });
    }
}

module.exports = TradeInitiator;
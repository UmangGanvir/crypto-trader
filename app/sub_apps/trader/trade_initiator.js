const Pr = require('bluebird');
const CONSTANTS = require('../../constants');

class TradeInitiator {
    constructor(trader, emitter) {
        this.trader = trader;
        this.emitter = emitter;
    }

    initialize() {
        const $this = this;
        return new Pr((resolve, reject) => {
            $this.emitter.on(CONSTANTS.EVENT_OPPORTUNITY_FOUND, (opportunity) => {
                if (opportunity.isGreat()) {
                    console.log(`TRADE_INITIATOR - great opportunity found!`);
                    console.log(`TRADE_INITIATOR - placing buy order...`);
                    console.log("");

                    // $this.trader.createTradeForOpportunity(opportunity).then((createdTrade) => {
                    //     console.log("createdTrade: ", createdTrade);
                    //     $this.emitter.emit(CONSTANTS.EVENT_TRADE_CREATED, createdTrade);
                    // }).catch((err) => {
                    //     console.error(`TRADE_INITIATOR - createTradeForOpportunity error: ${err}`);
                    // });
                }
            });
            resolve(new Date().toString());
        });
    }
}

module.exports = TradeInitiator;
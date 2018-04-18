const Pr = require('bluebird');
const CONSTANTS = require('../../constants');

const TraderModuleClass = require('../../modules/trader');

class TradeInitiator {
    constructor(exchange, requestRateLimitPerSecond, emitter) {
        this.trader = new TraderModuleClass(exchange, requestRateLimitPerSecond);
        this.emitter = emitter;
    }

    initialize() {
        const $this = this;
        $this.emitter.on(CONSTANTS.EVENT_OPPORTUNITY_FOUND, (opportunity) => {
            if (opportunity.isGreat()) {
                console.log(`TRADE_INITIATOR- event: ${CONSTANTS.EVENT_OPPORTUNITY_FOUND} received!`);
                console.log(`TRADE_INITIATOR - great opportunity: `, opportunity.toObject());

                $this.trader.createTradeForOpportunity(opportunity).then((createdTrade) => {
                    console.log("");
                    console.log(`TRADE_INITIATOR - emitting created trade: `, createdTrade.toObject());
                    console.log("");
                    $this.emitter.emit(CONSTANTS.EVENT_TRADE_CREATED, createdTrade);
                }).catch((err) => {
                    console.log(`TRADE_INITIATOR - createTradeForOpportunity error: `, err);
                });
            }
        });
        return Pr.resolve(new Date().toString());
    }
}

module.exports = TradeInitiator;
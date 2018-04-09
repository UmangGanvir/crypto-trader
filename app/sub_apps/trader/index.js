const Pr = require('bluebird');

const TraderModuleClass = require('../../modules/trader');

const TradeInitiator = require('./trade_initiator');
const TradeWorkFlowBot = require('./trade_workflow_bot');

class Trader {
    /*
    * exchange - exchange client
    * requestRateLimitPerSecond - rate limit for the above exchange
    * emitter - opportunity emitter that the trade initiator must listen to
    * eventName - eventName for the opportunity emitter
    * */
    constructor(exchange, requestRateLimitPerSecond, emitter) {
        this.trader = new TraderModuleClass(exchange, requestRateLimitPerSecond);

        // TradeInitiator listens on this emitter for initiating a trade on opportunity
        this.emitter = emitter;
    }

    start() {
        const $this = this;
        return new Pr((resolve, reject) => {
            // 0 - trade initiator - initialize
            let tradeInitiator = new TradeInitiator($this.trader, $this.emitter);

            // 1 - trade workflow bot - start
            let tradeWorkFlowBot = new TradeWorkFlowBot($this.trader, $this.emitter);

            return Pr.join(
                tradeInitiator.initialize(),
                tradeWorkFlowBot.start(),
                (tradeInitiatorStartTime, tradeWorkFlowBotStartTime) => {
                    console.log("Trader - Trade Initiator - Start Time: ", tradeInitiatorStartTime);
                    console.log("Trader - Trade Workflow Bot - Start Time: ", tradeWorkFlowBotStartTime);
                    console.log();
                    resolve((new Date()).toString());
                }).catch((err) => {
                reject(err);
            });
        });
    }
}

module.exports = Trader;
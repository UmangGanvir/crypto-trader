const Pr = require('bluebird');

const TradeInitiator = require('./trade_initiator');
const TradeWorkFlowBot = require('./trade_workflow_bot');

class Trader {
    /*
    * exchange - exchange client
    * requestRateLimitPerSecond - rate limit for the above exchange
    * emitter - opportunity emitter that the trade initiator must listen to
    * */
    constructor(exchange, requestRateLimitPerSecond, emitter) {
        this.tradeInitiator = new TradeInitiator(exchange, requestRateLimitPerSecond, emitter);
        this.tradeWorkFlowBot = new TradeWorkFlowBot(exchange, requestRateLimitPerSecond, emitter);
    }

    initialize() {
        return Pr.join(
            this.tradeInitiator.initialize(),
            this.tradeWorkFlowBot.initialize(),
            (tradeInitiatorInitializationTime, tradeWorkFlowBotInitializationTime) => {
                console.log("Trader - Trade Initiator - Initialization Time: ", tradeInitiatorInitializationTime);
                console.log("Trader - Trade Workflow Bot - Initialization Time: ", tradeWorkFlowBotInitializationTime);
                console.log();
                return (new Date()).toString();
            });
    }

    start() {
        return Pr.join(
            this.tradeWorkFlowBot.start(),
            (tradeWorkFlowBotStartTime) => {
                console.log("Trader - Trade Workflow Bot - Start Time: ", tradeWorkFlowBotStartTime);
                console.log();
                return (new Date()).toString();
            });
    }

    stop() {
        return Pr.join(
            this.tradeWorkFlowBot.stop(),
            (tradeWorkFlowBotStopTime) => {
                console.log("Trader - Trade Workflow Bot - Stop Time: ", tradeWorkFlowBotStopTime);
                console.log();
                return (new Date()).toString();
            });
    }
}

module.exports = Trader;
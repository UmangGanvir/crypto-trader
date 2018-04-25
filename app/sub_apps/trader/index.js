const MODULE_NAME = "TRADER_SUB_APP";

const Pr = require('bluebird');
const logger = require('../../modules/logger')(MODULE_NAME);

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
            (tradeInitiatorInitialized, tradeWorkFlowBotInitialized) => {
                logger.info(`Trade Initiator - initialized!`);
                logger.info(`Trade Workflow Bot - initialized!`);
                return true;
            });
    }

    start() {
        return Pr.join(
            this.tradeWorkFlowBot.start(),
            (tradeWorkFlowBotStartTime) => {
                logger.info(`Trade Workflow Bot - started..`);
                return true;
            });
    }

    stop() {
        return Pr.join(
            this.tradeWorkFlowBot.stop(),
            (tradeWorkFlowBotStopTime) => {
                logger.info(`Trade Workflow Bot - stopped!`);
                return (new Date()).toString();
            });
    }
}

module.exports = Trader;
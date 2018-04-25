const MODULE_NAME = "TRADE_WORKFLOW_BOT";

const Pr = require('bluebird');
const CONSTANTS = require('../../constants');
const logger = require('../../modules/logger')(MODULE_NAME);

let Bot = require('../../modules/bot/index');
const TraderModuleClass = require('../../modules/trader');

class TradeWorkflowBot extends Bot {
    constructor(exchange, requestRateLimitPerSecond, emitter) {
        super("TRADE_WORKFLOW", requestRateLimitPerSecond);
        this.trader = new TraderModuleClass(exchange, requestRateLimitPerSecond);
        this.emitter = emitter;

        const $this = this;
        super.setTaskFunction(() => {
            return $this.transitionPhase.call($this).catch((err) => {
                logger.error(err);
            });
        });
    }

    transitionPhase() {
        let $this = this;
        return $this.transitionBuyPhaseTrades().then((buyTradesProgress) => {
            return $this.transitionSellPhaseTrades().then((sellTradesProgress) => {

                if (buyTradesProgress.length === 0 && sellTradesProgress.length === 0) {
                    logger.info(`finished transitioning all in-progress-trades`);
                    logger.info(`emitting event`);
                    $this.emitter.emit(CONSTANTS.EVENT_IN_PROGRESS_TRADES_COMPLETED);
                    $this.stop().catch((err) => {
                        logger.error(`error stopping the bot`);
                        logger.error(err);
                    });
                }
                return {
                    buyTradesProgress: buyTradesProgress,
                    sellTradesProgress: sellTradesProgress
                }
            });
        }).catch((err) => {
            logger.error(err);
        });
    }

    /*
    * Returns an array of (buy) trade progress
    * */
    transitionBuyPhaseTrades() {
        let $this = this;
        return TraderModuleClass.getInProgressTrades('buy').then(({trades, count}) => {
            if (count === 0) {
                return [];
            }

            return Pr.reduce(trades, (tradesProgress, buyTrade) => {
                return $this.trader.transitionBuyTrade(buyTrade).then((tradeProgress) => {
                    logger.info(tradeProgress);
                    tradesProgress.push(tradeProgress);
                    return tradesProgress;
                });
            }, []).then((tradesProgress) => {
                return tradesProgress;
            });
        });
    }

    /*
    * Returns an array of (sell) trade progress
    * */
    transitionSellPhaseTrades() {
        let $this = this;
        return TraderModuleClass.getInProgressTrades('sell').then(({trades, count}) => {
            if (count === 0) {
                return [];
            }

            return Pr.reduce(trades, (tradesProgress, sellTrade) => {
                return $this.trader.transitionSellTrade(sellTrade).then((tradeProgress) => {
                    logger.info(tradeProgress);
                    tradesProgress.push(tradeProgress);
                    return tradesProgress;
                });
            }, []).then((tradesProgress) => {
                return tradesProgress;
            });
        });
    }

    initialize() {
        const $this = this;
        // trade creation -> start trade workflow
        $this.emitter.on(CONSTANTS.EVENT_TRADE_CREATED, (trade) => {
            logger.info(`event: ${CONSTANTS.EVENT_TRADE_CREATED} received!`);
            logger.info(trade.toObject());
            logger.info(`starting...`);
            $this.start().catch((err) => {
                logger.error(`error starting the bot`);
                logger.error(err);
            });
        });
        return Pr.resolve(true);
    }

    start() {
        const $this = this;
        if ($this.isBotActive()) {
            return Pr.reject(`TRADE_WORKFLOW BOT - is already running...`);
        }

        // Initialization check - stop trade workflow if no trades are in progress
        return TraderModuleClass.areTradesInProgress().then(areTradesInProgress => {
            if (!areTradesInProgress) {
                return Pr.reject("No trades in progress found");
            }
            return super.activateBot();
        });
    }

    /*
    * returns the time when the module stopped if it did
    * else rejects promise
    * */
    stop() {
        const $this = this;
        if (!$this.isBotActive()) {
            return Pr.reject(`TRADE_WORKFLOW BOT - has already been stopped...`);
        }

        return TraderModuleClass.areTradesInProgress().then(areTradesInProgress => {
            if (areTradesInProgress) {
                logger.warn(`found trades in progress so not stopping.`);
                return Pr.reject("Trades in progress found!");
            }
            return super.deactivateBot();
        });
    }
}

module.exports = TradeWorkflowBot;

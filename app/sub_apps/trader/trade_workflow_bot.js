const Pr = require('bluebird');
const CONSTANTS = require('../../constants');

let Bot = require('../../modules/bot/index');
const TraderModuleClass = require('../../modules/trader');

class TradeWorkflowBot extends Bot {
    constructor(exchange, requestRateLimitPerSecond, emitter) {
        super("TRADE_WORKFLOW", requestRateLimitPerSecond);
        this.trader = new TraderModuleClass(exchange, requestRateLimitPerSecond);
        this.emitter = emitter;

        const $this = this;
        super.setTaskFunction(() => {
            return $this.transitionPhase.call($this);
        });
    }

    transitionPhase() {
        let $this = this;
        return $this.transitionBuyPhaseTrades().then((buyTradesProgress) => {
            return $this.transitionSellPhaseTrades().then((sellTradesProgress) => {
                // console.log("=============================");
                // console.log("TRADE_WORKFLOW - transitionPhase - buyTradesProgress: ", buyTradesProgress);
                // console.log("TRADE_WORKFLOW - transitionPhase - sellTradesProgress: ", sellTradesProgress);
                // console.log("=============================");
                // console.log();

                if (buyTradesProgress.length === 0 && sellTradesProgress.length === 0) {
                    console.log("");
                    console.log(`TRADE_WORKFLOW BOT - Finished transitioning all in progress trades`);
                    console.log(`TRADE_WORKFLOW BOT - emitting event`);
                    console.log("");
                    $this.emitter.emit(CONSTANTS.EVENT_IN_PROGRESS_TRADES_COMPLETED);
                    $this.stop().catch((err) => {
                        console.log(`TRADE_WORKFLOW - error stopping the bot: `, err);
                    });
                }
                return {
                    buyTradesProgress: buyTradesProgress,
                    sellTradesProgress: sellTradesProgress
                }
            });
        }).catch((err) => {
            console.error(`TRADE_WORKFLOW BOT - err: `, err);
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
                    console.log("=============================");
                    console.log("TRADER MODULE - transitionBuyTrade : ", tradeProgress);
                    console.log("=============================");
                    tradesProgress.push(tradeProgress);
                    return tradesProgress;
                });
            }, []).then((tradesProgress) => {
                // console.log("=============================");
                // console.log("TRADE_WORKFLOW - transitionBuyPhaseTrades - : " + tradesProgress.length);
                // console.log("=============================");
                // console.log();
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
                    console.log("=============================");
                    console.log("TRADER MODULE - transitionSellTrade : ", tradeProgress);
                    console.log("=============================");
                    tradesProgress.push(tradeProgress);
                    return tradesProgress;
                });
            }, []).then((tradesProgress) => {
                // console.log("=============================");
                // console.log("TRADE_WORKFLOW - transitionSellPhaseTrades - : " + tradesProgress.length);
                // console.log("=============================");
                // console.log();
                return tradesProgress;
            });
        });
    }

    initialize() {
        const $this = this;
        // trade creation -> start trade workflow
        $this.emitter.on(CONSTANTS.EVENT_TRADE_CREATED, (trade) => {
            console.log(`TRADE_WORKFLOW BOT - event: ${CONSTANTS.EVENT_TRADE_CREATED} received!`);
            console.log(`TRADE_WORKFLOW BOT - trade: `, trade.toObject());
            console.log(`TRADE_WORKFLOW BOT - starting...`);
            console.log("");
            $this.start().catch((err) => {
                console.log(`TRADE_WORKFLOW - error starting the bot: `, err);
            });
        });
        return Pr.resolve(new Date().toString());
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
                console.log(`TRADE_WORKFLOW BOT - found trades in progress so not stopping...`);
                return Pr.reject("Trades in progress found!");
            }
            return super.deactivateBot();
        });
    }
}

module.exports = TradeWorkflowBot;
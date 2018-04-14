const Pr = require('bluebird');
const CONSTANTS = require('../../constants');

let Bot = require('../../modules/bot/index');
const TraderModuleClass = require('../../modules/trader');

class TradeWorkflowBot extends Bot {
    constructor(trader, emitter) {
        super(
            "TRADE_WORKFLOW",
            (1000 / trader.requestRateLimitPerSecond)
        );
        this.trader = trader;
        this.emitter = emitter;

        const $this = this;
        super.setTaskFunction(() => {
            if ($this._disableTradeWorkflow) {
                return Pr.resolve();
            }
            return $this.transitionPhase.call($this);
        });

        this._disableTradeWorkflow = false;
    }

    disableTradeWorkflow() {
        this._disableTradeWorkflow = true;
    }

    enableTradeWorkflow() {
        this._disableTradeWorkflow = false;
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
                    $this.disableTradeWorkflow();
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

    start() {
        const $this = this;
        try {
            // trade creation -> start trade workflow
            $this.emitter.on(CONSTANTS.EVENT_TRADE_CREATED, (trade) => {
                console.log(`TRADE_WORKFLOW BOT - event: ${CONSTANTS.EVENT_TRADE_CREATED} received!`);
                console.log(`TRADE_WORKFLOW BOT - trade: `, trade.toObject());
                console.log(`TRADE_WORKFLOW BOT - starting...`);
                console.log("");
                $this.enableTradeWorkflow();
            });

            // Initialization check - stop trade workflow if no trades are in progress
            return TraderModuleClass.areTradesInProgress().then(areTradesInProgress => {
                if (!areTradesInProgress) {
                    console.log(`TRADE_WORKFLOW BOT - did not find trades in progress so disabling...`);
                    $this.disableTradeWorkflow();
                }
                return super.startRepeatingTask();
            });
        }
        catch (err) {
            return Pr.reject(err);
        }
    }
}

module.exports = TradeWorkflowBot;
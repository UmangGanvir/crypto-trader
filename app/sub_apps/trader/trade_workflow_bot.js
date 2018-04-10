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
        return $this.transitionBuyPhaseTrades().then((transitionedBuyTradeIds) => {
            return $this.transitionSellPhaseTrades().then((transitionedSellTradeIds) => {
                console.log("=============================");
                console.log("TRADE_WORKFLOW - transitionPhase - transitionedBuyTradeIds: " + transitionedBuyTradeIds);
                console.log("TRADE_WORKFLOW - transitionPhase - transitionedSellTradeIds: " + transitionedSellTradeIds);
                console.log("=============================");
                console.log();

                return TraderModuleClass.areTradesInProgress().then(areTradesInProgress => {
                    if (!areTradesInProgress) {
                        $this.disableTradeWorkflow();

                        console.log("");
                        console.log(`TRADE_WORKFLOW BOT - Finished transitioning all in progress trades`);
                        console.log(`TRADE_WORKFLOW BOT - emitting event`);
                        console.log("");
                        $this.emitter.emit(CONSTANTS.EVENT_IN_PROGRESS_TRADES_COMPLETED);
                    }
                });
            });
        });
    }

    /*
    * Returns the ids of the buy trades that were transitioned
    * */

    // TODO implement -> func returns array of [tradeProgress : { transitionedTradeId: 1, unchangedTradeId: 2 }]
    transitionBuyPhaseTrades() {
        let $this = this;
        return TraderModuleClass.getInProgressTrades('buy').then(({trades, count}) => {
            if (count === 0) {
                return [];
            }

            return Pr.reduce(trades, (buyTradeIds, buyTrade) => {
                return $this.trader.transitionBuyTrade(buyTrade.id, buyTrade.buyOrderId).then((buyTradeId) => {
                    buyTradeIds.push(buyTradeId);
                    return buyTradeIds;
                });
            }, []).then((buyTradeIds) => {
                // console.log("=============================");
                // console.log("TRADE_WORKFLOW - transitionBuyPhaseTrades - : " + buyTradeIds.length);
                // console.log("=============================");
                // console.log();
                return buyTradeIds;
            });
        });
    }

    /*
    * Returns the ids of the sell trades that were transitioned
    * */
    transitionSellPhaseTrades() {
        let $this = this;
        return TraderModuleClass.getInProgressTrades('sell').then(({trades, count}) => {
            if (count === 0) {
                return [];
            }

            return Pr.reduce(trades, (sellTradeIds, sellTrade) => {
                return $this.trader.transitionBuyTrade(sellTrade.id, sellTrade.buyOrderId).then((sellTradeId) => {
                    sellTradeIds.push(sellTradeId);
                    return sellTradeIds;
                });
            }, []).then((sellTradeIds) => {
                // console.log("=============================");
                // console.log("TRADE_WORKFLOW - transitionSellPhaseTrades - : " + sellTradeIds.length);
                // console.log("=============================");
                // console.log();
                return sellTradeIds;
            });
        });
    }

    start() {
        const $this = this;
        try {
            // trade creation -> start trade workflow
            $this.emitter.on(CONSTANTS.EVENT_TRADE_CREATED, (trade) => {
                console.log(`TRADE_WORKFLOW BOT - event: ${CONSTANTS.EVENT_TRADE_CREATED} received!`);
                console.log(`TRADE_WORKFLOW BOT - trade: `, trade);
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
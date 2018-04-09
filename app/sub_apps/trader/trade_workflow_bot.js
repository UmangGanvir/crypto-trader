const Pr = require('bluebird');

let Bot = require('../../modules/bot/index');

class TradeWorkflowBot extends Bot {
    constructor(trader, emitter) {
        super(
            "TRADE_WORKFLOW",
            (1000/trader.requestRateLimitPerSecond)
        );
        this.trader = trader;
        this.emitter = emitter;

        const $this = this;
        super.setTaskFunction(() => {
            console.log("setTaskFunction - transitionPhase ...");
            return $this.transitionPhase.call($this);
        });

    }

    transitionPhase() {
        console.log("transitionPhase...");
        let $this = this;
        return $this.transitionBuyPhaseTrades().then((transitionedBuyTradeIds) => {
            return $this.transitionSellPhaseTrades().then((transitionedSellTradeIds) => {
                console.log("=============================");
                console.log("TRADE_WORKFLOW - transitionPhase - transitionedBuyTradeIds: " + transitionedBuyTradeIds.length);
                console.log("TRADE_WORKFLOW - transitionPhase - transitionedSellTradeIds: " + transitionedSellTradeIds.length);
                console.log("=============================");
                console.log();
            });
        });
    }

    /*
    * Returns the ids of the buy trades that were transitioned
    * */
    transitionBuyPhaseTrades() {
        let $this = this;
        return $this.trader.getInProgressTrades('buy').then(({buyTrades, count}) => {
            if (count === 0) {
                return [];
            }

            return Pr.reduce(buyTrades, (buyTradeIds, buyTrade) => {
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
        return $this.trader.getInProgressTrades('sell').then(({sellTrades, count}) => {
            if (count === 0) {
                return [];
            }

            return Pr.reduce(sellTrades, (sellTradeIds, sellTrade) => {
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
}

module.exports = TradeWorkflowBot;
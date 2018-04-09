const Pr = require('bluebird');

const TradeDataStore = require('../../data_store/mysql/trade').getModelClass();

class Trader {
    constructor(exchange, requestRateLimitPerSecond) {
        this.exchange = exchange;
        this.requestRateLimitPerSecond = requestRateLimitPerSecond;
    }

    /**
     * Creates a trade in the 'buy' phase by placing a limit buy order
     */
    createTradeForOpportunity(opportunity) {
        let $this = this;
        return $this.areTradesInProgress().then(areTradesInProgress => {
            if (areTradesInProgress) {
                return Pr.reject("some trades are already in progress");
            }

            if (opportunity.symbol === 'BNB/ETH'){
                return Pr.reject("Trader Module does NOT support trades in BNB!");
            }

            return $this.exchange.fetchBalance().then((balance) => {
                const bnbFreeBalance = balance['BNB'].free;
                if (bnbFreeBalance < 0.2) {
                    return Pr.reject("BNB balance is below 0.2!");
                }

                const ethFreeBalance = balance['ETH'].free;
                const amountToBuy = ethFreeBalance / opportunity.getHighestBid();
                // $this.exchange.createLimitBuyOrder(opportunity.symbol, ethFreeBalance /)

                return TradeDataStore.createNew({
                    symbol: opportunity.symbol,
                    buyOrderId: 98765,
                });
            });
        });
    }

    /*
    * Transitions a single buy trade `appropriately`
    * Returns the trade id
    * */
    transitionBuyTrade(tradeId, buyOrderId) {
        let $this = this;
        return $this.exchange.fetchOrder(buyOrderId).then((buyOrder) => {
            // if (buyOrder.status === 'canceled'){
            //     return Pr.reject(`trade id: ${buyTrade.id} - buy order id: ${buyTrade.buyOrderId} was found already cancelled!`);
            // }

            // 0 - check if order is closed / cancelled -> if that is the case, place sell order for amount that was filled
            /*
            * Note:
            * This case handles a special case in case of cancelled
            * say the price shoots up by 2% and your order has been filled by X%
            * you should then cancel the buy order and sell
            * */
            if (buyOrder.status === 'closed' || buyOrder.status === 'canceled'){
                // move phase to 'sell' by placing a sell order

                const sellPrice = buyOrder.price * (1 + (process.env.TRADE_PROFIT_MARGIN_PERCENTAGE/100));
                return $this.exchange.createLimitSellOrder(buyOrder.symbol, buyOrder.filled, sellPrice).then((sellOrder) => {
                    return TradeDataStore.moveTradeToSellPhase({
                        tradeId: tradeId,
                        sellOrderId: sellOrder.id
                    }).then((todoUpdatedTrade) => {
                        return tradeId;
                    });
                });
            }

            // order is still open and has not been filled / cancelled


        });
    }

    /*
    * Returns a boolean indicating - whether any trade is in progress
    * */
    areTradesInProgress() {
        return TradeDataStore.getInProgressTrades().then(({ trades, count }) => {
            return count > 0;
        });
    }

    getInProgressTrades(phase) {
        return TradeDataStore.getInProgressTrades(phase).then(({ trades, count }) => {
            return trades;
        });
    }
}

module.exports = Trader;
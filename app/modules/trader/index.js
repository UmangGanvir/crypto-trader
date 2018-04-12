const Pr = require('bluebird');
const utils = require('../../utils/index');

let opportunityModuleClass = require('../../modules/opportunity');
const TradeDataStore = require('../../data_store/mysql/trade').getModelClass();

class TradeProgress {
    constructor(tradeId, transitioned) {
        this.tradeId = tradeId;
        this.transitioned = transitioned;
    }
}

class Trader {
    constructor(exchange, requestRateLimitPerSecond) {
        this.exchange = exchange;
        this.requestRateLimitPerSecond = requestRateLimitPerSecond;
        this.opportunity = new opportunityModuleClass(exchange, requestRateLimitPerSecond, undefined);
    }

    /**
     * Creates a trade in the 'buy' phase by placing a limit buy order
     */
    createTradeForOpportunity(opportunity) {
        let $this = this;
        return Trader.areTradesInProgress().then(areTradesInProgress => {
            if (areTradesInProgress) {
                return Pr.reject("some trades are already in progress");
            }

            if (opportunity.symbol === 'BNB/ETH') {
                return Pr.reject("Trader Module does NOT support trades in BNB!");
            }

            return $this.exchange.fetchBalance().then((balance) => {
                const bnbFreeBalance = balance['BNB'].free;
                // if (bnbFreeBalance < 0.2) {
                //     return Pr.reject("BNB balance is below 0.2!");
                // }

                const ethFreeBalance = balance['ETH'].free;
                const amountToBuy = ethFreeBalance / opportunity.getHighestBid();
                console.log(`createTradeForOpportunity - symbol: ${opportunity.symbol}`);
                console.log(`createTradeForOpportunity - amountToBuy: ${amountToBuy}`);
                console.log(`createTradeForOpportunity - price: ${opportunity.getHighestBid()}`);
                // params : { test: true }
                $this.exchange.createLimitBuyOrder(
                    opportunity.symbol,
                    amountToBuy,
                    opportunity.getHighestBid(),
                    {test: true}
                ).then((buyOrder) => {
                    console.log("buyOrder: ", buyOrder);
                    return TradeDataStore.createNew({
                        symbol: opportunity.symbol,
                        buyOrderId: buyOrder.id,
                        price: opportunity.price
                    });
                });
            });
        });
    }

    /**
     * Tries transitioning a single buy trade
     * Returns the tradeProgress
     *
     * Note: if you're taking actions which only run as part of transition, only than can you disrespect the rate limit
     * routine actions like fetching opportunity for open order's symbol must respect the rate limit
     * */
    transitionBuyTrade(buyTrade) {
        let $this = this;
        // TO be used for testing createLimitBuyOrder later
        return Pr.resolve({
            tradeId: buyTrade.id,
            transitioned: false
        });

        return $this.exchange.fetchOrder(buyTrade.buyOrderId).then((buyOrder) => {
            if (buyOrder.status === 'canceled') {
                return Pr.reject(`trade id: ${buyTrade.id} - buy order id: ${buyTrade.buyOrderId} was found already cancelled!`);
            }

            // 0 - check if order is closed
            if (buyOrder.status === 'closed') {
                // move phase to 'sell' by placing a sell order

                const TRADE_PROFIT_MARGIN_PERCENTAGE = parseFloat(process.env.TRADE_PROFIT_MARGIN_PERCENTAGE);
                const sellPrice = buyOrder.price * (1 + (TRADE_PROFIT_MARGIN_PERCENTAGE / 100));
                return $this.exchange.createLimitSellOrder(buyOrder.symbol, buyOrder.filled, sellPrice, {
                    test: true
                }).then((sellOrder) => {
                    return TradeDataStore.moveTradeToSellPhase({
                        tradeId: buyTrade.id,
                        sellOrderId: sellOrder.id
                    }).then((affectedRows) => {

                        if (affectedRows !== 1) {
                            return Pr.reject(
                                `trade id: ${buyTrade.id} - sell order id: ${sellOrder.id} - 
                                Updated incorrect number of rows: ${affectedRows} - placing sell order post buy order close.`
                            );
                        }
                        return new TradeProgress(buyTrade.id, true);
                    });
                });
            }

            return utils.delayPromise(
                $this.opportunity.findOpportunityForSymbol(buyTrade.symbol),
                (1000 / $this.requestRateLimitPerSecond)
            ).then((opportunity) => {

                return utils.delayPromise(
                    $this.exchange.fetchOrder(buyTrade.buyOrderId),
                    (1000 / $this.requestRateLimitPerSecond)
                ).then((buyOrder2) => {

                    if (buyOrder2.status === 'closed') {
                        // let the order be handled in next transition
                        return new TradeProgress(buyTrade.id, false);
                    }

                    // 1 - check if price has gone up by more than configured PRICE_SPIKE
                    if (
                        opportunity.price > buyTrade.price &&
                        ((opportunity.price - buyTrade.price) / buyTrade.price) * 100 > parseFloat(process.env.TRADE_PRICE_SPIKE_CUT_OFF_PERCENTAGE)
                    ) {

                        // 1 - 0 - cancel the order on price hike
                        return $this.exchange.cancelOrder(buyTrade.buyOrderId, buyTrade.symbol, {test: true}).then((unknown, cancel, params) => {
                            console.log("unknown cancel unfulfilled buy order param1: ", unknown);
                            console.log("unknown cancel unfulfilled buy order param2: ", cancel);
                            console.log("unknown cancel unfulfilled buy order param3: ", params);

                            // 1 - 0 - 0 - if unfilled -> mark trade as complete
                            if (buyOrder2.filled === 0) {
                                /**
                                 * There might be case here - by the time you cancel, some part has been fulfilled
                                 * ignoring for now because the possibility is too low
                                 * After there has been a price hike of 2% there's small chance that the price falls by 2% for order fulfillment
                                 * */
                                return TradeDataStore.complete({
                                    tradeId: buyTrade.id,
                                }).then((affectedRows) => {
                                    if (affectedRows !== 1) {
                                        return Pr.reject(
                                            `trade id: ${buyTrade.id} - buy order id: ${buyTrade.id} -
                                            Updated incorrect number of rows: ${affectedRows} for completing order by cancelling buy order`
                                        );
                                    }
                                    return new TradeProgress(buyTrade.id, true);
                                });
                            } else {
                                const TRADE_PROFIT_MARGIN_PERCENTAGE_PRICE_SPIKE = parseFloat(process.env.TRADE_PROFIT_MARGIN_PERCENTAGE_PRICE_SPIKE);
                                const sellPrice = buyOrder.price * (1 + (TRADE_PROFIT_MARGIN_PERCENTAGE_PRICE_SPIKE / 100));
                                return $this.exchange.createLimitSellOrder(buyOrder.symbol, buyOrder2.filled, sellPrice, {
                                    test: true
                                }).then((sellOrder) => {
                                    return TradeDataStore.moveTradeToSellPhase({
                                        tradeId: buyTrade.id,
                                        sellOrderId: sellOrder.id
                                    }).then((affectedRows) => {

                                        if (affectedRows !== 1) {
                                            return Pr.reject(
                                                `trade id: ${buyTrade.id} - sell order id: ${sellOrder.id} - 
                                Updated incorrect number of rows: ${affectedRows} for placing sell order post 2% price hike`
                                            );
                                        }
                                        return new TradeProgress(buyTrade.id, true);
                                    });
                                });
                            }
                        });
                    }

                    // 2 - check if opportunity has been lost
                    if (!opportunity.isValid()) {
                        // 2 - 0 - if opportunity has been lost and order is still unfilled, cancel the order and mark as complete
                        if (buyOrder2.filled === 0) {
                            return $this.exchange.cancelOrder(buyTrade.buyOrderId, buyTrade.symbol, {test: true}).then((unknown, cancel, params) => {
                                console.log("unknown cancel unfulfilled buy order param1: ", unknown);
                                console.log("unknown cancel unfulfilled buy order param2: ", cancel);
                                console.log("unknown cancel unfulfilled buy order param3: ", params);

                                return TradeDataStore.complete({
                                    tradeId: buyTrade.id,
                                }).then((affectedRows) => {
                                    if (affectedRows !== 1) {
                                        return Pr.reject(
                                            `trade id: ${buyTrade.id} - buy order id: ${buyTrade.id} -
                                            Updated incorrect number of rows: ${affectedRows} for cancelling unfilled buy order on opportunity being lost`
                                        );
                                    }
                                    return new TradeProgress(buyTrade.id, true);
                                });
                            });
                        }
                    }
                });
            });
        });
    }

    /**
     * Tries transitioning a single trade
     * Returns the tradeProgress
     *
     * Note: if you're taking actions which only run as part of transition, only than can you disrespect the rate limit
     * routine actions like fetching opportunity for open order's symbol must respect the rate limit
     * */
    transitionSellTrade(sellTrade) {
        let $this = this;
        // TO be used for testing later
        return Pr.resolve({
            tradeId: sellTrade.id,
            transitioned: false
        });

        return $this.exchange.fetchOrder(sellTrade.sellOrderId).then((sellOrder) => {
            if (sellOrder.status === 'canceled') {
                return Pr.reject(`trade id: ${sellTrade.id} - sell order id: ${sellTrade.sellOrderId} was found cancelled!`);
            }

            // 0 - check if order is closed
            if (sellOrder.status === 'closed') {
                // mark the trade as complete
                return TradeDataStore.complete({
                    tradeId: sellTrade.id,
                }).then((affectedRows) => {
                    if (affectedRows !== 1) {
                        return Pr.reject(
                            `trade id: ${sellTrade.id} - sell order id: ${sellTrade.sellOrderId} -
                                            Updated incorrect number of rows: ${affectedRows} for completing order by cancelling buy order`
                        );
                    }
                    return new TradeProgress(sellTrade.id, true);
                });
            }

            return utils.delayPromise(
                $this.opportunity.findOpportunityForSymbol(sellTrade.symbol),
                (1000 / $this.requestRateLimitPerSecond)
            ).then((opportunity) => {

                return utils.delayPromise(
                    $this.exchange.fetchOrder(sellTrade.sellOrderId),
                    (1000 / $this.requestRateLimitPerSecond)
                ).then((sellOrder2) => {

                    if (sellOrder2.status === 'closed') {
                        // let the order be handled in next transition
                        return new TradeProgress(sellTrade.id, false);
                    }

                    // 1 - check if price has gone down by more than configured PRICE_SPIKE
                    if (
                        opportunity.price < sellTrade.price &&
                        ((sellTrade.price - opportunity.price) / opportunity.price) * 100 > parseFloat(process.env.TRADE_PRICE_SPIKE_CUT_OFF_PERCENTAGE)
                    ) {

                        // 1 - 0 - cancel the order on price drop
                        return $this.exchange.cancelOrder(sellTrade.buyOrderId, sellTrade.symbol, {test: true}).then((unknown, cancel, params) => {
                            console.log("unknown cancel unfulfilled buy order param1: ", unknown);
                            console.log("unknown cancel unfulfilled buy order param2: ", cancel);
                            console.log("unknown cancel unfulfilled buy order param3: ", params);

                            $this.exchange.createMarketSellOrder(sellOrder.symbol, sellOrder2.filled, {test: true}).then((marketSellOrder) => {
                                // mark the trade as complete
                                return TradeDataStore.complete({
                                    tradeId: sellTrade.id,
                                }).then((affectedRows) => {
                                    if (affectedRows !== 1) {
                                        return Pr.reject(
                                            `trade id: ${sellTrade.id} - sell order id: ${sellTrade.sellOrderId} -
                                            marketSellOrder id: ${marketSellOrder.id}
                                            Updated incorrect number of rows: ${affectedRows} for completing order by cancelling buy order`
                                        );
                                    }
                                    console.log("ALERT!!! - Market sell order executed!!!");
                                    console.log("ALERT!!! - Market Sell Order Id: ", marketSellOrder.id);
                                    return new TradeProgress(sellTrade.id, true);
                                });
                            });
                        });
                    }
                });
            });
        });
    }

    /*
    * Returns a boolean indicating - whether any trade is in progress
    * */
    static areTradesInProgress() {
        return TradeDataStore.getInProgressTrades().then(({trades, count}) => {
            return count > 0;
        });
    }

    /*
    * Returns
    * 1. array of trades
    * 2. the count of total trades that match the criteria
    * */
    static getInProgressTrades(phase) {
        return TradeDataStore.getInProgressTrades(phase).then((resp) => {
            return {trades: resp.rows, count: resp.count};
        });
    }
}

module.exports = Trader;
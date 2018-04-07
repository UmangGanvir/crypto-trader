const Pr = require('bluebird');

const TradeDataStore = require('../../data_store/mysql/trade').getModelClass();

class Trader {
    constructor(exchange) {
        this.exchange = exchange;
    }

    getOrder(orderId) {
        const $this = this;
        return new Pr((resolve, reject) => {
            $this.exchange.fetchOrder(orderId).then((order) => {
                console.log("order: ", order);
                resolve(order);
            }).catch((err) => {
                reject(err);
            })
        });
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
    * Returns a boolean indicating - whether any trade is in progress
    * */
    static areTradesInProgress() {
        return TradeDataStore.getInProgressTrades().then(( trades ) => {
            return (trades.length !== 0);
        });
    }
}

module.exports = Trader;
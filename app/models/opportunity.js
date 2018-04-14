const TradingUtils = require('../utils/trading_utils');

class Opportunity {
    constructor(ticker, orderBook) {
        this.symbol = ticker.symbol;
        this.price = ticker.last;
        this.quoteVolume = ticker.quoteVolume;
        // TODO implement
        // reason - stable crypto-currencies can't be traded profitably
        this.standardDeviation5min = 0;
        // refactor buySellRatio
        this.buySellRatio = TradingUtils.getBuySellRatio(orderBook.bids, orderBook.asks);

        this._bids = orderBook.bids;
        this._asks = orderBook.asks;
    }

    getHighestBid() {
        return this._bids[99][0];
        // return this._bids[0][0];
    }

    isValid() {
        if (!this.buySellRatio) {
            return false;
        }
        if (
            this.buySellRatio.r100 < 1 ||
            this.buySellRatio.r50 < 1 ||
            this.buySellRatio.r20 < 1 ||
            this.buySellRatio.r10 < 1 ||
            this.buySellRatio.r5 < 1
        ) {
            return false;
        }
        return true;
    }

    isGreat() {
        if (!this.isValid()) {
            return false;
        }
        return this.ungreatnessReason() === undefined;
    }

    ungreatnessReason() {
        // 0 - should have minimum quote
        if (this.quoteVolume < 1500) {
            return "quoteVolume is less than 1500";
        }
        const OPPORTUNITY_GREATNESS_RATIO = parseFloat(process.env.OPPORTUNITY_GREATNESS_RATIO);
        if (this.buySellRatio.r100 < OPPORTUNITY_GREATNESS_RATIO) {
            return `buySellRatio - r100 is less than ${OPPORTUNITY_GREATNESS_RATIO}`;
        }
        if (this.buySellRatio.r50 < OPPORTUNITY_GREATNESS_RATIO) {
            return `buySellRatio - r50 is less than ${OPPORTUNITY_GREATNESS_RATIO}`;
        }
        if (this.buySellRatio.r20 < OPPORTUNITY_GREATNESS_RATIO) {
            return `buySellRatio - r20 is less than ${OPPORTUNITY_GREATNESS_RATIO}`;
        }
        if (this.buySellRatio.r10 < OPPORTUNITY_GREATNESS_RATIO) {
            return `buySellRatio - r10 is less than ${OPPORTUNITY_GREATNESS_RATIO}`;
        }
        if (this.buySellRatio.r5 < OPPORTUNITY_GREATNESS_RATIO) {
            return `buySellRatio - r5 is less than ${OPPORTUNITY_GREATNESS_RATIO}`;
        }
        return undefined
    }

    static getInvalidOpportunity() {
        return new Opportunity({}, {bids: []});
    }
}

module.exports = Opportunity;
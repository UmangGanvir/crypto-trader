const Pr = require('bluebird');
const TradingUtils = require('../utils/trading_utils');

class Opportunity {
    constructor(ticker, orderBook) {
        this.symbol = ticker.symbol;
        this.price = ticker.last;
        this.quoteVolume = ticker.quoteVolume;
        this.buySellRatio = TradingUtils.getBuySellRatio(ticker.last, orderBook.bids, orderBook.asks);
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
        if (this.buySellRatio.r100 < process.env.OPPORTUNITY_GREATNESS_RATIO) {
            return `buySellRatio - r100 is less than ${process.env.OPPORTUNITY_GREATNESS_RATIO}`;
        }
        if (this.buySellRatio.r50 < process.env.OPPORTUNITY_GREATNESS_RATIO) {
            return `buySellRatio - r50 is less than ${process.env.OPPORTUNITY_GREATNESS_RATIO}`;
        }
        if (this.buySellRatio.r20 < process.env.OPPORTUNITY_GREATNESS_RATIO) {
            return `buySellRatio - r20 is less than ${process.env.OPPORTUNITY_GREATNESS_RATIO}`;
        }
        if (this.buySellRatio.r10 < process.env.OPPORTUNITY_GREATNESS_RATIO) {
            return `buySellRatio - r10 is less than ${process.env.OPPORTUNITY_GREATNESS_RATIO}`;
        }
        if (this.buySellRatio.r5 < process.env.OPPORTUNITY_GREATNESS_RATIO) {
            return `buySellRatio - r5 is less than ${process.env.OPPORTUNITY_GREATNESS_RATIO}`;
        }
        return undefined
    }
}

module.exports = Opportunity;
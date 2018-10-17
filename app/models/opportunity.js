const TradingUtils = require('../utils/trading_utils');

class Opportunity {
    constructor(symbol, ticker, orderBook, OHCLVs) {
        // private members
        this._bids = orderBook.bids;
        this._asks = orderBook.asks;
        this._OHLCVs = OHCLVs;

        this.symbol = symbol;
        this.price = ticker.last;
        this.quoteVolume = ticker.quoteVolume;
        this.standardDeviationMeanPercentage1min = TradingUtils.getStandardDeviationMeanPercentageFromOHLCVs(this._OHLCVs);
        this.buySellRatio = TradingUtils.getBuySellRatio(this._bids, this._asks);
    }

    getHighestBid() {
        return this._bids[0][0];
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

    toObject() {
        return {
            symbol: this.symbol,
            price: this.price,
            quoteVolume: this.quoteVolume,
            standardDeviationMeanPercentage1min: this.standardDeviationMeanPercentage1min,
            buySellRatio: this.buySellRatio ? this.buySellRatio.toObject() : undefined,
        }
    }

    isGreat() {
        if (!this.isValid()) {
            return false;
        }
        return this.ungreatnessReason() === undefined;
    }

    ungreatnessReason() {
        const OPPORTUNITY_MIN_QUOTE_VOLUME = parseFloat(process.env.OPPORTUNITY_MIN_QUOTE_VOLUME);
        const OPPORTUNITY_MIN_STD_DEVIATION_MEAN_PERCENTAGE = parseFloat(process.env.OPPORTUNITY_MIN_STD_DEVIATION_MEAN_PERCENTAGE);
        const OPPORTUNITY_MAX_STD_DEVIATION_MEAN_PERCENTAGE = parseFloat(process.env.OPPORTUNITY_MAX_STD_DEVIATION_MEAN_PERCENTAGE);
        const OPPORTUNITY_GREATNESS_RATIO = parseFloat(process.env.OPPORTUNITY_GREATNESS_RATIO);

        // 0 - should have minimum quote
        if (this.quoteVolume < OPPORTUNITY_MIN_QUOTE_VOLUME) {
            return `quoteVolume is less than OPPORTUNITY_MIN_QUOTE_VOLUME: ${OPPORTUNITY_MIN_QUOTE_VOLUME}`;
        }

        // 1 - standard deviation mean percentage for 1m should be higher than minimum configured
        if (this.standardDeviationMeanPercentage1min < OPPORTUNITY_MIN_STD_DEVIATION_MEAN_PERCENTAGE) {
            return `standardDeviationMeanPercentage1min is less than OPPORTUNITY_MIN_STD_DEVIATION_MEAN_PERCENTAGE: ${OPPORTUNITY_MIN_STD_DEVIATION_MEAN_PERCENTAGE}`;
        }

        // 2 - standard deviation mean percentage for 1m should be lesser than maximum configured
        if (this.standardDeviationMeanPercentage1min > OPPORTUNITY_MAX_STD_DEVIATION_MEAN_PERCENTAGE) {
            return `standardDeviationMeanPercentage1min is more than OPPORTUNITY_MAX_STD_DEVIATION_MEAN_PERCENTAGE: ${OPPORTUNITY_MAX_STD_DEVIATION_MEAN_PERCENTAGE}`;
        }

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

    static getInvalidOpportunity(symbol) {
        return new Opportunity(symbol, {}, {bids: []});
    }
}

module.exports = Opportunity;
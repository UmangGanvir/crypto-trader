const _ = require('underscore');
const math = require('mathjs');

class BuySellRatio {
    constructor(r100, r50, r20, r10, r5) {
        this.r100 = r100;
        this.r50 = r50;
        this.r20 = r20;
        this.r10 = r10;
        this.r5 = r5;
    }

    toString() {
        return {
            r100: this.r100,
            r50: this.r50,
            r20: this.r20,
            r10: this.r10,
            r5: this.r5
        }
    }
}

class TradingUtils {
    static getBuySellRatio(bids, asks) {
        // Most of the times price shall be between the highest big and the lowest ask
        // but not necessarily, a price can be stale so it must not be taken into consideration for an opportunity

        // for bids and asks, indices represent the following values
        // 0 - price, 1 - volume
        // {
        //     bids:
        //         [
        //             [0.02599, 307.69],
        //             [0.025988, 21.93]
        //         ],
        //     asks:
        //         [
        //             [0.026, 0.33],
        //             [0.026073, 4.37]
        //         ]
        // };

        if (bids.length < 100 || asks.length < 100) {
            return undefined;
        }

        // make bid volumes incremental
        for (let i = 1; i < bids.length; i++) {
            bids[i][1] = bids[i][1] + bids[i - 1][1];
        }

        // make ask volumes incremental
        for (let i = 1; i < asks.length; i++) {
            asks[i][1] = asks[i][1] + asks[i - 1][1];
        }

        const spread = asks[0][0] - bids[0][0];
        const meanSpreadPrice = bids[0][0] + spread / 2;

        return new BuySellRatio(
            (bids[99][1] / (meanSpreadPrice - bids[99][0])) / (asks[99][1] / (asks[99][0] - meanSpreadPrice)),
            (bids[49][1] / (meanSpreadPrice - bids[49][0])) / (asks[49][1] / (asks[49][0] - meanSpreadPrice)),
            (bids[19][1] / (meanSpreadPrice - bids[19][0])) / (asks[19][1] / (asks[19][0] - meanSpreadPrice)),
            (bids[9][1] / (meanSpreadPrice - bids[9][0])) / (asks[9][1] / (asks[9][0] - meanSpreadPrice)),
            (bids[4][1] / (meanSpreadPrice - bids[4][0])) / (asks[4][1] / (asks[4][0] - meanSpreadPrice))
        );
    }

    static getStandardDeviationMeanPercentageFromOHLCVs(OHLCVs) {
        if (OHLCVs === undefined || OHLCVs.length === 0) {
            return 0;
        }

        const closingPrices = _.map(OHLCVs, (elem) => elem[2]);
        const standardDeviation = math.std(closingPrices);
        const mean = math.mean(closingPrices);
        return (standardDeviation / mean) * 100;
    }
}

module.exports = TradingUtils;

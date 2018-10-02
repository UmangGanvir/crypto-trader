const MODULE_NAME = "MARKET_SENTIMENT_MODULE";

const Pr = require('bluebird');
const deepFreeze = require('deep-freeze');
const logger = require('../../modules/logger')(MODULE_NAME);

let MARKET_SENTIMENTS = {
    BEARISH: "bearish",
    NEUTRAL: "neutral",
    BULLISH: "bullish"
};
MARKET_SENTIMENTS = deepFreeze(MARKET_SENTIMENTS);

class MarketSentiment {
    constructor(quote) {
        this._quote = quote;
        this._initialized = false;
        this._marketSentiment = MARKET_SENTIMENTS.BEARISH;
        this._cryptoPair24hrChangePercentageMap = {}
    }

    setCryptoPair24hrChangePercentage(cryptoPairSymbol, changePercentage) {
        if (cryptoPairSymbol !== "TUSD/USDT") {
            this._cryptoPair24hrChangePercentageMap[cryptoPairSymbol] = changePercentage;
            this._initialized = true;
        }
    }

    getMarketSentiment() {
        const $this = this;
        return new Pr((resolve, reject) => {

            if (!$this._initialized) {
                logger.info(`market sentiment not initialized yet`);
                return resolve(MARKET_SENTIMENTS.BEARISH);
            }

            let positives = 0;
            let marketSize = Object.keys($this._cryptoPair24hrChangePercentageMap).length;

            for (let cryptoPairSymbol in $this._cryptoPair24hrChangePercentageMap) {
                if ($this._cryptoPair24hrChangePercentageMap[cryptoPairSymbol] > 0) {
                    positives++;
                }
            }

            let positiveAvg = (positives / marketSize);
            if (positiveAvg >= 0.7) {
                resolve(MARKET_SENTIMENTS.BULLISH);
            } else if (positiveAvg < 0.7 && positiveAvg > 0.4) {
                resolve(MARKET_SENTIMENTS.NEUTRAL);
            } else {
                resolve(MARKET_SENTIMENTS.BEARISH);
            }
        });
    }

    isBearish() {
        return this.getMarketSentiment().then((calculatedMarketSentiment) => {
            return (calculatedMarketSentiment === MARKET_SENTIMENTS.BEARISH);
        });
    }
}

module.exports = MarketSentiment;
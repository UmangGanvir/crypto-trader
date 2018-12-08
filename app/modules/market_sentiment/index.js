const MODULE_NAME = "MARKET_SENTIMENT_MODULE";

const deepFreeze = require('deep-freeze');
const logger = require('../../modules/logger')(MODULE_NAME);

let QUOTE_MARKET_SENTIMENTS = {
    BEARISH: "bearish",
    NEUTRAL: "neutral",
    BULLISH: "bullish"
};
QUOTE_MARKET_SENTIMENTS = deepFreeze(QUOTE_MARKET_SENTIMENTS);

class QuoteMarketSentiment {
    constructor(quote) {
        this._quote = quote;
        this._initialized = false;
        this._cryptoPair24hrChangePercentageMap = {}
    }

    setCryptoPair24hrChangePercentage(cryptoPairSymbol, changePercentage) {
        if (cryptoPairSymbol !== "TUSD/USDT") {
            this._cryptoPair24hrChangePercentageMap[cryptoPairSymbol] = changePercentage;
            this._initialized = true;
        }
    }

    getQuoteMarketSentiment() {
        let marketSentiment = QUOTE_MARKET_SENTIMENTS.BEARISH;

        const $this = this;
        if (!$this._initialized) {
            logger.error(`market sentiment not initialized yet for quote: ${$this._quote}`);
            return marketSentiment;
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
            marketSentiment = QUOTE_MARKET_SENTIMENTS.BULLISH;
        } else if (positiveAvg < 0.7 && positiveAvg > 0.4) {
            marketSentiment = QUOTE_MARKET_SENTIMENTS.NEUTRAL;
        } else {
            marketSentiment = QUOTE_MARKET_SENTIMENTS.BEARISH;
        }
        return marketSentiment;
    }

    isBearish() {
        return (this.getQuoteMarketSentiment() === QUOTE_MARKET_SENTIMENTS.BEARISH);
    }
}

let marketSentimentMap = {};

class GlobalMarketSentiment {
    static getMarketSentimentForQuote(quote) {
        if (!(quote in marketSentimentMap)) {
            marketSentimentMap[quote] = new QuoteMarketSentiment(quote);
        }
        return marketSentimentMap[quote];
    }
}

module.exports = GlobalMarketSentiment;
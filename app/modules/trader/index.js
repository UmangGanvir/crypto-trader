const Pr = require('bluebird');

class Trader {
    constructor(exchange) {
        this.exchange = exchange;
    }

    createBuyOrderForOpportunity(opportunity){
        const $this = this;
        return new Pr((resolve, reject) => {

            // $this.exchange.createB
            resolve("placed!")
        });
    }
}

module.exports = Trader;
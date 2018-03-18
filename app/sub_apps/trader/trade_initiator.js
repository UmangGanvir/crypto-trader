const Pr = require('bluebird');

let opportunityEmitter = require('../../modules/opportunity/opportunity_emitter');

class TradeInitiator {
    constructor(){}

    initialize(){
        return new Pr((resolve, reject) => {
            opportunityEmitter.on('OPPORTUNITY_FOUND', (opportunity) => {
                // store into db too
                // TODO

                if (opportunity.isGreat()) {
                    console.log("\n----------GREAT---------------");
                    console.log(opportunity.symbol + ": ", opportunity);
                    console.log("--------------------------------\n");
                } else {
                    console.log(opportunity.symbol + ": ", JSON.stringify(opportunity));
                }
            });
            resolve(new Date().toString());
        });
    }
}

module.exports = new TradeInitiator();
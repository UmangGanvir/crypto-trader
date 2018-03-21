const Pr = require('bluebird');
const EventEmitter = require('events');

let opportunityEmitter = require('../../modules/opportunity/opportunity_emitter');
const OpportunityModule = require('../../modules/opportunity');

class TradeInitiator {
    constructor() {
    }

    initialize(eventName) {
        return new Pr((resolve, reject) => {
            opportunityEmitter.on(eventName, (opportunity) => {
                // TODO initiate trade here!

                // console.log("TRADE INITIATOR received opportunity as: ", opportunity);
            });
            resolve(new Date().toString());
        });
    }
}

module.exports = new TradeInitiator();
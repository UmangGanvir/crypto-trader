const Pr = require('bluebird');

let opportunityEmitter = require('../../modules/opportunity/opportunity_emitter');
const OpportunityModule = require('../../modules/opportunity');

const MODULE_NAME = "OPPORTUNITY_ARCHIVER";

class OpportunityArchiver {
    // Archiver listens to this event for archiving opportunity
    constructor(eventName) {
        this.eventName = eventName
    }

    initialize() {
        const $this = this;
        return new Pr((resolve, reject) => {
            opportunityEmitter.on($this.eventName, (opportunity) => {

                OpportunityModule.save(opportunity).then((savedOpportunity) => {
                    // console.log(`${MODULE_NAME}: OpportunityModule - savedOpportunity: `, savedOpportunity.id);
                }).catch((err) => {
                    console.log(`${MODULE_NAME}: OpportunityModule - err saving opportunity: `, err);
                });
            });
            resolve(new Date().toString());
        });
    }
}

module.exports = OpportunityArchiver;
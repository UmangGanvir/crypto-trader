const Pr = require('bluebird');
const CONSTANTS = require('../../constants');

const OpportunityModule = require('../../modules/opportunity');

const MODULE_NAME = "OPPORTUNITY_ARCHIVER";

class OpportunityArchiver {
    // Archiver listens to this event for archiving opportunity
    constructor(emitter) {
        this.emitter = emitter;
    }

    initialize() {
        const $this = this;
        return new Pr((resolve, reject) => {
            $this.emitter.on(CONSTANTS.EVENT_OPPORTUNITY_FOUND, (opportunity) => {

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
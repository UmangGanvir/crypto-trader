const MODULE_NAME = "OPPORTUNITY_ARCHIVER";

const Pr = require('bluebird');
const CONSTANTS = require('../../constants');
const logger = require('../../modules/logger')(MODULE_NAME);

const OpportunityModule = require('../../modules/opportunity');

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
                    // logger.info(`OpportunityModule - savedOpportunity!`);
                    // logger.info(savedOpportunity.id);
                }).catch((err) => {
                    logger.error(`err saving opportunity`);
                    logger.error(err);
                });
            });
            resolve(true);
        });
    }
}

module.exports = OpportunityArchiver;
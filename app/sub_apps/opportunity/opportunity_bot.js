const Pr = require('bluebird');
const CONSTANTS = require('../../constants');

let Bot = require('../../modules/bot/index');
let opportunityModuleClass = require('../../modules/opportunity');

class OpportunityBot extends Bot {
    constructor(exchange, requestRateLimitPerSecond, emitter) {
        super(
            "OPPORTUNITY",
            (1000 / requestRateLimitPerSecond)
        );
        this.emitter = emitter;
        this.opportunity = new opportunityModuleClass(exchange, requestRateLimitPerSecond, emitter);

        const $this = this;
        super.setTaskFunction(() => {
            return $this.opportunity.findMarketOpportunities.call(this.opportunity, true);
        });
    }

    start() {
        const $this = this;
        try {
            // 0 - trade creation -> stop finding opportunities
            $this.emitter.on(CONSTANTS.EVENT_TRADE_CREATED, (trade) => {
                console.log(`OPPORTUNITY_BOT - event: ${CONSTANTS.EVENT_TRADE_CREATED} received!`);
                console.log(`OPPORTUNITY_BOT - stopping to find opportunities`);
                console.log("");
                $this.opportunity.disableFindingOpportunities();
            });

            // 1 - trade completed -> start finding opportunities again
            $this.emitter.on(CONSTANTS.EVENT_TRADE_COMPLETED, (trade) => {
                console.log(`OPPORTUNITY_BOT - event: ${CONSTANTS.EVENT_TRADE_COMPLETED} received!`);
                console.log(`OPPORTUNITY_BOT - starting to find opportunities again`);
                console.log("");
                $this.opportunity.enableFindingOpportunities();
            });
        }
        catch (err) {
            return Pr.reject(err);
        }
        return super.start();
    }
}

module.exports = OpportunityBot;
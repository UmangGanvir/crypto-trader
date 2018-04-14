const Pr = require('bluebird');
const CONSTANTS = require('../../constants');

let Bot = require('../../modules/bot/index');
let opportunityModuleClass = require('../../modules/opportunity');
const TraderModuleClass = require('../../modules/trader');

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
                console.log(`OPPORTUNITY BOT - event: ${CONSTANTS.EVENT_TRADE_CREATED} received!`);
                console.log(`OPPORTUNITY_BOT - stopping... to find opportunities`);
                console.log("");
                $this.opportunity.disableFindingOpportunities();
            });

            // 1 - in progress trades completed -> start finding opportunities again
            $this.emitter.on(CONSTANTS.EVENT_IN_PROGRESS_TRADES_COMPLETED, () => {
                console.log(`OPPORTUNITY BOT - event: ${CONSTANTS.EVENT_IN_PROGRESS_TRADES_COMPLETED} received!`);
                console.log(`OPPORTUNITY_BOT - starting... to find opportunities`);
                console.log("");
                $this.opportunity.enableFindingOpportunities();
            });

            // Initialization check - don't find opportunities if trades are in progress
            return TraderModuleClass.areTradesInProgress().then(areTradesInProgress => {
                if (areTradesInProgress) {
                    console.log(`OPPORTUNITY BOT - found trades in progress so disabling... to find opportunities`);
                    $this.opportunity.disableFindingOpportunities();
                }
                return super.startRepeatingTask();
            });
        }
        catch (err) {
            return Pr.reject(err);
        }
    }
}

module.exports = OpportunityBot;
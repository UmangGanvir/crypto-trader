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

    initialize() {
        const $this = this;

        // 0 - trade creation -> stop finding opportunities
        $this.emitter.on(CONSTANTS.EVENT_TRADE_CREATED, (trade) => {
            console.log(`OPPORTUNITY BOT - event: ${CONSTANTS.EVENT_TRADE_CREATED} received!`);
            console.log(`OPPORTUNITY_BOT - stopping... to find opportunities`);
            console.log("");
            $this.stop().catch((err) => {
                console.log(`OPPORTUNITY_BOT - error stopping the bot: `, err);
            });
        });

        // 1 - in progress trades completed -> start finding opportunities again
        $this.emitter.on(CONSTANTS.EVENT_IN_PROGRESS_TRADES_COMPLETED, () => {
            console.log(`OPPORTUNITY BOT - event: ${CONSTANTS.EVENT_IN_PROGRESS_TRADES_COMPLETED} received!`);
            console.log(`OPPORTUNITY_BOT - starting...`);
            console.log("");
            $this.start().catch((err) => {
                console.log(`OPPORTUNITY_BOT - error starting the bot: `, err);
            });
        });
        return Pr.resolve(new Date().toString());
    }

    start() {
        const $this = this;
        if ($this.isBotActive()) {
            return Pr.reject(`OPPORTUNITY_BOT - is already running...`);
        }

        // Initialization check - don't find opportunities if trades are in progress
        return TraderModuleClass.areTradesInProgress().then(areTradesInProgress => {
            if (areTradesInProgress) {
                return Pr.reject("Trades in progress found!");
            }
            $this.opportunity.enableFindingOpportunities();
            return super.activateBot();
        });
    }

    /*
    * returns the time when the module stopped if it did
    * else rejects promise
    * */
    stop() {
        const $this = this;
        if (!$this.isBotActive()) {
            return Pr.reject(`OPPORTUNITY_BOT - has already been stopped...`);
        }

        $this.opportunity.disableFindingOpportunities();
        return super.deactivateBot();
    }
}

module.exports = OpportunityBot;
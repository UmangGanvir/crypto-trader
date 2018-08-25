const MODULE_NAME = "OPPORTUNITY_BOT";

const Pr = require('bluebird');
const CONSTANTS = require('../../constants');
const logger = require('../../modules/logger')(MODULE_NAME);

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
            return $this.opportunity.findMarketOpportunities.call(this.opportunity, true).catch((err) => {
                logger.error(err);
            });
        });
    }

    initialize() {
        const $this = this;

        // 0 - trade creation -> stop finding opportunities
        $this.emitter.on(CONSTANTS.EVENT_TRADE_CREATED, (trade) => {
            logger.info(`event: ${CONSTANTS.EVENT_TRADE_CREATED} received!`);
            logger.info(`stopping... to find opportunities`);
            $this.stop().catch((err) => {
                logger.error(`error stopping the bot`);
                logger.error(err);
            });
        });

        // 1 - in progress trades completed -> start finding opportunities again
        $this.emitter.on(CONSTANTS.EVENT_IN_PROGRESS_TRADES_COMPLETED, () => {
            logger.info(`event: ${CONSTANTS.EVENT_IN_PROGRESS_TRADES_COMPLETED} received!`);
            logger.info(`starting...`);
            $this.start().catch((err) => {
                logger.error(`error starting the bot`);
                logger.error(err);
            });
        });
        return Pr.resolve(true);
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
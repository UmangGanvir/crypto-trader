const Pr = require('bluebird');
const ccxt = require('ccxt');

const CONSTANTS = require('./constants');

const dataStore = require('./data_store');

const OpportunityBot = require('./sub_apps/opportunity/opportunity_bot');
const OpportunityArchiver = require('./sub_apps/opportunity_archiver/opportunity_archiver');
const Trader = require('./sub_apps/trader');

/**
 * @desc
 * 0 - initializes core project dependencies
 * 0 - initializes all the sub apps of the project
 */
exports.initialize = () => {

    return Pr.join(dataStore.initialize(), () => {
        // 0 - opportunity bot
        let opportunityBot = new OpportunityBot(new ccxt.binance(), 20);

        // 1 - opportunity archiver - no instance
        let opportunityArchiver = new OpportunityArchiver(CONSTANTS.OPPORTUNITY_FOUND_EVENT_NAME);

        // 2 - trader
        let trader = new Trader(CONSTANTS.OPPORTUNITY_FOUND_EVENT_NAME);

        return Pr.join(
            opportunityBot.start(),
            opportunityArchiver.initialize(),
            trader.start(),
            (opportunityBotStartTime, opportunityArchiverStartTime, traderStartTime) => {
                console.log("Opportunity Bot - Start Time: ", opportunityBotStartTime);
                console.log("Opportunity Archiver - Start Time: ", opportunityArchiverStartTime);
                console.log("Trader - Start Time: ", traderStartTime);
                console.log();
            });
    });
};
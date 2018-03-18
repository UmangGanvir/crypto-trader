const Pr = require('bluebird');
const ccxt = require('ccxt');
const OpportunityBot = require('./sub_apps/opportunity/opportunity_bot');
const Trader = require('./sub_apps/trader');

/**
 * @desc initializes all the sub apps of the project
 */
exports.initialize = () => {
    // 0 - opportunity bot
    let opportunityBot = new OpportunityBot(new ccxt.binance(), 20);

    // 1 - trader
    let trader = new Trader();

    return Pr.join(opportunityBot.start(), trader.start(), (opportunityBotStartTime, traderStartTime) => {
        console.log("Opportunity Bot - Start Time: ", opportunityBotStartTime);
        console.log("Trader - Start Time: ", traderStartTime);
        console.log();
    });
};
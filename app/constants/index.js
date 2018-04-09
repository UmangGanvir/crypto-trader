const deepFreeze = require('deep-freeze');

const CONSTANTS = {
    // Events
    EVENT_OPPORTUNITY_FOUND: "opportunity_found",
    EVENT_TRADE_CREATED: "trade_created",
    EVENT_TRADE_COMPLETED: "trade_completed"
};

module.exports = deepFreeze(CONSTANTS);
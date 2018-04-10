const deepFreeze = require('deep-freeze');

const CONSTANTS = {
    // Events
    EVENT_OPPORTUNITY_FOUND: "opportunity_found",
    EVENT_TRADE_CREATED: "trade_created",
    EVENT_IN_PROGRESS_TRADES_COMPLETED: "in_progress_trades_completed"
};

module.exports = deepFreeze(CONSTANTS);
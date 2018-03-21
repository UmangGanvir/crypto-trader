const deepFreeze = require('deep-freeze');

const CONSTANTS = {
    OPPORTUNITY_FOUND_EVENT_NAME: "OPPORTUNITY_FOUND"
};

module.exports = deepFreeze(CONSTANTS);
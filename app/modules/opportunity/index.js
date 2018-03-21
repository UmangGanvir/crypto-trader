const OpportunityDataStore = require('../../data_store/mysql/opportunity').getModelClass();

class OpportunityModule {
    constructor() {
    }

    static save(opportunity) {
        return OpportunityDataStore.save({
            symbol: opportunity.symbol,
            price: opportunity.price,
            quoteVolume: opportunity.quoteVolume,
            buySellRatio100: opportunity.buySellRatio.r100,
            buySellRatio50: opportunity.buySellRatio.r50,
            buySellRatio20: opportunity.buySellRatio.r20,
            buySellRatio10: opportunity.buySellRatio.r10,
            buySellRatio5: opportunity.buySellRatio.r5,
        });
    }
}

module.exports = OpportunityModule;
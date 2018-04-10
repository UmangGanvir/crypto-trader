const Sequelize = require('sequelize');

/*
* Trade - MySQL Model
* */

let Trade;

exports.initializeModel = (sequelize) => {
    Trade = sequelize.define('trade', {
        id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
        symbol: {type: Sequelize.STRING, allowNull: false},
        phase: {type: Sequelize.ENUM, values: ['buy', 'sell'], index: true, allowNull: false},
        buyOrderId: {type: Sequelize.STRING, allowNull: false, field: 'buy_order_id' },
        sellOrderId: {type: Sequelize.STRING, field: 'sell_order_id' },
        isComplete: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_complete' },
        // fillPercentage: {type: Sequelize.DECIMAL(8, 5), index: true, allowNull: false, field: 'fill_percentage'},
        createdAt: {type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.NOW, field: 'created_at'},
        updatedAt: {type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.NOW, field: 'updated_at'}
    });

    /*
    * Do NOT use the default `create` method available on the model directly
    * Note: You must place a buy order before creating a new trade
    * */
    Trade.createNew = ({ symbol, buyOrderId }) => {
        return Trade.create({
            symbol: symbol,
            phase: 'buy',
            buyOrderId: buyOrderId,
            isComplete: false
        });
    };

    /*
    * Note: You must place a sell order before moving to the sell phase
    * */
    Trade.moveTradeToSellPhase = ({ tradeId, sellOrderId }) => {
        return Trade.update(
            { phase: 'sell', sellOrderId: sellOrderId },
            { where: { id: tradeId } }
        );
    };

    Trade.complete = ({ tradeId }) => {
        return Trade.update(
            { isComplete: true },
            { where: { id: tradeId } }
        );
    };

    Trade.getInProgressTrades = (phase) => {
        let whereClause = {isComplete: false};
        if (phase && phase.length > 0) {
            whereClause.phase = phase;
        }

        return Trade.findAndCountAll({ where: whereClause });
    };
};

exports.getModelClass = () => {
    return Trade;
};
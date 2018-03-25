const Sequelize = require('sequelize');

/*
* Opportunity - MySQL Model
* */

let Opportunity;

exports.initializeModel = (sequelize) => {
    Opportunity = sequelize.define('opportunity', {
        id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
        symbol: {type: Sequelize.STRING, allowNull: false},
        price: {type: Sequelize.DECIMAL(20, 10), allowNull: false},
        quoteVolume: {type: Sequelize.DECIMAL(20, 10), allowNull: false, field: 'quote_volume'},
        buySellRatio100: {type: Sequelize.DECIMAL(20, 10), allowNull: false},
        buySellRatio50: {type: Sequelize.DECIMAL(20, 10), allowNull: false},
        buySellRatio20: {type: Sequelize.DECIMAL(20, 10), allowNull: false},
        buySellRatio10: {type: Sequelize.DECIMAL(20, 10), allowNull: false},
        buySellRatio5: {type: Sequelize.DECIMAL(20, 10), allowNull: false},
        createdAt: {type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: {type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.NOW }
    });

    Opportunity.save = ({
                            symbol,
                            price,
                            quoteVolume,
                            buySellRatio100,
                            buySellRatio50,
                            buySellRatio20,
                            buySellRatio10,
                            buySellRatio5
                        }) => {
        return Opportunity.create({
            symbol: symbol,
            price: price,
            quoteVolume: quoteVolume,
            buySellRatio100: buySellRatio100,
            buySellRatio50: buySellRatio50,
            buySellRatio20: buySellRatio20,
            buySellRatio10: buySellRatio10,
            buySellRatio5: buySellRatio5,
        });
    };
};

exports.getModelClass = () => {
    return Opportunity;
};
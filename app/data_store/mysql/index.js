const Sequelize = require('sequelize');

const OpportunityModel = require('./opportunity');

const sequelize = new Sequelize('crypto_trader', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',

    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },

    // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
    operatorsAliases: false
});

// initialize models on database connection
OpportunityModel.initializeModel(sequelize);

exports.initialize = () => {
    return sequelize.sync();
};
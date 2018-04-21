const Sequelize = require('sequelize');

const OpportunityModel = require('./opportunity');
const TradeModel = require('./trade');

const sequelize = new Sequelize(
    process.env.RDS_DB_NAME,
    process.env.RDS_USERNAME,
    process.env.RDS_PASSWORD,
    {
        host: process.env.RDS_HOSTNAME,
        port: process.env.RDS_PORT,
        dialect: 'mysql',

        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },

        // logging: console.log,
        logging: false,

        // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
        operatorsAliases: false
    }
);

// initialize models on database connection
OpportunityModel.initializeModel(sequelize);
TradeModel.initializeModel(sequelize);

exports.initialize = () => {
    return sequelize.sync();
};
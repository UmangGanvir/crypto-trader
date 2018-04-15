const Sequelize = require('sequelize');

const OpportunityModel = require('./opportunity');
const TradeyModel = require('./trade');


const sequelize = new Sequelize(
    process.env.DATA_STORE_MYSQL_DB_NAME,
    process.env.DATA_STORE_MYSQL_USERNAME,
    process.env.DATA_STORE_MYSQL_PASSWORD,
    {
        host: process.env.DATA_STORE_MYSQL_HOST,
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
TradeyModel.initializeModel(sequelize);

exports.initialize = () => {
    return sequelize.sync();
};
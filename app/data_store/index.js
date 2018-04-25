const MODULE_NAME = "DATA_STORE";

const Pr = require('bluebird');

const sequelizeMySQLConnection = require('./mysql');
const logger = require('../modules/logger')(MODULE_NAME);

exports.initialize = () => {
    return Pr.join(sequelizeMySQLConnection.initialize(), (sequelizeMySQLConnectionResp) => {
        // logger.info(sequelizeMySQLConnectionResp);
        logger.info(`initialized!`);
    });
};

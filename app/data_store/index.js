const Pr = require('bluebird');

const sequelizeMySQLConnection = require('./mysql');

exports.initialize = () => {
    return Pr.join(sequelizeMySQLConnection.initialize(), (sequelizeMySQLConnectionResp) => {
        // console.log("sequelizeMySQLConnectionResp: ", sequelizeMySQLConnectionResp);
        console.log("Data Store - Initialization Time: ", new Date().toString());
    });
};
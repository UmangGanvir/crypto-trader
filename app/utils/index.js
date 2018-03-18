const Pr = require('bluebird');

exports.delayPromise = (promise, delayInMillis) => {
    return new Pr((resolve) => {
        setTimeout(() => {
            resolve(promise)
        }, delayInMillis);
    });
};
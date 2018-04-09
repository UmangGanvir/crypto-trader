const Pr = require('bluebird');

class Bot {
    constructor(logPrefix, delayInMillis) {
        this.logPrefix = logPrefix;
        this.delayInMillis = delayInMillis;
        this.taskFunction = undefined;
        this.active = true;
    }

    // must call this post constructor
    // reason - child class's instantiation requires super to be called before this
    // so can't pass child instance's method as param to super
    setTaskFunction(taskFunction){
        this.taskFunction = taskFunction;
    }

    start() {
        let $this = this;
        return new Pr((resolve, reject) => {
            if (typeof $this.taskFunction !== 'function') {
                return reject(`${$this.logPrefix} - BOT: invalid taskFunction`)
            }

            if (typeof $this.delayInMillis !== 'number' || $this.delayInMillis === 0) {
                return reject(`${$this.logPrefix} - BOT: invalid delayInMillis`);
            }

            if (!$this.active) {
                console.log(`${$this.logPrefix} - BOT: Stopping...`);
                return resolve(undefined);
            }

            setTimeout(() => {

                $this.taskFunction().then(() => {
                    $this.start();
                }).catch((err) => {
                    return reject(`${$this.logPrefix} - BOT: taskFunction error - ${err}`);
                });
            }, this.delayInMillis);
            return resolve((new Date()).toString());
        });
    }

    stop() {
        this.active = false;
    }
}

module.exports = Bot;
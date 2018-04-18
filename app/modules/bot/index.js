const Pr = require('bluebird');

class Bot {
    constructor(logPrefix, delayInMillis) {
        this.logPrefix = logPrefix;
        this.delayInMillis = delayInMillis;
        this._taskFunction = undefined;
        this._isBotActive = false;
    }

    // must call this post constructor
    // reason - child class's instantiation requires super to be called before this
    // so can't pass child instance's method as param to super
    setTaskFunction(taskFunction) {
        this._taskFunction = taskFunction;
    }

    isBotActive() {
        return this._isBotActive === true;
    }

    activateBot() {
        this._isBotActive = true;
        return this._startRepeatingTask();
    }

    _startRepeatingTask() {
        let $this = this;
        return new Pr((resolve, reject) => {
            try {
                if (typeof $this._taskFunction !== 'function') {
                    return reject(`${$this.logPrefix} - BOT: invalid taskFunction`)
                }

                if (typeof $this.delayInMillis !== 'number' || $this.delayInMillis === 0) {
                    return reject(`${$this.logPrefix} - BOT: invalid delayInMillis`);
                }

                if (!$this._isBotActive) {
                    console.log(`${$this.logPrefix} - BOT: Stopping...`);
                    return resolve(undefined);
                }

                setTimeout(() => {
                    $this._taskFunction().then(() => {
                        $this._startRepeatingTask();
                    }).catch((err) => {
                        return reject(`${$this.logPrefix} - BOT: taskFunction error - ${err}`);
                    });
                }, this.delayInMillis);
                return resolve((new Date()).toString());
            }
            catch (err) {
                reject(err);
            }
        });
    }

    deactivateBot() {
        this._isBotActive = false;
        return Pr.resolve((new Date()).toString());
    }
}

module.exports = Bot;
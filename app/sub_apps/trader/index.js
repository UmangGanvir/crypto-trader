const Pr = require('bluebird');

const tradeInitiator = require('./trade_initiator');

// const TradeWorkFlowBot = require('./trade_workflow_bot');

class Trader {
    // TradeInitiator listens to this event for initiating a trade on opportunity
    constructor(eventName) {
        this.eventName = eventName;
    }

    start() {
        const $this = this;
        return new Pr((resolve, reject) => {
            // 0 - trade initiator - initialize

            // 1 - trade workflow bot - start
            // TODO
            // let tradeWorkFlowBot = new TradeWorkFlowBot();
            let tradeWorkFlowBot = {
                start: () => {
                    return new Pr((resolve, reject) => {
                        resolve(new Date().toString());
                    })
                }
            };

            return Pr.join(tradeInitiator.initialize($this.eventName), tradeWorkFlowBot.start(), (tradeInitiatorStartTime, tradeWorkFlowBotStartTime) => {
                console.log("Trader - Trade Initiator - Start Time: ", tradeInitiatorStartTime);
                console.log("Trader - Trade Workflow Bot - Start Time: ", tradeWorkFlowBotStartTime);
                console.log();
                resolve((new Date()).toString());
            }).catch((err) => {
                reject(err);
            });
        });
    }
}

module.exports = Trader;
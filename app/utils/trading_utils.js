class BuySellRatio {
    constructor(r100, r50, r20, r10, r5){
        this.r100 = r100;
        this.r50 = r50;
        this.r20 = r20;
        this.r10 = r10;
        this.r5 = r5;
    }
}

exports.getBuySellRatio = (price, bids, asks) => {
    // {
    //     bids:
    //         [
    //             [0.02599, 307.69],
    //             [0.025988, 21.93]
    //         ],
    //     asks:
    //         [
    //             [0.026, 0.33],
    //             [0.026073, 4.37]
    //         ]
    // };

    if (bids.length < 100 || asks.length < 100){
        return undefined;
    }

    // for bids and asks, indices represent the following values
    // 0 - price, 1 - volume

    // make bid volumes incremental
    for (let i=1; i<bids.length; i++){
        bids[i][1] = bids[i][1] + bids[i-1][1];
    }

    // make ask volumes incremental
    for (let i=1; i<asks.length; i++){
        asks[i][1] = asks[i][1] + asks[i-1][1];
    }

    return new BuySellRatio(
        (bids[99][1] / (price - bids[99][0])) / (asks[99][1] / (asks[99][0] - price)),
        (bids[49][1] / (price - bids[49][0])) / (asks[49][1] / (asks[49][0] - price)),
        (bids[19][1] / (price - bids[19][0])) / (asks[19][1] / (asks[19][0] - price)),
        (bids[9][1] / (price - bids[9][0])) / (asks[9][1] / (asks[9][0] - price)),
        (bids[4][1] / (price - bids[4][0])) / (asks[4][1] / (asks[4][0] - price))
    );
};
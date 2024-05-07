const judge = new Judge();
const player1 = new HumanPlayer(1, judge);
const player2 = new CpuPlayer(2, judge);
const player3 = new CpuPlayer(3, judge);
const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));// 引数分待つ関数

function init() {
    judge.init();
}

async function onClick(e) {
    // judge.onClick(e);
    if(!player1.canSelect(e)) return;
    player1.action(e);
    await sleep(1000);
    player2.action();
    await sleep(1000);
    player3.action();
    //player1が駒を置けなければもう一度繰り返す
    if(!player1.canAction()) onClick(e);
}

init();

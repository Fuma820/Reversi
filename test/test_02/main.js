const judge = new Judge();
const player1 = new HumanPlayer(1, judge);
const player2 = new CpuPlayer(2, judge);
const player3 = new CpuPlayer(3, judge);


function init() {
    judge.init();
}

function onClick(e) {
    // judge.onClick(e);
    player1.onClick(e);
    // player2.onClick(e);
    // player3.onClick(e);
}

init();
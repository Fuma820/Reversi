const canvas = document.querySelector("canvas");
const gameMaster = new GameMaster(canvas);
const player1 = new HumanPlayer(1, gameMaster);
const player2 = new CpuPlayer(2, gameMaster);
const player3 = new CpuPlayer(3, gameMaster);
var id=1;

gameMaster.register(player1);
gameMaster.register(player2);
gameMaster.register(player3);

function init() {
    gameMaster.init();
}

function onClick(e) {
    var rect = e.target.getBoundingClientRect();
    var resolution = canvas.width / Number(canvas.style.width.replace(/[^0-9]/g, ""));// canvasの解像度
    var x = Math.floor((e.clientX - rect.left) * resolution);
    var y = Math.floor((e.clientY - rect.top) * resolution);

    player1.request(x, y);
}

function gameFinish(){
    player1.displayResult();
}

// db.collection("data").doc("field").onSnapshot(snapshot => {
//     field = JSON.parse(snapshot.data().field);
//     selectedX = snapshot.data().x;
//     selectedY = snapshot.data().y;
//     currentStone = snapshot.data().stone;
//     updateField();
// });

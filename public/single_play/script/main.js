const GAME_READY = 0;
const GAME_PLAYING = 1;
const GAME_FINISHED = 2;

const MAX_PLAYER_NUM = 3;
const DIRECTION_NUM = 6;// 三角形のマスなので6方向を確認

let id = 1;// ゲーム内で使用するID
let canvas = document.querySelector("canvas");
let resolution = canvas.width / document.querySelector("canvas").clientWidth;// canvasの解像度
const uiManager = new UIManager();
const field = new Field(canvas);
const gameMaster = new GameMaster(field, uiManager);

const playerIds = [1, 2, 3];
const stoneColors = {
    1: "赤",
    2: "青",
    3: "白"
};

uiManager.setText("player_color", "赤");
gameMaster.register(new HumanPlayer(1));
gameMaster.register(new CpuPlayer(2));
gameMaster.register(new CpuPlayer(3));
gameMaster.start();

// ウィンドウリサイズ時に実行
window.addEventListener("resize", () => {
    resolution = canvas.width / document.querySelector("canvas").clientWidth;
});

/**
 * フィールドクリック時実行関数．
 * @param {*} e イベント
 */
function onClick(e) {
    if (gameMaster.gameStatus == GAME_READY) return;

    const rect = e.target.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * resolution);
    const y = Math.floor((e.clientY - rect.top) * resolution);

    if (!gameMaster.canSelect(x, y, id)) return;
    gameMaster.action(x, y);
}

/**
 * 試合を終了する関数
 */
function retire() {
    window.location.replace("../../index.html");
}

var id = 1;// ゲーム内で使用するID
var canvas = document.querySelector("canvas");
var resolution = canvas.width / document.querySelector("canvas").clientWidth;// canvasの解像度
const uiManager = new UIManager();
const field = new Field(canvas);
const gameMaster = new GameMaster(field, uiManager);

/**
 * 試合を終了する関数
 */
function retire() {
    window.location.replace("../../index.html");
}

/**
 * フィールドクリック時実行関数
 * @param {*} e 
 * @returns 
 */
function onClick(e) {
    if (gameMaster.getStatus() != 1) return;// ゲームがスタートしていなければリターン
    var rect = e.target.getBoundingClientRect();
    var x = Math.floor((e.clientX - rect.left) * resolution);
    var y = Math.floor((e.clientY - rect.top) * resolution);
    if (!gameMaster.canSelect(x, y, id)) return;
    gameMaster.action(x, y);
}

// ウィンドウリサイズ時に実行
window.addEventListener("resize", () => { resolution = canvas.width / document.querySelector("canvas").clientWidth; });

uiManager.setText("player_color", "赤");
gameMaster.register(new HumanPlayer(1));
gameMaster.register(new CpuPlayer(2));
gameMaster.register(new CpuPlayer(3));
gameMaster.start();

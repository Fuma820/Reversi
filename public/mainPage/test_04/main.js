const firebaseConfig = {
    apiKey: "AIzaSyAdCIMrxlj-C0h1fAC8jZ3dtkpBlIZpTvc",
    authDomain: "test-b1eea.firebaseapp.com",
    databaseURL: "https://test-b1eea-default-rtdb.firebaseio.com",
    projectId: "test-b1eea",
    storageBucket: "test-b1eea.appspot.com",
    messagingSenderId: "32628222705",
    appId: "1:32628222705:web:6784cadb557a1f8d301750",
    measurementId: "G-DFPZ7PDY47"
}
var db = firebase.firestore(firebase.initializeApp(firebaseConfig));
var uid = null;// ユーザーのログイン状態を管理するためのID
var id = null;// ゲーム内で使用するID
var noDBAccPeriod = 0;// サーバーにアクセスしていない期間
var limitTime = 10 * 60 * 1000;// 単位[ms]，タイムアウト時間(10分)
var canvas = document.querySelector("canvas");
var resolution = canvas.width / document.querySelector("canvas").clientWidth;// canvasの解像度
const uiManager = new UIManager();
const dbManager = new DBManager(db);
const field = new Field(canvas);
const gameMaster = new GameMaster(field, dbManager, uiManager);

/**
 * データベースのプレイヤー情報をリセットする関数
 */
async function resetPlayersData() {
    await dbManager.resetUsers();
    await gameMaster.init();
}

/**
 * 盤面の情報を更新する関数
 */
async function fieldUpdate() {
    await dbManager.syncWith(gameMaster);
    if (gameMaster.getStatus() == 2) gameMaster.displayResult(id);// 試合が終了していれば，試合結果を表示
    // UI表示変更
    if (gameMaster.getStatus() == 1) uiManager.setText("ready_btn", "");
    if (gameMaster.getCurrentStone() == 1) uiManager.setText("current_turn", "赤");
    if (gameMaster.getCurrentStone() == 2) uiManager.setText("current_turn", "青");
    if (gameMaster.getCurrentStone() == 3) uiManager.setText("current_turn", "白");
}

/**
 * タイムアウト処理関数
 */
async function timeOutAction() {
    await dbManager.syncWith(gameMaster);
    if (await dbManager.checkTimeOut(limitTime)) await resetPlayersData();
    else if (gameMaster.getStatus() != 0) await dbManager.logout();// 他の人が試合中ならログアウト
}

/**
 * 試合をリタイア(終了)する関数
 */
async function retire() {
    if (await dbManager.getPlayerNum() == 1) {
        // プレイヤーが一人しか参加していないならusersを初期化する
        await resetPlayersData();
    } else {// データベースから自分のuidを削除する
        await dbManager.deleteUser(id);

    }
    await dbManager.logout();
}

/**
 * 準備完了関数
 */
async function ready() {
    await dbManager.checkLogin();
    if (id == 1) await dbManager.update("status1", 1);
    else if (id == 2) await dbManager.update("status2", 1);
    else if (id == 3) await dbManager.update("status3", 1);
    uiManager.disableBtn("ready_btn");
}

/**
 * フィールドクリック時実行関数
 * @param {*} e 
 * @returns 
 */
async function onClick(e) {
    await dbManager.checkLogin();
    if (gameMaster.getStatus() == 0) return false;// ゲームがスタートしていなければリターン
    var rect = e.target.getBoundingClientRect();
    var x = Math.floor((e.clientX - rect.left) * resolution);
    var y = Math.floor((e.clientY - rect.top) * resolution);
    if (!gameMaster.canSelect(x, y, id)) return;
    gameMaster.action(x, y);
}

// ウィンドウリサイズ時に実行
window.addEventListener("resize", () => { resolution = canvas.width / document.querySelector("canvas").clientWidth; });

// ログイン状態変更時実行
firebase.auth().onAuthStateChanged(async user => {
    if (!user) window.location.replace("../index.html");
    uid = user.uid;
    if (!await dbManager.existUserData()) await dbManager.createUserDoc(uid);
    id = await dbManager.createID();
    if (!await dbManager.existPlayer(uid)) await timeOutAction();
    // UIを同期
    if (dbManager.getStatus(id) == 1) uiManager.disableBtn("ready_btn");
    var color = id == 1 ? "赤" : id == 2 ? "青" : id == 3 ? "白" : "";
    await dbManager.update("uid" + id, uid);
    uiManager.setText("player_color", color);
});

// フィールド情報更新時実行
db.collection("data").doc("field").onSnapshot(() => { fieldUpdate(); });

// ユーザー情報更新時実行
db.collection("data").doc("users").onSnapshot(async snapshot => {
    // 名前を取得する
    if (snapshot.data().uid1 != null) uiManager.setText("user_name1", await dbManager.getUserName(snapshot.data().uid1));
    if (snapshot.data().uid2 != null) uiManager.setText("user_name2", await dbManager.getUserName(snapshot.data().uid2));
    if (snapshot.data().uid3 != null) uiManager.setText("user_name3", await dbManager.getUserName(snapshot.data().uid3));
    if (dbManager.getStatus(id) == 1) uiManager.disableBtn("ready_btn");
    uiManager.setText("player_num", await dbManager.getPlayerNum());// 参加人数表示
    uiManager.setText("message", await dbManager.getReadyNum() + "人が準備完了");// 準備完了した人数表示

    if (gameMaster.getPlayerNum() == 0 && await dbManager.getPlayerNum() != 0) {// 準備中またはリロードした場合
        if (await dbManager.getPlayerNum() > await dbManager.getReadyNum()) return;// ステータスが全員が準備中でないならreturn
        // 参加者を登録(人数が足りなければ代わりにCPUを登録する)
        if (snapshot.data().uid1 != null) gameMaster.register(new HumanPlayer(1, gameMaster));
        else gameMaster.register(new CpuPlayer(1, gameMaster));
        if (snapshot.data().uid2 != null) gameMaster.register(new HumanPlayer(2, gameMaster));
        else gameMaster.register(new CpuPlayer(2, gameMaster));
        if (snapshot.data().uid3 != null) gameMaster.register(new HumanPlayer(3, gameMaster));
        else gameMaster.register(new CpuPlayer(3, gameMaster));
        // ゲームスタート判定(リロードの場合実行しない)
        if (await dbManager.getGameStatus() == 0) await gameMaster.start();
    }
    if (gameMaster.getStatus() == 1) {
        // ゲーム中ログアウトしたプレイヤーがいればCPUに切り替える
        if (snapshot.data().uid1 == null && gameMaster.getPlayer(1).getType() == "human") gameMaster.release(1);
        if (snapshot.data().uid2 == null && gameMaster.getPlayer(2).getType() == "human") gameMaster.release(2);
        if (snapshot.data().uid3 == null && gameMaster.getPlayer(3).getType() == "human") gameMaster.release(3);
    }
});

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
const dbManager = new DBManager(db);
const field = new Field(canvas);
const gameMaster = new GameMaster(field, dbManager);

// データベースのプレイヤー情報をリセットする関数
async function resetPlayersData() {
    await dbManager.resetUsers();
    await gameMaster.init();
}

// 盤面の情報を更新する関数
async function fieldUpdate() {
    await dbManager.syncWith(gameMaster);
    if (gameMaster.getStatus() == 2) gameMaster.displayResult(id);// 試合が終了していれば，試合結果を表示
    // UI表示変更
    if (gameMaster.getStatus() == 1) document.getElementById("ready_btn").textContent = "";
    if (gameMaster.getCurrentStone() == 1) document.getElementById("current_turn").textContent = "赤";
    if (gameMaster.getCurrentStone() == 2) document.getElementById("current_turn").textContent = "青";
    if (gameMaster.getCurrentStone() == 3) document.getElementById("current_turn").textContent = "白";
}

// タイムアウト処理関数
async function timeOutAction() {
    await dbManager.syncWith(gameMaster);
    if (await dbManager.checkTimeOut(limitTime)) {
        await resetPlayersData();
    } else if (gameMaster.getStatus() != 0) {// 他の人が試合中ならログアウト
        await dbManager.logout();
    }
}

// 試合をリタイア(終了)する関数
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
    document.getElementById("ready_btn").disabled = true;
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
window.addEventListener("resize", () => {
    resolution = canvas.width / document.querySelector("canvas").clientWidth;
});

// ログイン状態変更時実行
firebase.auth().onAuthStateChanged(async user => {
    if (!user) window.location.replace("../index.html");
    uid = user.uid;
    if (!await dbManager.existUserData()) { await dbManager.createUserDoc(uid); }
    id = await dbManager.createID();
    if (!await dbManager.existPlayer()) {
        await timeOutAction();
    }
    // UIを同期
    if (dbManager.getStatus(id) == 1) { document.getElementById("ready_btn").disabled = true; }
    if (id == 1) {
        await dbManager.update("uid1", uid);
        document.getElementById("player_color").textContent = "赤";
    } else if (id == 2) {
        await dbManager.update("uid2", uid);
        document.getElementById("player_color").textContent = "青";
    } else if (id == 3) {
        await dbManager.update("uid3", uid);
        document.getElementById("player_color").textContent = "白";
    }
});

// フィールド情報更新時実行
db.collection("data").doc("field").onSnapshot(async () => {
    await fieldUpdate();
});

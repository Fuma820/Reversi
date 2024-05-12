//時間経過でログアウト機能追加
//メッセージの表示方法変更
//DBクラス作成
//レスポンシブ対応
//プレイ中にプレイヤー1が参加した場合

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
var uid = null;
var id = null;
const canvas = document.querySelector("canvas");
const gameMaster = new GameMaster(canvas, db);

// 情報を変数に格納
db.collection("data").doc("field").get().then(doc => {
    if (doc.data().gameStatus != 0) logout();
        gameMaster.setData(doc.data().stone, doc.data().x, doc.data().y, doc.data().gameStatus, JSON.parse(doc.data().fieldList));
});

/**
 * ログアウト関数
 */
async function logout() {
    firebase.auth().signOut().then(() => {
        // Sign-out successful.
    }).catch((error) => {
        // An error happened.
        console.error("Error logout: ", error);
    });
}

/**
 * 試合をリタイアする関数
 */
async function retire() {
    await db.collection("data").doc("users").get().then(async (doc) => {
        var playerNum = 0
        if (doc.data().uid1 != null) playerNum++;
        if (doc.data().uid2 != null) playerNum++;
        if (doc.data().uid3 != null) playerNum++;
        if (playerNum == 1) {
            await db.collection("data").doc("users").update({
                uid1: null,
                uid2: null,
                uid3: null,
                status1: 0,
                status2: 0,
                status3: 0
            });
            await gameMaster.init();
        } else {
            if (id == 1) db.collection("data").doc("users").update({ uid1: null });
            if (id == 2) db.collection("data").doc("users").update({ uid2: null });
            if (id == 3) db.collection("data").doc("users").update({ uid3: null });
        }
    });
    await logout();
}

/**
 * ログイン状況からidを生成する関数
 */
function createId() {
    db.collection("data").doc("users").get().then((doc) => {
        // ログイン情報をデータベースに格納
        if (doc.data().uid1 == uid || doc.data().uid1 == null) {
            id = 1;
            db.collection("data").doc("users").update({ uid1: uid, status1: 0 });
        } else if (doc.data().uid2 == uid || doc.data().uid2 == null) {
            id = 2;
            if (gameMaster.getStatus() != 0) logout();
            db.collection("data").doc("users").update({ uid2: uid, status2: 0 });
        }
        else if (doc.data().uid3 == uid || doc.data().uid3 == null) {
            id = 3;
            if (gameMaster.getStatus() != 0) logout();
            db.collection("data").doc("users").update({ uid3: uid, status3: 0 });
        } else { logout(); }// 4人以上ログインしている場合はログインページに戻る
    });
}

/**
 * 準備完了関数
 */
function ready() {
    if (id == 1) db.collection("data").doc("users").update({ status1: 1 });
    if (id == 2) db.collection("data").doc("users").update({ status2: 1 });
    if (id == 3) db.collection("data").doc("users").update({ status3: 1 });
    document.getElementById("ready_btn").disabled = true;
}

/**
 * フィールドクリック時実行関数
 * @param {*} e 
 * @returns 
 */
function onClick(e) {
    if (gameMaster.getStatus() == 0) return false;// ゲームがスタートしていなければリターン
    var rect = e.target.getBoundingClientRect();
    var resolution = canvas.width / Number(canvas.style.width.replace(/[^0-9]/g, ""));// canvasの解像度
    var x = Math.floor((e.clientX - rect.left) * resolution);
    var y = Math.floor((e.clientY - rect.top) * resolution);
    gameMaster.getPlayer(id).request(x, y);
}

/**
 * ログイン状態変更時実行
 */
firebase.auth().onAuthStateChanged((user) => {
    if (!user) window.location.replace("../index.html");
    uid = user.uid;
    createId();
});

/**
 * ユーザー情報更新時実行
 */
db.collection("data").doc("users").onSnapshot(snapshot => {
    var playerNum = 0;// ログインしている人数
    if (snapshot.data().uid1 != null) playerNum++;
    if (snapshot.data().uid2 != null) playerNum++;
    if (snapshot.data().uid3 != null) playerNum++;
    var readyNum = 0;// 準備完了した人数
    if (snapshot.data().status1 == 1) readyNum++;
    if (snapshot.data().status2 == 1) readyNum++;
    if (snapshot.data().status3 == 1) readyNum++;

    if (gameMaster.gameStatus == 0 && playerNum != 0) {// 準備中の場合
        if (playerNum != readyNum) return;// ステータスが全員が準備中でないならreturn
        if (snapshot.data().uid1 != null) {
            gameMaster.register(new HumanPlayer(1, gameMaster));
        } else { gameMaster.register(new CpuPlayer(1, gameMaster)); }
        if (snapshot.data().uid2 != null) {
            gameMaster.register(new HumanPlayer(2, gameMaster));
        } else { gameMaster.register(new CpuPlayer(2, gameMaster)); }
        if (snapshot.data().uid3 != null) {
            gameMaster.register(new HumanPlayer(3, gameMaster));
        } else { gameMaster.register(new CpuPlayer(3, gameMaster)); }
        gameMaster.start();// ゲームスタート
    } else if (gameMaster.gameStatus == 1 && readyNum > 1 && gameMaster.playerList.length != 0) {
        // ゲーム中ログアウトしたプレイヤーがいればCPUに切り替える
        if (snapshot.data().uid1 == null && gameMaster.getPlayer(1).getType() == "human") {
            gameMaster.release(1);
        }
        if (snapshot.data().uid2 == null && gameMaster.getPlayer(2).getType() == "human") {
            gameMaster.release(2);
        }
        if (snapshot.data().uid3 == null && gameMaster.getPlayer(3).getType() == "human") {
            gameMaster.release(3);
        }
    }
});

/**
 * フィールド情報更新時実行
 */
db.collection("data").doc("field").onSnapshot(snapshot => {
    if (snapshot.data().gameStatus == 2) gameMaster.displayResult(id);
    gameMaster.setData(snapshot.data().stone, snapshot.data().x, snapshot.data().y,
        snapshot.data().gameStatus, JSON.parse(snapshot.data().fieldList));
});

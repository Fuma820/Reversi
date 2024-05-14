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
const gameMaster = new GameMaster(canvas, db);

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
 * データベースのユーザーデータをリセットする関数
 */
async function resetUsersData() {
    await db.collection("data").doc("users").update({
        uid1: null,
        uid2: null,
        uid3: null,
        status1: 0,
        status2: 0,
        status3: 0
    });
    await gameMaster.init();
}

/**
 * タイムアウト時の処理関数
 */
function timeOutAction() {
    db.collection("data").doc("field").get().then(doc => {
        // 最後の処理からlimitTime以上経っていれば初期化する
        if (doc.data().createdAt != null) {
            noDBAccPeriod = new Date().getTime() - doc.data().createdAt.toDate().getTime();
        }
        if (noDBAccPeriod > limitTime) {
            resetUsersData();
        } else if (doc.data().gameStatus != 0) {// 他の人が試合中ならログアウト
            logout();
        }
    });
}

/**
 * 試合をリタイア(終了)する関数
 */
async function retire() {
    await db.collection("data").doc("users").get().then(async (doc) => {
        var playerNum = 0// 試合に参加している人数
        if (doc.data().uid1 != null) playerNum++;
        if (doc.data().uid2 != null) playerNum++;
        if (doc.data().uid3 != null) playerNum++;
        if (playerNum == 1) {// プレイヤーが一人しか参加していないならusersを初期化する
            await resetUsersData();
        } else {// データベースから自分のuidを削除する
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
        if (doc.data().uid1 == uid || doc.data().uid1 == null) {// データベースにuidとステータスを0で格納
            id = 1;
            document.getElementById("player_color").textContent = "赤";
            if (doc.data().status1 == 1) {
                document.getElementById("ready_btn").disabled = true;
                return;
            }
            db.collection("data").doc("users").update({ uid1: uid, status1: 0 });
        } else if (doc.data().uid2 == uid || doc.data().uid2 == null) {
            id = 2;
            if (id == 2) document.getElementById("player_color").textContent = "青";
            if (doc.data().status2 == 1) {
                document.getElementById("ready_btn").disabled = true;
                return;
            }
            db.collection("data").doc("users").update({ uid2: uid, status2: 0 });
        }
        else if (doc.data().uid3 == uid || doc.data().uid3 == null) {
            id = 3;
            if (id == 3) document.getElementById("player_color").textContent = "白";
            if (doc.data().status3 == 1) {
                document.getElementById("ready_btn").disabled = true;
                return;
            }
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
    // データベースに登録されていなければログアウト
    db.collection("data").doc("users").get().then((doc) => {
        if (doc.data().uid1 != uid && doc.data().uid2 != uid && doc.data().uid3 != uid) {
            logout();
            return;
        }
    });
    if (gameMaster.getStatus() == 0) return false;// ゲームがスタートしていなければリターン
    var rect = e.target.getBoundingClientRect();
    var x = Math.floor((e.clientX - rect.left) * resolution);
    var y = Math.floor((e.clientY - rect.top) * resolution);
    gameMaster.getPlayer(id).request(x, y);
}

// ウィンドウリサイズ時に実行
window.addEventListener("resize", () => {
    resolution = canvas.width / document.querySelector("canvas").clientWidth;
});

// ログイン状態変更時実行
firebase.auth().onAuthStateChanged((user) => {
    if (!user) window.location.replace("../index.html");
    uid = user.uid;
    createId();
    db.collection("data").doc("users").get().then(doc => {
        if (uid != doc.data().uid1 && uid != doc.data().uid2 && uid != doc.data().uid3) {
            timeOutAction();
        }
    });
});

// ユーザー情報更新時実行
db.collection("data").doc("users").onSnapshot(snapshot => {
    var playerNum = 0;// ログインしている人数
    if (snapshot.data().uid1 != null) playerNum++;
    if (snapshot.data().uid2 != null) playerNum++;
    if (snapshot.data().uid3 != null) playerNum++;
    var readyNum = 0;// 準備完了した人数
    if (snapshot.data().status1 == 1) {
        readyNum++;
        if (id == 1) document.getElementById("ready_btn").disabled = true;
    }
    if (snapshot.data().status2 == 1) {
        readyNum++;
        if (id == 2) document.getElementById("ready_btn").disabled = true;
    }
    if (snapshot.data().status3 == 1) {
        readyNum++;
        if (id == 3) document.getElementById("ready_btn").disabled = true;
    }
    // 参加人数表示
    document.getElementById("player_num").textContent = playerNum;

    if (gameMaster.gameStatus == 0 && playerNum != 0) {// 準備中の場合
        if (playerNum != readyNum) return;// ステータスが全員が準備中でないならreturn
        // 参加者を登録(人数が足りなければ代わりにCPUを登録する)
        if (snapshot.data().uid1 != null) {
            gameMaster.register(new HumanPlayer(1, gameMaster));
        } else { gameMaster.register(new CpuPlayer(1, gameMaster)); }
        if (snapshot.data().uid2 != null) {
            gameMaster.register(new HumanPlayer(2, gameMaster));
        } else { gameMaster.register(new CpuPlayer(2, gameMaster)); }
        if (snapshot.data().uid3 != null) {
            gameMaster.register(new HumanPlayer(3, gameMaster));
        } else { gameMaster.register(new CpuPlayer(3, gameMaster)); }
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
    // ゲームスタート判定
    db.collection("data").doc("field").get().then(doc => {
        if (doc.data().gameStatus == 0 && playerNum != 0) gameMaster.start();
    });
});

// フィールド情報更新時実行
db.collection("data").doc("field").onSnapshot(snapshot => {
    if (snapshot.data().gameStatus == 2) gameMaster.displayResult(id); // 試合が終了していれば，試合結果を表示
    gameMaster.setData(snapshot.data().stone, snapshot.data().x, snapshot.data().y,
        snapshot.data().gameStatus, JSON.parse(snapshot.data().fieldList));
    //現在どの色のターンか表示
    if (snapshot.data().stone == 1) document.getElementById("current_turn").textContent = "赤";
    if (snapshot.data().stone == 2) document.getElementById("current_turn").textContent = "青";
    if (snapshot.data().stone == 3) document.getElementById("current_turn").textContent = "白";
});

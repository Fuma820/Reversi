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
const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));//timeはミリ秒


// 情報を変数に格納
db.collection("data").doc("field").get().then(doc => {
    if (doc.exists) {
        const selectedX = doc.data().x;
        const selectedY = doc.data().y;
        const currentStone = doc.data().stone;
        const gameStatus = doc.data().gameStatus;
        gameMaster.setData(currentStone, selectedX, selectedY, gameStatus, JSON.parse(doc.data().fieldList));
    }
});


function start() {
    if (id == 1) db.collection("data").doc("users").update({ status1: 1 });
    if (id == 2) db.collection("data").doc("users").update({ status2: 1 });
    if (id == 3) db.collection("data").doc("users").update({ status3: 1 });
}

function onClick(e) {
    if (gameMaster.getStatus() == 0) return false;// ゲームがスタートしていなければリターン
    var rect = e.target.getBoundingClientRect();
    var resolution = canvas.width / Number(canvas.style.width.replace(/[^0-9]/g, ""));// canvasの解像度
    var x = Math.floor((e.clientX - rect.left) * resolution);
    var y = Math.floor((e.clientY - rect.top) * resolution);
    gameMaster.getPlayer(id).request(x, y);
}


async function logout() {
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
        } else {
            // gameMaster.release(id);
            if (id == 1) db.collection("data").doc("users").update({ uid1: null });
            if (id == 2) db.collection("data").doc("users").update({ uid2: null });
            if (id == 3) db.collection("data").doc("users").update({ uid3: null });
        }
    });
    firebase.auth().signOut().then(() => {
        // Sign-out successful.
    }).catch((error) => {
        // An error happened.
        console.error("Error logout: ", error);
    });
}

async function setUid(user) {
    // ログインしていない場合はログインページに移動
    uid = user.uid;
}

async function setId() {
    await db.collection("data").doc("users").get().then(doc => {
        // ログイン情報をデータベースに格納
        if (doc.data().uid1 == uid || doc.data().uid1 == null) {
            id = 1;
            gameMaster.init();
            db.collection("data").doc("field").update({ gameStatus: 0 });
            db.collection("data").doc("users").update({
                uid1: uid,
                status1: 0
            });
        } else if (doc.data().uid2 == uid || doc.data().uid2 == null) {
            id = 2;
            if (gameMaster.getStatus() != 0) {
                firebase.auth().signOut().then(() => {
                    // Sign-out successful.
                }).catch((error) => {
                    // An error happened.
                    console.error("Error logout: ", error);
                });
            }
            db.collection("data").doc("users").update({
                uid2: uid,
                status2: 0
            });
        }
        else if (doc.data().uid3 == uid || doc.data().uid3 == null) {
            id = 3;
            if (gameMaster.getStatus() != 0) {
                firebase.auth().signOut().then(() => {
                    // Sign-out successful.
                }).catch((error) => {
                    // An error happened.
                    console.error("Error logout: ", error);
                });
            }
            db.collection("data").doc("users").update({
                uid3: uid,
                status3: 0
            });
        } else {// 4人以上ログインしている場合はログインページに戻る
            firebase.auth().signOut().then(() => {
                // Sign-out successful.
            }).catch((error) => {
                // An error happened.
                console.error("Error logout: ", error);
            });
        }
    });
}

/**
 * ログイン状態変更時実行
 */
firebase.auth().onAuthStateChanged(async function (user) {
    if (!user) window.location.replace("../index.html");
    await setUid(user);
    setId();
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

    if (gameMaster.gameStatus == 0) {// 準備中の場合
        if (playerNum != readyNum) return;// ステータスが全員が準備中でないならreturn
        if (snapshot.data().uid1 != null) {
            gameMaster.register(new HumanPlayer(snapshot.data().uid1, 1, gameMaster));
        } else {
            gameMaster.register(new CpuPlayer(1, gameMaster));
        }
        if (snapshot.data().uid2 != null) {
            gameMaster.register(new HumanPlayer(snapshot.data().uid2, 2, gameMaster));
        } else {
            //1秒まつ?
            gameMaster.register(new CpuPlayer(2, gameMaster));
        }
        if (snapshot.data().uid3 != null) {
            gameMaster.register(new HumanPlayer(snapshot.data().uid3, 3, gameMaster));
        } else {
            //1秒まつ?
            gameMaster.register(new CpuPlayer(3, gameMaster));
        }
        // for (var i = 3; i > playerNum; i--) {// 3人より少なければcpuを生成して登録
        //     gameMaster.register(new CpuPlayer(i, gameMaster));
        // }
        gameMaster.init();// ゲームスタート
    } else if (gameMaster.gameStatus == 1 && readyNum > 1) {// ゲーム中ログアウトしたプレイヤーがいればCPUに切り替える
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
    gameMaster.setData(snapshot.data().stone, snapshot.data().x, snapshot.data().y
        , snapshot.data().gameStatus, JSON.parse(snapshot.data().fieldList));

});

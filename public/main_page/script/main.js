// Firebaseの設定を取得
const firebaseConfig = Config.getFirebaseConfig();

// ゲームの状態を表現する定数
const GAME_READY = 0;
const GAME_PLAYING = 1;
const GAME_FINISHED = 2;

const MAX_PLAYER_NUM = 3;                                                       // 最大プレイヤー数
const DIRECTION_NUM = 6;                                                        // 三角形のマスなので6方向を確認
const LIMIT_TIME = 10 * 60 * 1000;                                              // タイムアウト時間（10分）

let db = firebase.firestore(firebase.initializeApp(firebaseConfig));            // Firestoreのインスタンス初期化
let uid = null;                                                                 // ユーザーのログイン状態を管理するためのID
let id = null;                                                                  // ゲーム内で使用するID
let noDBAccPeriod = 0;                                                          // サーバーにアクセスしていない期間
let canvas = document.querySelector("canvas");
let resolution = canvas.width / document.querySelector("canvas").clientWidth;   // キャンバスの描画解像度と表示サイズの比率

const uiManager = new UIManager();
const dbManager = new DBManager(db);
const gameMaster = new GameMaster(new Field(canvas), dbManager, uiManager);

const playerIds = [1, 2, 3];
const stoneColors = {
    1: "赤",
    2: "青",
    3: "白"
};


// ウィンドウリサイズ時に実行
window.addEventListener("resize", () => {
    resolution = canvas.width / document.querySelector("canvas").clientWidth;
});

// フィールド情報更新時実行
db.collection("data").doc("field").onSnapshot(() => fieldUpdate());

// ユーザー名変更時実行
db.collection("users").onSnapshot(() => updatePlayerNames());

// ログイン状態変更時実行
firebase.auth().onAuthStateChanged(async user => {
    try {
        if (!user) {
            window.location.replace("../index.html");
            return;
        }

        uid = user.uid;
        // ユーザーのログイン状態を確認
        const [userExists, playerExists] = await Promise.all([
            dbManager.existUserData(uid),
            dbManager.existPlayer(uid)
        ]);

        // ユーザーが存在しない場合は新規作成
        if (!userExists) await dbManager.createUserDoc(uid);
        id = await dbManager.createID(uid);

        // タイムアウトしてる場合に処理を実行
        await timeOutAction();
        // ログイン時にタイムスタンプを残す
        await dbManager.saveTimeStamp(uid);

        // 準備完了でない場合は，ready_btnに文字を表示
        const status = await dbManager.getStatus(id);
        if (status !== GAME_READY) uiManager.disableBtn("ready_btn");
        // ユーザの色を取得
        const color = stoneColors[id] || "";
        uiManager.setText("player_color", color);

        // ゲームに参加しているユーザを更新
        await dbManager.update(`uid${id}`, uid);
        // ゲームの状態を取得
        const gameStatus = gameMaster.gameStatus;

        // ゲームの状態に応じてUIを更新
        if (gameStatus !== GAME_READY) uiManager.setText("ready_btn", "");
        if (gameStatus === GAME_FINISHED) gameMaster.displayResult(id);
    } catch (error) {
        console.error("ログイン状態変更時にエラーが発生しました:", error);
    }
});

// ユーザー情報更新時実行
db.collection("data").doc("users").onSnapshot(async snapshot => {
    try {
        // プレイヤーのUIDを取得
        const userIds = [];
        for (let i = 1; i <= MAX_PLAYER_NUM; i++) {
            userIds.push(snapshot.data()[`uid${i}`]);
        }
        await updatePlayerNames();

        const playerNum = await dbManager.getPlayerNum();   // プレイヤー数を取得
        const readyNum = await dbManager.getReadyNum();     // 準備完了数を取得

        // プレイヤー数と準備完了数をUIに表示
        uiManager.setText("player_num", playerNum);
        uiManager.setText("message", `${readyNum}人が準備完了`);

        // 登録されているプレイヤー数が0で，プレイヤー数が0でない場合
        if (gameMaster.getPlayerNum() === 0 && playerNum !== 0) {
            // 全員が準備完了していない場合終了
            if (playerNum > readyNum) return;
            // プレイヤーを登録してゲームを開始
            await registerPlayers(userIds);
            if (await dbManager.getGameStatus() === GAME_READY) {
                await gameMaster.start();
            }
        }

        // すでにゲームが開始されている場合ログアウト
        if (gameMaster.gameStatus === GAME_PLAYING) {
            await replaceLoggedOutPlayers(userIds);
        }
    } catch (error) {
        console.error("ユーザー情報更新時にエラーが発生しました:", error);
    }
});

/**
 * フィールドクリック時実行関数．
 * @param {*} e イベント
 */
async function onClick(e) {
    await dbManager.checkLogin(uid);
    if (gameMaster.gameStatus == GAME_READY) return;

    // クリックされた位置を取得
    const rect = e.target.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * resolution);
    const y = Math.floor((e.clientY - rect.top) * resolution);
    // クリックされたマスを選択可能な場合
    if (gameMaster.canSelect(x, y, id)) {
        gameMaster.action(x, y);
        await dbManager.saveTimeStamp(uid);
    }
}

/**
 * 盤面の情報を更新する関数．
 */
async function fieldUpdate() {
    try {
        // データベースに現在の盤面を同期
        await dbManager.syncWith(gameMaster);
        // フィールドの状態を取得
        const gameStatus = gameMaster.gameStatus;
        const currentStone = gameMaster.currentStone;

        // ゲームが終了した場合，結果を表示
        if (gameStatus === GAME_FINISHED) {
            gameMaster.displayResult(id);
            return;
        }

        // ゲーム中は準備完了ボタンのテキストを空にする
        if (gameStatus === GAME_PLAYING) {
            uiManager.setText("ready_btn", "");
        }
        // 現在のターンの色をUIに表示
        uiManager.setText("current_turn", stoneColors[currentStone] || "");
    } catch (error) {
        console.error("盤面情報の更新中にエラーが発生しました:", error);
    }
}

/**
 * タイムアウト処理関数．
 */
async function timeOutAction() {
    // データベースに現在の盤面を同期
    await dbManager.syncWith(gameMaster);
    // タイムアウトしていれば，データベース情報をリセット
    if (await dbManager.checkTimeOut(LIMIT_TIME)) {
        await resetPlayersData();
    }
    else if (gameMaster.gameStatus !== GAME_READY) {
        await dbManager.logout();
    }
}

/**
 * データベースのプレイヤー情報をリセットする関数．
 */
async function resetPlayersData() {
    await dbManager.resetUsers();
    await gameMaster.init();
}

/**
 * 試合をリタイア(終了)する関数．
 */
async function retire() {
    const playerNum = await dbManager.getPlayerNum();
    if (playerNum == 1) {
        // 最後の1人の場合は，データベースの情報をリセット
        await resetPlayersData();
    } else {
        // それ以外の場合は，データベースの情報を更新
        await dbManager.deleteUser(id);
    }
    await dbManager.logout();
}

/**
 * 準備完了関数．
 */
async function ready() {
    try {
        await dbManager.checkLogin(uid);
        // idが最大プレイヤー数の範囲内であれば，準備完了状態に更新
        if (id >= 1 && id <= MAX_PLAYER_NUM) {
            await dbManager.update(`status${id}`, GAME_PLAYING);
        }
        // 準備完了ボタンを無効化
        uiManager.disableBtn("ready_btn");
    } catch (error) {
        console.error("準備完了処理中にエラーが発生しました:", error);
    }
}

/**
 * プレイヤーのUIDを取得してメニューのUIを更新する関数．
 */
async function updatePlayerNames() {
    try {
        const uids = await Promise.all(playerIds.map(id => dbManager.getUid(id)));

        // 各UIDに対してユーザー名を取得してUIを更新
        await Promise.all(uids.map(async (uid, index) => {
            if (uid != null) {
                const userName = await dbManager.getUserName(uid);
                uiManager.setText(`user_name${playerIds[index]}`, userName);
            }
        }));
    } catch (error) {
        console.error("ユーザー名の更新中にエラーが発生しました:", error);
    }
}

/**
 * プレイヤーの登録処理を行う関数．
 */
async function registerPlayers(userIds) {
    const registerPlayer = (uid, playerId) => {
        if (uid != null) {
            gameMaster.register(new HumanPlayer(playerId, gameMaster));
        } else {
            gameMaster.register(new CpuPlayer(playerId, gameMaster));
        }
    };

    userIds.forEach((uid, index) => registerPlayer(uid, index + 1));
}

/**
 * ログアウトしたプレイヤーをCPUに切り替える関数．
 */
async function replaceLoggedOutPlayers(userIds) {
    const releasePlayerIfLoggedOut = (uid, playerId) => {
        if (uid == null && gameMaster.getPlayer(playerId).type === "human") {
            gameMaster.release(playerId);
        }
    };

    userIds.forEach((uid, index) => releasePlayerIfLoggedOut(uid, index + 1));
}

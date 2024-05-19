// ユーザー情報更新時実行
db.collection("data").doc("users").onSnapshot(snapshot => {
    var playerNum = 0;// ログインしている人数
    // プレイヤー人数を数え，名前を取得する
    if (snapshot.data().uid1 != null) {
        playerNum++;
        db.collection("users").doc(snapshot.data().uid1).get().then(doc => {
            if (doc.exists) document.getElementById("user_name1").textContent = doc.data().name;
        });
    }
    if (snapshot.data().uid2 != null) {
        playerNum++;
        db.collection("users").doc(snapshot.data().uid2).get().then(doc => {
            if (doc.exists) document.getElementById("user_name2").textContent = doc.data().name;
        });
    }
    if (snapshot.data().uid3 != null) {
        playerNum++;
        db.collection("users").doc(snapshot.data().uid3).get().then(doc => {
            if (doc.exists) document.getElementById("user_name3").textContent = doc.data().name;
        });
    }
    var readyNum = 0;// 準備完了した人数
    // ステータスを取得し，数え，自分のステータスが1ならボタンを非活性化
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
    document.getElementById("message").textContent = readyNum + "人が準備完了";

    if (gameMaster.gameStatus == 0 && playerNum != 0) {// 準備中の場合
        if (playerNum > readyNum) return;// ステータスが全員が準備中でないならreturn
        // 参加者を登録(人数が足りなければ代わりにCPUを登録する)
        if (snapshot.data().uid1 != null) {
            gameMaster.register(new HumanPlayer(1, gameMaster));
        } else {
            gameMaster.register(new CpuPlayer(1, gameMaster));
            document.getElementById("user_name1").textContent = "CPU";
        }
        if (snapshot.data().uid2 != null) {
            gameMaster.register(new HumanPlayer(2, gameMaster));
        } else {
            gameMaster.register(new CpuPlayer(2, gameMaster));
            document.getElementById("user_name2").textContent = "CPU";
        }
        if (snapshot.data().uid3 != null) {
            gameMaster.register(new HumanPlayer(3, gameMaster));
        } else {
            gameMaster.register(new CpuPlayer(3, gameMaster));
            document.getElementById("user_name3").textContent = "CPU";
        }
    } else if (gameMaster.gameStatus == 1) {
        // ゲーム中ログアウトしたプレイヤーがいればCPUに切り替える
        if (snapshot.data().uid1 == null && gameMaster.getPlayer(1).getType() == "human") {
            gameMaster.release(1);
            document.getElementById("user_name1").textContent = "CPU";
        }
        if (snapshot.data().uid2 == null && gameMaster.getPlayer(2).getType() == "human") {
            gameMaster.release(2);
            document.getElementById("user_name2").textContent = "CPU";
        }
        if (snapshot.data().uid3 == null && gameMaster.getPlayer(3).getType() == "human") {
            gameMaster.release(3);
            document.getElementById("user_name3").textContent = "CPU";
        }
        document.getElementById("message").textContent = "プレイヤーがログアウトしました";
    }
    // ゲームスタート判定
    db.collection("data").doc("field").get().then(doc => {
        if (doc.data().gameStatus == 0 && playerNum != 0) gameMaster.start();
    });
});

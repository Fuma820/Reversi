// ユーザー情報更新時実行
db.collection("data").doc("users").onSnapshot(async snapshot => {
    // 名前を取得する
    if (snapshot.data().uid1 != null) document.getElementById("user_name1").textContent = await dbManager.getUserName(snapshot.data().uid1);
    if (snapshot.data().uid2 != null) document.getElementById("user_name2").textContent = await dbManager.getUserName(snapshot.data().uid2);
    if (snapshot.data().uid3 != null) document.getElementById("user_name3").textContent = await dbManager.getUserName(snapshot.data().uid3);
    if (dbManager.getStatus(id) == 1) document.getElementById("ready_btn").disabled = true;// ボタンを非活性化
    document.getElementById("player_num").textContent = await dbManager.getPlayerNum();// 参加人数表示
    document.getElementById("message").textContent = await dbManager.getReadyNum() + "人が準備完了";// 準備完了した人数表示

    if (gameMaster.getPlayerNum() == 0 && await dbManager.getPlayerNum() != 0) {// 準備中またはリロードした場合
        if (await dbManager.getPlayerNum() > await dbManager.getReadyNum()) return;// ステータスが全員が準備中でないならreturn
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
        // ゲームスタート判定(リロードの場合実行しない)
        if (await dbManager.getGameStatus() == 0) await gameMaster.start();
    }
    if (gameMaster.getStatus() == 1) {
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
    }
});

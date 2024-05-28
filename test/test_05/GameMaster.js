/**
 * 試合進行を行うクラス
 */
class GameMaster {
    constructor(field, uiManager) {
        this.canvas = canvas;
        this.currentStone = 0;
        this.selectedX = 0;
        this.selectedY = 0;
        this.gameStatus = 0;
        this.skipNum = 0;
        this.playerList = [];
        this.field = field;
        this.uiManager = uiManager;
    }

    /**
     * 引数のIDのプレイヤーを返すメソッド
     * @param {*} id 
     * @returns 
     */
    getPlayer(id) { return this.playerList[id - 1]; }

    // ゲッター
    getStatus() { return this.gameStatus; }
    getCurrentStone() { return this.currentStone; }
    getPlayerNum() { return this.playerList.length; }

    /**
     * 現在のステータスのセッター
     * @param {*} gameStatus 
     */
    setStatus(gameStatus) { this.gameStatus = gameStatus; }

    async progress() {
        if (this.currentStone == 1) uiManager.setText("current_turn", "赤");
        else if (this.currentStone == 2) uiManager.setText("current_turn", "青");
        else if (this.currentStone == 3) uiManager.setText("current_turn", "白");
        if (this.gameStatus != 1) return;
        while (this.field.getNextList().length == 0 && this.skipNum < 3) this.skipTurn();
        if (this.playerList[this.currentStone - 1].getType() == "human" || this.skipNum >= 3) return;
        await new Promise((resolve) => setTimeout(resolve, 1000));// 1秒まつ
        gameMaster.autoPut();
        gameMaster.progress();
    }

    /**
     * プレイヤーの登録を行うメソッド
     * @param {*} player 
     */
    register(player) {
        this.playerList.push(player);
    }

    /**
      * ゲームマスターの行動を表すメソッド
      * @param {*} clientX 
      * @param {*} clientY 
      */
    action(clientX, clientY) {
        if (this.playerList[this.currentStone - 1].getType() == "human") this.putStone(clientX, clientY);
        this.progress();
    }

    /**
     * 結果を表示するメソッド
     * @param {*} id 
     * @returns 
     */
    displayResult(id) {
        var message = "試合終了, ";
        var ranking = 0;
        var point = 0;
        var pointList = this.field.createPointList();
        if (this.playerList.length == 0) return;
        this.playerList[id - 1].setPoint(pointList[id - 1]);
        point = pointList[id - 1];
        pointList.sort(function (a, b) { return b - a });
        for (var i = 0; i < pointList.length; i++) {
            if (pointList[i] == this.playerList[id - 1].getPoint()) {
                this.playerList[id - 1].setRanking(i + 1);
                ranking = i + 1;
                break;
            }
        }
        message += "得点: " + point + ", 順位: " + ranking;
        this.uiManager.setText("logout_btn", "終了");
        this.uiManager.setText("message", message);
    }

    /**
     * ターンを変更するメソッド
     */
    changeTurn() {
        this.currentStone++;
        if (this.currentStone > 3) this.currentStone = 1;
        this.field.draw(this.currentStone, this.selectedX, this.selectedY);
    }

    /**
     * ターンをスキップするメソッド
     */
    skipTurn() {
        this.skipNum++;
        this.changeTurn();
        // 全員スキップならば試合終了
        if (this.skipNum >= 3) {
            this.gameStatus = 2;
            displayResult(1);
        }
    }

    /**
     * 引数のマスを選択できるか判定するか判定するメソッド
     * @param {*} clientX 
     * @param {*} clientY 
     * @param {*} id 
     * @returns 
     */
    canSelect(clientX, clientY, id) {
        if (this.currentStone != id) return false;// 自分の番か判定
        // クリックされたマスの座標を取得
        var triangle = this.field.getPosition(clientX, clientY);
        var x = triangle[0];
        var y = triangle[1];
        if (!this.field.canPut(id, x, y)) return false;
        return true;
    }

    /**
     * 引数のマスに石を置くメソッド
     * @param {*} clientX 
     * @param {*} clientY 
     */
    putStone(clientX, clientY) {
        // クリックされたマスの座標を取得
        var triangle = this.field.getPosition(clientX, clientY);
        this.selectedX = triangle[0];
        this.selectedY = triangle[1];

        this.field.setStone(this.selectedX, this.selectedY, this.currentStone);
        for (var i = 0; i < 6; i++) {
            if (this.field.getReversibleNum(this.currentStone, this.selectedX, this.selectedY, i, 0) > 0) {
                this.field.reverse(this.currentStone, this.selectedX, this.selectedY, i);
            }
        }
        this.skipNum = 0;
        this.changeTurn();
    }

    /**
     * ランダムで石を置くメソッド
     */
    autoPut() {
        var nextList = this.field.getNextList();
        var index = Math.floor(Math.random() * nextList.length);
        this.selectedX = nextList[index][0];
        this.selectedY = nextList[index][1];

        this.field.setStone(this.selectedX, this.selectedY, this.currentStone);
        for (var i = 0; i < 6; i++) {
            if (this.field.getReversibleNum(this.currentStone, this.selectedX, this.selectedY, i, 0) > 0) {
                this.field.reverse(this.currentStone, this.selectedX, this.selectedY, i);
            }
        }
        this.skipNum = 0;
        this.changeTurn();
    }

    /**
     * フィールドを初期化メソッド
     */
    init() {
        this.currentStone = 1;
        this.selectedX = 0;
        this.selectedY = 0;
        this.gameStatus = 0;
        this.skipNum = 0;
        this.field.reset();
    }

    /**
     * スタートメソッド
     */
    start() {
        this.init();
        this.gameStatus = 1;
        this.field.draw(this.currentStone, this.selectedX, this.selectedY);
        this.progress();
    }

}

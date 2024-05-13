/**
 * 試合進行を行うクラス
 */
class GameMaster {
    constructor(canvas, db) {
        this.canvas = canvas;
        this.currentStone = 0;
        this.selectedX = 0;
        this.selectedY = 0;
        this.gameStatus = 0;
        this.skipNum = 0;
        this.field = new Field(this.canvas);
        this.playerList = [];
        this.db = db;
        this.messenger = new Messenger();
    }

    /**
     * 引数のIDのプレイヤーを返すメソッド
     * @param {*} id 
     * @returns 
     */
    getPlayer(id) { return this.playerList[id - 1]; }

    /**
     * 現在のステータスを返すメソッド
     * @returns 
     */
    getStatus() { return this.gameStatus; }

    /**
     * 複数データのセッター
     * @param {*} currentStone 
     * @param {*} selectedX 
     * @param {*} selectedY 
     * @param {*} gameStatus 
     * @param {*} fieldList 
     */
    setData(currentStone, selectedX, selectedY, gameStatus, fieldList) {
        this.currentStone = currentStone;
        this.selectedX = selectedX;
        this.selectedY = selectedY;
        this.gameStatus = gameStatus;
        this.field.set(fieldList);
        this.field.draw(this.currentStone, this.selectedX, this.selectedY);
    }

    /**
     * 現在のステータスのセッター
     * @param {*} gameStatus 
     */
    setStatus(gameStatus) { this.gameStatus = gameStatus; }

    /**
     * プレイヤーの登録を行うメソッド
     * @param {*} player 
     */
    register(player) { this.playerList.push(player); }

    /**
     * プレイヤーの登録解除を行うメソッド
     * @param {*} id 
     */
    release(id) {
        this.playerList[id - 1] = new CpuPlayer(id, gameMaster);
        if (this.currentStone == id) {//リリースされたプレイヤーのターンなら行動する
            while (this.field.getPlaceableNum() == 0 && this.gameStatus == 1) {
                this.skipTurn();
            }
            if (this.field.getPlaceableNum() != 0) {
                setTimeout((gameMaster) => { gameMaster.action(0, 0); }, 1000, this);
            }
        }
    }

    /**
      * ゲームマスターの行動を表すメソッド
      * @param {*} clientX 
      * @param {*} clientY 
      */
    action(clientX, clientY) {
        var type = this.playerList[this.currentStone - 1].getType();
        if (type == "human") {
            this.putStone(clientX, clientY);
        } else if (type == "cpu") { this.autoPut(); }
        while (this.field.getPlaceableNum() == 0 && this.skipNum < 3) {
            this.skipTurn();
        }
        if (this.playerList[this.currentStone - 1].getType() == "cpu" && this.skipNum < 3) {
            setTimeout((gameMaster) => { gameMaster.action(clientX, clientY); }, 1000, this);
        }
    }

    /**
     * 結果を表示するメソッド
     * @param {*} id 
     * @returns 
     */
    displayResult(id) {
        var message = "試合終了\n";
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
        message += "得点: " + point + "\n順位: " + ranking;
        setTimeout((message) => { alert(message); }, 1000, message);
        document.getElementById("logout_btn").textContent = "終了";
    }

    /**
     * ターンを変更するメソッド
     */
    changeTurn() {
        this.currentStone++;
        if (this.currentStone > 3) this.currentStone = 1;
        this.field.draw(this.currentStone, this.selectedX, this.selectedY);
        this.db.collection("data").doc("field").update({
            x: this.selectedX,
            y: this.selectedY,
            stone: this.currentStone,
            gameStatus: this.gameStatus,
            fieldList: JSON.stringify(this.field.getFieldList()), // 配列をJSON形式で保存
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    /**
     * ターンをスキップするメソッド
     */
    skipTurn() {
        this.skipNum++;
        this.changeTurn();
        if (this.skipNum >= 3) {// 全員スキップならば試合終了
            this.db.collection("data").doc("field").update({ gameStatus: 2 });
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
    async init() {
        this.currentStone = 1;
        this.selectedX = 0;
        this.selectedY = 0;
        this.gameStatus = 0;
        this.skipNum = 0;
        this.field.reset();
        this.db.collection("data").doc("field").update({
            x: this.selectedX,
            y: this.selectedY,
            stone: this.currentStone,
            gameStatus: this.gameStatus,
            fieldList: JSON.stringify(this.field.getFieldList()),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    /**
     * スタートメソッド
     */
    start() {
        this.init();
        this.gameStatus = 1;
        this.db.collection("data").doc("field").update({ gameStatus: this.gameStatus });
        if (this.playerList.length != 0 && this.playerList[0].getType() == "cpu") {
            setTimeout((gameMaster) => { gameMaster.action(0, 0); }, 1000, this);
        }
    }

}

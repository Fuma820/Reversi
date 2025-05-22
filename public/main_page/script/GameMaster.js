/**
 * 試合進行を行うクラス．
 */
class GameMaster {
    constructor(field, dbManager, uiManager) {
        this.canvas = canvas;
        this.currentStone = 0;
        this.selectedX = 0;
        this.selectedY = 0;
        this.gameStatus = GAME_READY;
        this.skipNum = 0;
        this.playerList = [];
        this.field = field;
        this.dbManager = dbManager;
        this.uiManager = uiManager;
    }

    /**
     * 引数のIDのプレイヤーを返すメソッド．
     * @param {number} id ゲームで使用するID
     * @returns {Player} 引数のIDを持つプレイヤー
     */
    getPlayer(id) {
        return this.playerList[id - 1];
    }

    /**
     * プレイヤーの人数を返すメソッド．
     * @returns 参加しているプレイヤーの人数．
     */
    getPlayerNum() {
        return this.playerList.length;
    }

    /**
     * 複数データのセッター．
     * @param {number} currentStone 石の色
     * @param {number} selectedX 選択されたx座標
     * @param {number} selectedY 選択されたy座標
     * @param {number} gameStatus ゲームの状態
     * @param {number[][]} fieldList フィールドの情報を保持するリスト
     */
    setData(currentStone, selectedX, selectedY, gameStatus, fieldList) {
        this.currentStone = currentStone;
        this.selectedX = selectedX;
        this.selectedY = selectedY;
        this.gameStatus = gameStatus;
        this.field.fieldList = fieldList;
        this.field.draw(this.currentStone, this.selectedX, this.selectedY);
    }

    /**
     * ゲームの進行メソッド．
     */
    async progress() {
        // ゲーム中でなければ何もしない
        if (this.gameStatus != 1) return;
        // 置けるマスがない場合，スキップ
        while (this.field.nextList.length == 0 && this.skipNum < MAX_PLAYER_NUM) {
            this.skipTurn();
        }
        // プレイヤーの場合，または，全員がスキップした場合は何もしない
        if (this.playerList[this.currentStone - 1].type == "human" || this.skipNum >= MAX_PLAYER_NUM) {
            return;
        }

        // 1秒まつ
        await new Promise((resolve) => setTimeout(resolve, 1000));
        gameMaster.autoPut();
        gameMaster.progress();
    }

    /**
     * プレイヤーの登録を行うメソッド
     * @param {Player} player 登録するプレイヤー
     */
    async register(player) {
        this.playerList.push(player);

        if (player.type == "cpu") {
            this.uiManager.setText("user_name" + player.id, "CPU");
        }

        if (this.gameStatus === GAME_PLAYING && this.playerList.length === MAX_PLAYER_NUM) {
            gameMaster.progress();
        }
    }

    /**
     * プレイヤーの登録解除を行うメソッド．
     * @param {number} id 登録解除するプレイヤーのゲーム内ID
     */
    release(id) {
        this.playerList[id - 1] = new CpuPlayer(id, gameMaster);
        this.uiManager.setText("user_name" + id, "CPU");
        this.uiManager.setText("message", "プレイヤーがログアウトしました");
        this.progress();
    }

    /**
      * ゲームマスターの行動を表すメソッド
      * @param {*} clientX クリックされたx座標
      * @param {*} clientY クリックされたy座標
      */
    action(clientX, clientY) {
        if (this.playerList[this.currentStone - 1].type == "human") {
            this.putStone(clientX, clientY);
        }
        this.progress();
    }

    /**
     * ゲーム結果を表示するメソッド．
     * @param {number} id プレイヤーID
     */
    displayResult(id) {
        let message = "試合終了, ";
        // ポイントを計算
        const pointList = this.field.createPointList();
        // if (this.playerList.length === 0) return;

        //ランキングを計算
        const player = this.playerList[id - 1];
        player.point = pointList[id - 1];
        const ranking = this.calculateRanking(id, pointList);

        // UIの更新
        message += `得点: ${player.point}, 順位: ${ranking}`;
        this.uiManager.setText("logout_btn", "終了");
        this.uiManager.setText("message", message);
    }

    /**
     * プレイヤーの順位を計算するメソッド．
     * @param {number} id プレイヤーID
     * @param {Array} pointList ポイントリスト
     * @returns {number} 順位
     */
    calculateRanking(id, pointList) {
        const playerPoint = pointList[id - 1];
        return pointList.filter(point => point > playerPoint).length + 1;
    }

    /**
     * ターンを変更するメソッド．
     */
    async changeTurn() {
        this.currentStone = this.currentStone % MAX_PLAYER_NUM + 1;
        this.field.draw(this.currentStone, this.selectedX, this.selectedY);
        await this.dbManager.setData(this.selectedX, this.selectedY, this.currentStone, this.gameStatus, this.field);
    }

    /**
     * ターンをスキップするメソッド．
     */
    skipTurn() {
        this.skipNum++;
        this.changeTurn();
        // 全員スキップならば試合終了
        if (this.skipNum >= MAX_PLAYER_NUM) {
            this.dbManager.update("gameStatus", GAME_FINISHED);
        }
    }

    /**
     * 指定されたマスを選択できるか判定するメソッド．
     * @param {number} clientX クリックされた位置のX座標
     * @param {number} clientY クリックされた位置のY座標
     * @param {number} id プレイヤーID
     * @returns {boolean} マスを選択できるかどうか
     */
    canSelect(clientX, clientY, id) {
        // 自分のターンでない場合は選択できない
        if (this.currentStone !== id) return false;
        // クリックされた位置を取得し，その位置に石を置けるか判定
        const [x, y] = this.field.getPosition(clientX, clientY);
        return this.field.canPut(id, x, y);
    }

    /**
    * 指定されたマスに石を置くメソッド．
    * @param {number} clientX クリックされた位置のX座標
    * @param {number} clientY クリックされた位置のY座標
    */
    putStone(clientX, clientY) {
        // クリックされた位置を取得
        const [x, y] = this.field.getPosition(clientX, clientY);
        // フィールド変数に格納
        this.selectedX = x;
        this.selectedY = y;
        // 石を置き，他のプレイヤーの石をひっくり返す
        this.field.setStone(this.selectedX, this.selectedY, this.currentStone);
        this.reverseStonesInAllDirections();
    }

    /**
     * ランダムで石を置くメソッド．
     */
    autoPut() {
        const nextList = this.field.nextList;                               // 置けるマスのリスト
        const randomIndex = Math.floor(Math.random() * nextList.length);    // ランダムなインデックスを生成
        [this.selectedX, this.selectedY] = nextList[randomIndex];           // 次に置くマスの座標
        // 石を置き，他のプレイヤーの石をひっくり返す
        this.field.setStone(this.selectedX, this.selectedY, this.currentStone);
        this.reverseStonesInAllDirections();
    }

    /**
     * 全方向の石をひっくり返すメソッド．
     */
    reverseStonesInAllDirections() {
        for (let i = 0; i < DIRECTION_NUM; i++) {
            // ひっくり返せるか判定し，ひっくり返す
            if (this.field.getReversibleNum(this.currentStone, this.selectedX, this.selectedY, i, 0) > 0) {
                this.field.reverse(this.currentStone, this.selectedX, this.selectedY, i);
            }
        }
        // スキップした回数をリセットする
        this.skipNum = 0;
        // 次のターンに移る
        this.changeTurn();
    }

    /**
     * フィールドを初期化メソッド．
     */
    async init() {
        this.currentStone = 1;
        this.selectedX = 0;
        this.selectedY = 0;
        this.gameStatus = 0;
        this.skipNum = 0;

        this.field.reset();

        await this.dbManager.setData(this.selectedX, this.selectedY, this.currentStone, this.gameStatus, this.field);
    }

    /**
     * スタートメソッド．
     */
    async start() {
        this.init();
        // 状態を変更
        this.gameStatus = GAME_PLAYING;
        await this.dbManager.update("gameStatus", this.gameStatus);
        // ゲーム進行
        await this.progress();
        // UIの更新
        this.uiManager.setText("message", "ゲームスタート");
        this.uiManager.setText("ready_btn", "");
    }

}

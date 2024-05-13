/**
 * 人間のプレイヤークラス
 */
class HumanPlayer extends Player {
    constructor(id, gameMaster) {
        super(id, gameMaster);
        this.type = "human";
        this.id = id;
    }
    //ゲッター
    getType() { return this.type; }

    /**
     * 引数のマスに石を置くリクエストを送るメソッド
     * @param {*} x 
     * @param {*} y 
     * @returns 
     */
    request(x, y) {
        if (!this.gameMaster.canSelect(x, y, this.id)) return;
        this.gameMaster.action(x, y);
    }

}
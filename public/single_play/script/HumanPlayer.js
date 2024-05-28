/**
 * 人間のプレイヤークラス
 */
class HumanPlayer extends Player {
    constructor(id) {
        super(id);
        this.type = "human";
        this.id = id;
    }
    //ゲッター
    getType() { return this.type; }

}

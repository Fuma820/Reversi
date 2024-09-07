/**
 * 人間のプレイヤークラス．
 */
class HumanPlayer extends Player {
    constructor(id, gameMaster) {
        super(id, gameMaster);
        this.type = "human";
        this.id = id;
    }

}

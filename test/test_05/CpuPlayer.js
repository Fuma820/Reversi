/**
 * CPUプレイヤークラス
 */
class CpuPlayer extends Player {
    constructor(id) {
        super(id);
        this.type = "cpu";
    }
    
    // ゲッター
    getType() {return this.type;}
}

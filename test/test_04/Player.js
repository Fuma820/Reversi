/**
 * プレイヤークラス
 */
class Player {
    constructor(id, gameMaster) {
        this.id = id;
        this.gameMaster = gameMaster;
        this.point = 0;
        this.ranking = 0;
    }
    //ゲッター
    getId() { return this.id; }
    getPoint() { return this.point; }
    //セッター
    setPoint(point) { this.point = point; }
    setRanking(ranking) { this.ranking = ranking; }

}

/**
 * 円を描画するクラス．
 */
class CircleDrawer extends Drawer {
    constructor(context) {
        super();
        this.context = context;
    }

    /**
     * 円の描画メソッド．
     * @param {string} color 塗りつぶす色
     * @param {number} x 円の中心のx座標
     * @param {number} y 円の中心のy座標
     * @param {number} r 円の半径
     */
    draw(color, x, y, r) {
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.arc(x, y, r, 0, 2 * Math.PI);
        this.context.closePath();
        this.context.fill();
    }

}

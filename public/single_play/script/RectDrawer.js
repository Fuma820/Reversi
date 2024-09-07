/**
 * 長方形を描画するクラス．
 */
class RectDrawer extends Drawer {
    constructor(context) {
        super();
        this.context = context;
    }

    /**
     * 長方形を描画するメソッド．
     * @param {number} color 塗りつぶす色
     * @param {number} x x座標
     * @param {number} y y座標
     * @param {number} w 横幅
     * @param {number} h 高さ
     */
    draw(color, x, y, w, h) {
        this.context.fillStyle = color;
        this.context.fillRect(x, y, w, h);
    }

}

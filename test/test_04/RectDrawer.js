/**
 * 長方形を描画するクラス
 */
class RectDrawer extends Drawer {
    constructor(context) {
        super();
        this.context = context;
    }

    /**
     * 長方形を描画するメソッド
     * @param {*} color 
     * @param {*} x 
     * @param {*} y 
     * @param {*} w 
     * @param {*} h 
     */
    draw(color, x, y, w, h) {
        this.context.fillStyle = color;
        this.context.fillRect(x, y, w, h);
    }
    
}

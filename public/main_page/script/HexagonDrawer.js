/**
 * 六角形を描画するクラス．
 */
class Hexagonrawer extends Drawer {
    constructor(context, size) {
        super();
        this.context = context;
        this.size = size;
    }

    /**
     * 六角形を描画するメソッド．
     * @param {number} color 塗りつぶす色
     * @param {number} x x座標
     * @param {number} y y座標
     */
    draw(color, x, y) {
        let degree = 0;
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.moveTo(x + size, y);

        for (let i = 1; i < 6; i++) {
            degree += Math.PI / 3;
            this.context.lineTo(x + this.size * Math.cos(degree), y - this.size * Math.sin(degree));
        }

        this.context.closePath();
        this.context.fill();
    }

}

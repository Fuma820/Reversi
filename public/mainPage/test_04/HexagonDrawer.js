/**
 * 六角形を描画するクラス
 */
class Hexagonrawer extends Drawer {
    constructor(context, size) {
        super();
        this.context = context;
        this.size = size;
    }

    /**
     * 六角形を描画するメソッド
     * @param {*} color 
     * @param {*} x 
     * @param {*} y 
     */
    draw(color, x, y) {
        var degree = 0;
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.moveTo(x + size, y);
        for (var i = 1; i < 6; i++) {
            degree += Math.PI / 3;
            this.context.lineTo(x + this.size * Math.cos(degree), y - this.size * Math.sin(degree));
        }
        this.context.closePath();
        this.context.fill();
    }
}

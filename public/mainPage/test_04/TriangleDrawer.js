class TriangleDrawer extends Drawer {
    constructor(context, cellSize) {
        super();
        this.context = context;
        this.cellSize = cellSize
        this.strokeStyle = "black";
    }

    /**
     * 三角形を描画するメソッド
     * @param {*} color 
     * @param {*} x 
     * @param {*} y 
     * @param {*} direction 
     */
    draw(color, x, y, direction) {
        var degree;
        if (direction == 0) {
            degree = Math.PI / 2;
        } else if (direction == 1) {
            degree = -Math.PI / 2;
        }

        this.context.fillStyle = color;
        this.context.lineWidth = this.cellSize / 50;
        this.context.strokeStyle = this.strokeStyle;
        this.context.beginPath();
        this.context.moveTo(x + this.cellSize * Math.cos(degree), y - this.cellSize * Math.sin(degree));
        degree += Math.PI * 2 / 3;
        this.context.lineTo(x + this.cellSize * Math.cos(degree), y - this.cellSize * Math.sin(degree));
        degree += Math.PI * 2 / 3;
        this.context.lineTo(x + this.cellSize * Math.cos(degree), y - this.cellSize * Math.sin(degree));
        this.context.closePath();
        this.context.fill();
        this.context.stroke();
    }
    
}

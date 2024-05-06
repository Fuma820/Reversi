class TriangleDrawer extends Drawer {
    context;
    strokeStyle="black";

    constructor(context) {
        super();
        this.context = context;
    }
    draw(color, x, y, direction) {
        var degree;
        if (direction == 0) {
            degree = Math.PI / 2;
        } else if (direction == 1) {
            degree = -Math.PI / 2;
        }
        context.fillStyle = color;
        context.strokeStyle = this.strokeStyle;
        context.beginPath();
        context.moveTo(x + cellSize * Math.cos(degree), y - cellSize * Math.sin(degree));
        degree += Math.PI * 2 / 3;
        context.lineTo(x + cellSize * Math.cos(degree), y - cellSize * Math.sin(degree));
        degree += Math.PI * 2 / 3;
        context.lineTo(x + cellSize * Math.cos(degree), y - cellSize * Math.sin(degree));
        context.closePath();
        context.fill();
        context.stroke();
    }
}

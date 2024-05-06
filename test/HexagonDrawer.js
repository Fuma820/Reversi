class Hexagonrawer extends Drawer {
    context;
    
    constructor(context) {
        super();
        this.context = context;
    }
    draw(color, x, y) {
        var degree = 0;
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(x + size, y);
        for (var i = 1; i < 6; i++) {
            degree += Math.PI / 3;
            context.lineTo(x + size * Math.cos(degree), y - size * Math.sin(degree));
        }
        context.closePath();
        context.fill();
    }
}

class CircleDrawer extends Drawer {
    context;

    constructor(context) {
        super();
        this.context = context;
    }
    draw(color, x, y, r) {
        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, r, 0, 2 * Math.PI);
        context.closePath();
        context.fill();
    }
}

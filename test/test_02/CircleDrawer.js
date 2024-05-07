class CircleDrawer extends Drawer {
    constructor(context) {
        super();
        this.context = context;
    }
    
    draw(color, x, y, r) {
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.arc(x, y, r, 0, 2 * Math.PI);
        this.context.closePath();
        this.context.fill();
    }
}

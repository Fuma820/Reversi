class RectDrawer extends Drawer {
    constructor(context) {
        super();
        this.context = context;
    }

    draw(color, x, y, w, h) {
        this.context.fillStyle = color;
        this.context.fillRect(x, y, w, h);
    }
}

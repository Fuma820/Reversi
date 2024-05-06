class RectDrawer extends Drawer {
    context;
    constructor(context) {
        super();
        this.context = context;
    }
    draw(color, x, y, w, h) {
        context.fillStyle = color;
        context.fillRect(x, y, w, h);
    }
}

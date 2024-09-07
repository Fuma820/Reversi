/**
 * 三角形を描画するクラス．
 */
class TriangleDrawer extends Drawer {
    constructor(context, cellSize) {
        super();
        this.context = context;
        this.cellSize = cellSize;
        this.strokeStyle = "black";
    }

    /**
     * 三角形を描画するメソッド．
     * @param {string} color 三角形の色
     * @param {number} x 描画するx座標
     * @param {number} y 描画するy座標
     * @param {number} direction 三角形の向き
     */
    draw(color, x, y, direction) {
        const degree = this.getInitialDegree(direction);// 初期角度を取得
        const sides = 3;// 三角形の辺の数
        const rotationStep = (2 * Math.PI) / sides;// 各頂点間の角度差

        this.context.fillStyle = color;
        this.context.lineWidth = this.cellSize / 50;
        this.context.strokeStyle = this.strokeStyle;
        this.context.beginPath();

        // 最初の頂点を計算して移動
        this.context.moveTo(
            x + this.cellSize * Math.cos(degree),
            y - this.cellSize * Math.sin(degree)
        );

        // 残りの頂点を描画
        for (let i = 1; i < sides; i++) {
            const nextDegree = degree + i * rotationStep;
            this.context.lineTo(
                x + this.cellSize * Math.cos(nextDegree),
                y - this.cellSize * Math.sin(nextDegree)
            );
        }

        // パスを閉じて描画
        this.context.closePath();
        this.context.fill();
        this.context.stroke();
    }

    /**
     * 三角形の向きに応じた初期角度を取得するメソッド．
     * @param {number} direction 三角形の向き
     * @returns {number} 初期角度（ラジアン）
     */
    getInitialDegree(direction) {
        const directionMap = {
            0: Math.PI / 2,  // 上向き
            1: -Math.PI / 2, // 下向き
            2: 0,            // 右向き
            3: Math.PI       // 左向き
        };
        return directionMap[direction] || 0;// デフォルトは0
    }

}

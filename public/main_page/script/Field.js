/**
 * 盤面を表すクラス
 */
class Field {
    static ROW = 8;
    static COLUMN = 16;
    static COLORS = { 1: "red", 2: "blue", 3: "white" };
    static BG_COLOR = "rgba(0, 0, 0, 0)";
    static NORMAL_CELL_COLOR = "green";
    static PLACEABLE_CELL_COLOR = "lime";
    static SELECTED_CELL_COLOR = "yellow";
    // 周囲のマスを表す配列(例：dx[0], dy[0]は右上のマスを表す)
    static dx = [1, 2, 1, -1, -2, -1];
    static dy = [-1, 0, 1, 1, 0, -1];

    constructor(canvas, dataBaseManager) {
        this.context = canvas.getContext("2d");
        this.size = canvas.width / 2;// 盤面の大きさ(6角形の1辺の長さ)
        this.triangleSize = this.size / 4;// マスの大きさ(一辺の長さ)
        this.cellSize = this.triangleSize * Math.sin(Math.PI / 3) * (2 / 3);// 各頂点から外心までの距離(正三角形なので外心＝重心)
        this.fieldList = Array.from(new Array(Field.COLUMN), () => new Array(Field.ROW).fill(0));
        this.nextList = Array.from(new Array());
        this.rectDrawer = new RectDrawer(this.context);
        this.circleDrawer = new CircleDrawer(this.context);
        this.triangleDrawer = new TriangleDrawer(this.context, this.cellSize);
        this.dataBaseManager = dataBaseManager;
    }

    /**
     * マスの石の情報を返す
     */
    getStone(x, y) {
        return this.isOnField(x, y) ? this.fieldList[x][y] : -1;
    }

    /**
     * 指定方向にひっくり返せる石の数を取得する
     */
    getReversibleNum(stone, x, y, direction, count = 0) {
        const nextX = x + Field.dx[direction];
        const nextY = y + Field.dy[direction];
        const nextStone = this.getStone(nextX, nextY);
        if (nextStone < 1) return 0;
        if (nextStone === stone) return count;
        return this.getReversibleNum(stone, nextX, nextY, direction, count + 1);
    }

    /**
     * クリックされた座標からマスの位置を取得する
     */
    getPosition(clientX, clientY) {
        const y = Math.floor(clientY / (this.cellSize * 3 / 2));
        const x = Math.floor(clientX / (this.triangleSize / 2));
        return this.adjustPosition(x, y, clientX, clientY);
    }

    /**
     * マスの位置を調整するメソッド．
     * 変数x,yが表す三角形の頂点を原点として，
     * 相対的な座標でクリックしたマスのx座標がxかx＋１か判定する
     * @param {*} x 
     * @param {*} y 
     * @param {*} clientX 
     * @param {*} clientY 
     * @returns 
     */
    adjustPosition(x, y, clientX, clientY) {
        if ((x + y) % 2 === 0) {// 上向き三角形の場合（xが偶数番目のマス）
            const topOfTriangleY = y * this.cellSize * 3 / 2;
            const topOfTriangleX = x * this.triangleSize / 2;
            const relativeY = clientY - topOfTriangleY;
            const relativeX = clientX - topOfTriangleX;
            if (relativeY < 2 * Math.sin(Math.PI / 3) * relativeX) x++;
        } else if ((x + y) % 2 === 1) {// 下向き三角形の場合（xが奇数番目のマス）
            const topOfTriangleY = (y + 1) * this.cellSize * 3 / 2;
            const topOfTriangleX = x * this.triangleSize / 2;
            const relativeY = clientY - topOfTriangleY;
            const relativeX = clientX - topOfTriangleX;
            if (relativeY > - 2 * Math.sin(Math.PI / 3) * relativeX) x++;
        }
        return [x, y];
    }

    /**
     * 引数の石をfieldListに格納するメソッド．
     * 引数で示す座標が盤面の外の場合は格納せず，-1を返す．
     * @param {*} x 
     * @param {*} y 
     * @param {*} stone 
     * @returns 
     */
    setStone(x, y, stone) {
        if (!this.isOnField(x, y)) return -1;
        this.fieldList[x][y] = stone;
    }

    /**
     * 引数のマスが盤面上であるか判定するメソッド
     * @param {*} x 
     * @param {*} y 
     * @returns 
     */
    isOnField(x, y) {
        /*
         * size / triangleSize = 4[マス]
         * よって
         * ・y=-x+4
         * ・y=x-12
         * ・y=x+4
         * ・y=-x+20
         * ・y=0
         * ・y=8
         * 上記の6直線に囲まれた六角形について考える
         */
        const s = this.size / this.triangleSize;

        if (s <= x + y
            && x - y <= s * 3
            && y - x < s
            && x + y < s * 5
            && 0 <= y
            && y < s * 2) {
            return true;
        }
        return false
    }

    /**
     * 引数の内容で石を置けるか判定するメソッド
     * @param {*} stone 
     * @param {*} x 
     * @param {*} y 
     * @returns 
     */
    canPut(stone, x, y) {
        if (!this.isOnField(x, y) || this.getStone(x, y) > 0) {
            return false;
        }
        // 周囲のマスをひっくり返せるか確かめる
        for (var i = 0; i < DIRECTION_NUM; i++) {
            if (this.getReversibleNum(stone, x, y, i, 0) > 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * 石を返すメソッド
     * @param {*} stone 
     * @param {*} x 
     * @param {*} y 
     * @param {*} direction 
     * @returns 
     */
    reverse(stone, x, y, direction) {
        if (this.getStone(x + Field.dx[direction], y + Field.dy[direction]) == stone) return;
        this.setStone(x + Field.dx[direction], y + Field.dy[direction], stone);
        this.reverse(stone, x + Field.dx[direction], y + Field.dy[direction], direction);
    }

    /**
     * 盤面を描画するメソッド
     * @param {*} currentStone 
     * @param {*} selectedX 
     * @param {*} selectedY 
     */
    draw(currentStone, selectedX, selectedY) {
        const UPWARD = 0;
        const DOWNWARD = 1;
        this.rectDrawer.draw(Field.BG_COLOR, 0, 0, this.size * 2, this.size * Math.sin(Math.PI / 3) * 2);
        this.nextList.length = 0;

        for (let i = 0; i < Field.ROW; i++) {
            for (let j = 0; j < Field.COLUMN; j++) {
                const x = j * this.triangleSize / 2;
                let y = i * this.cellSize * 3 / 2 + 1;
                const direction = (i + j) % 2 === 0 ? UPWARD : DOWNWARD;

                if (direction === UPWARD) y += this.cellSize;
                else if (direction === DOWNWARD) y += this.cellSize / 2;

                if (!this.isOnField(j, i)) continue;

                const bgColor = this.getCellColor(currentStone, j, i, selectedX, selectedY);
                this.triangleDrawer.draw(bgColor, x, y, direction);

                const stone = this.getStone(j, i);
                if (stone > 0) {
                    this.circleDrawer.draw(Field.COLORS[stone], x, y, 0.9 * this.cellSize / 2);
                }
            }
        }
    }

    /**
     * マスの色を取得する
     */
    getCellColor(currentStone, x, y, selectedX, selectedY) {
        if (this.canPut(currentStone, x, y)) {
            this.nextList.push([x, y]);
            return Field.PLACEABLE_CELL_COLOR;
        }
        return (x === selectedX && y === selectedY) ? Field.SELECTED_CELL_COLOR : Field.NORMAL_CELL_COLOR;
    }

    /**
     * 盤面の得点リストを作成する
     */
    createPointList() {
        // 各プレイヤーの得点を保持するリスト
        const points = new Array(MAX_PLAYER_NUM).fill(0);

        for (let i = 0; i < Field.ROW; i++) {
            for (let j = 0; j < Field.COLUMN; j++) {
                const stone = this.getStone(j, i);
                if (stone > 0) points[stone - 1]++;
            }
        }

        return points;
    }

    /**
     * フィールドの情報をリセットするメソッド
     */
    reset() {
        this.fieldList = Array.from(new Array(Field.COLUMN), () => new Array(Field.ROW).fill(0));
        this.setStone(8, 2, 1);
        this.setStone(8, 3, 1);
        this.setStone(8, 4, 1);
        this.setStone(8, 5, 1);
        this.setStone(6, 3, 2);
        this.setStone(7, 3, 2);
        this.setStone(9, 4, 2);
        this.setStone(10, 4, 2);
        this.setStone(6, 4, 3);
        this.setStone(7, 4, 3);
        this.setStone(9, 3, 3);
        this.setStone(10, 3, 3);
    }

}

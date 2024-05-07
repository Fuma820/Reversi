class Field {
    constructor(context, size, tSize, cellSize, dx, dy) {
        this.context = context;
        this.size = size;
        this.tSize = tSize;
        this.cellSize = cellSize;
        this.row = 2 * this.size / this.tSize;
        this.column = 4 * this.size / this.tSize + 1;;
        this.fieldList = Array.from(new Array(this.column), () => new Array(this.row).fill(0));
        this.nextList = Array.from(new Array());
        this.numOfCanPut = 0;
        // 周囲のマスを表す配列(例：dx[0], dy[0]は右上のマスを表す)
        this.dx = dx;
        this.dy = dy;
        this.COLOR_1 = "red";
        this.COLOR_2 = "blue";
        this.COLOR_3 = "white";
        this.BG_COLOR = "white";
        //クラスインスタンス生成
        this.rectDrawer = new RectDrawer(this.context);
        this.circleDrawer = new CircleDrawer(this.context);
        this.triangleDrawer = new TriangleDrawer(this.context, this.cellSize);
    }

    checkOnField(x, y) {
        /*
         * size / tSize = 4
         * よって
         * ・y=-x+4
         * ・y=x-12
         * ・y=x+4
         * ・y=-x+20
         * ・y=0
         * ・y=8
         * の6直線に囲まれた六角形について考える
         */
        if (this.size / this.tSize <= x + y
            && x - y <= (this.size / this.tSize) * 3
            && y - x < this.size / this.tSize
            && x + y < (this.size / this.tSize) * 5
            && 0 <= y
            && y < (this.size / this.tSize) * 2) {
            return true;
        }
        return false
    }

    getNumOfCanPut() {
        return this.numOfCanPut;
    }

    getNextList() {
        return this.nextList;
    }

    getStone(x, y) {
        if (!this.checkOnField(x, y)) return -1;
        return this.fieldList[x][y];
    }

    getPointList() {
        var pointOfPlayer1 = 0;
        var pointOfPlayer2 = 0;
        var pointOfPlayer3 = 0;
        for (var i = 0; i < this.row; i++) {
            for (var j = 0; j < this.column; j++) {
                if (this.getStone(j, i) == 1) {
                    pointOfPlayer1++;
                } else if (this.getStone(j, i) == 2) {
                    pointOfPlayer2++;
                } else if (this.getStone(j, i) == 3) {
                    pointOfPlayer3++;
                }
            }
        }
        return [pointOfPlayer1, pointOfPlayer2, pointOfPlayer3];
    }

    getReversibleNum(stone, x, y, dx, dy, n) {
        if (this.getStone(x + dx, y + dy) < 1) return 0;
        if (this.getStone(x + dx, y + dy) == stone) return n;
        return this.getReversibleNum(stone, x + dx, y + dy, dx, dy, n + 1);
    }

    setStone(x, y, stone) {
        if (!this.checkOnField(x, y)) return -1;
        this.fieldList[x][y] = stone;
    }

    canPut(stone, x, y) {
        if (!this.checkOnField(x, y)) return false;
        if (this.getStone(x, y) > 0) return;
        // 周囲のマスをひっくり返せるか確かめる
        for (var i = 0; i < 6; i++) {
            if (this.getReversibleNum(stone, x, y, this.dx[i], this.dy[i], 0) > 0) return true;
        }
        return false;
    }

    reverse(stone, x, y, dx, dy) {
        if (this.getStone(x + dx, y + dy) == stone) return;
        this.setStone(x + dx, y + dy, stone);
        this.reverse(stone, x + dx, y + dy, dx, dy);
    }

    updateField(currentStone, selectedX, selectedY) {
        var direction = 1;
        var x = 0;
        var y = 0;
        this.numOfCanPut = 0;
        // 盤面表示
        this.rectDrawer.draw(this.BG_COLOR, 0, 0, this.size * 2, this.size * Math.sin(Math.PI / 3) * 2);
        this.nextList.length = 0;
        for (var i = 0; i < this.row; i++) {
            for (var j = 0; j < this.column; j++) {
                x = j * this.tSize / 2;
                y = i * this.cellSize * 3 / 2 + 1;
                if ((i + j) % 2 == 0) {// 上向き
                    direction = 0;
                    y += this.cellSize;
                } else { //下向き
                    direction = 1;
                    y += this.cellSize / 2;
                }
                //マスの色
                var bgColor = "green";// 通常マスは緑
                if (this.canPut(currentStone, j, i)) {
                    bgColor = "lime";// 次に置けるマスは薄緑
                    this.nextList.push([j, i]);
                    this.numOfCanPut++;
                }
                if (j == selectedX && i == selectedY) bgColor = "yellow";// 最後に石を置いたマスは黄色

                if (this.checkOnField(j, i)) {
                    this.triangleDrawer.draw(bgColor, x, y, direction);
                    if (this.getStone(j, i) == 1) {
                        this.circleDrawer.draw(this.COLOR_1, x, y, 0.9 * this.cellSize / 2);
                    } else if (this.getStone(j, i) == 2) {
                        this.circleDrawer.draw(this.COLOR_2, x, y, 0.9 * this.cellSize / 2);
                    } else if (this.getStone(j, i) == 3) {
                        this.circleDrawer.draw(this.COLOR_3, x, y, 0.9 * this.cellSize / 2);
                    }
                }
            }
        }
    }

    reset() {
        this.fieldList = Array.from(new Array(this.column), () => new Array(this.row).fill(0));
        this.setStone(8, 2, 1);//
        this.setStone(8, 3, 1);
        this.setStone(8, 4, 1);
        this.setStone(8, 5, 1);////
        this.setStone(6, 3, 2);////
        this.setStone(7, 3, 2);
        this.setStone(9, 4, 2);
        this.setStone(10, 4, 2);//
        this.setStone(6, 4, 3);//
        this.setStone(7, 4, 3);
        this.setStone(9, 3, 3);
        this.setStone(10, 3, 3);////
    }

}

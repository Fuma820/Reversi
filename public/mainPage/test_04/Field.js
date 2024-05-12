class Field {
    constructor(canvas, dataBaseManager) {
        this.context = canvas.getContext("2d");
        this.size = canvas.width / 2;//盤面の大きさ(6角形の1辺の長さ)
        this.tSize = this.size / 4;// マスの大きさ(一辺の長さ)
        this.cellSize = this.tSize * Math.sin(Math.PI / 3) * (2 / 3);//各頂点から外心までの距離(正三角形なので外心＝重心)
        this.row = 8;
        this.column = 16;;
        this.fieldList = Array.from(new Array(this.column), () => new Array(this.row).fill(0));
        this.nextList = Array.from(new Array());
        this.placeableNum = 0;
        // 周囲のマスを表す配列(例：dx[0], dy[0]は右上のマスを表す)
        this.dx = [1, 2, 1, -1, -2, -1];
        this.dy = [-1, 0, 1, 1, 0, -1];
        // 色の設定
        this.COLOR_1 = "red";
        this.COLOR_2 = "blue";
        this.COLOR_3 = "white";
        this.BG_COLOR = "white";
        this.rectDrawer = new RectDrawer(this.context);
        this.circleDrawer = new CircleDrawer(this.context);
        this.triangleDrawer = new TriangleDrawer(this.context, this.cellSize);
        this.dataBaseManager = dataBaseManager;
    }

    // ゲッター
    getFieldList() { return this.fieldList; }
    getPlaceableNum() { return this.placeableNum; }
    getNextList() { return this.nextList; }

    /**
     * 引数のマスの石の情報を返すメソッド
     */
    getStone(x, y) {
        if (!this.checkOnField(x, y)) return -1;
        return this.fieldList[x][y];
    }

    /**
     * 引数の方向にひっくり返せる数を取得するメソッド
     * @param {*} stone 
     * @param {*} x 
     * @param {*} y 
     * @param {*} direction 
     * @param {*} n 
     * @returns 
     */
    getReversibleNum(stone, x, y, direction, n) {
        if (this.getStone(x + this.dx[direction], y + this.dy[direction]) < 1) return 0;
        if (this.getStone(x + this.dx[direction], y + this.dy[direction]) == stone) return n;
        return this.getReversibleNum(stone, x + this.dx[direction], y + this.dy[direction], direction, n + 1);
    }

    /**
     * クリックされたマスの座標を返すメソッド
     * @param {*} clientX 
     * @param {*} clientY 
     * @returns 
     */
    getPosition(clientX, clientY) {
        var y = Math.floor(clientY / (this.cellSize * 3 / 2));//クリックした値より小さい最大のマス
        var x = Math.floor(clientX / (this.tSize / 2));//クリックした値より小さい最大のマス
        if ((x + y) % 2 == 0) {//上向きの場合
            //x,yが表す三角形の(一番上の)頂点を原点として相対的な座標でクリックしたマスのx座標がxかx＋１か判定する
            var topOfTriangleY = y * this.cellSize * 3 / 2;
            var topOfTriangleX = x * this.tSize / 2;
            var relativeY = clientY - topOfTriangleY;
            var relativeX = clientX - topOfTriangleX;

            if (relativeY < 2 * Math.sin(Math.PI / 3) * relativeX) x++;
        } else if ((x + y) % 2 == 1) {//下向きの場合
            //x,yが表す三角形の(一番下の)頂点を原点として相対的な座標でクリックしたマスのx座標がxかx＋１か判定する
            var topOfTriangleY = (y + 1) * this.cellSize * 3 / 2;
            var topOfTriangleX = x * this.tSize / 2;
            var relativeY = clientY - topOfTriangleY;
            var relativeX = clientX - topOfTriangleX;

            if (relativeY > - 2 * Math.sin(Math.PI / 3) * relativeX) x++;
        }
        return [x, y];
    }

    //セッター
    set(fieldList) { this.fieldList = fieldList; }
    setStone(x, y, stone) {
        if (!this.checkOnField(x, y)) return -1;
        this.fieldList[x][y] = stone;
    }

    /**
     * 引数のマスが盤面上であるか判定するメソッド
     * @param {*} x 
     * @param {*} y 
     * @returns 
     */
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

    /**
     * 引数の内容で石を置けるか判定するメソッド
     * @param {*} stone 
     * @param {*} x 
     * @param {*} y 
     * @returns 
     */
    canPut(stone, x, y) {
        if (!this.checkOnField(x, y)) return false;
        if (this.getStone(x, y) > 0) return;
        // 周囲のマスをひっくり返せるか確かめる
        for (var i = 0; i < 6; i++) {
            if (this.getReversibleNum(stone, x, y, i, 0) > 0) return true;
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
        if (this.getStone(x + this.dx[direction], y + this.dy[direction]) == stone) return;
        this.setStone(x + this.dx[direction], y + this.dy[direction], stone);
        this.reverse(stone, x + this.dx[direction], y + this.dy[direction], direction);
    }

    /**
     * 盤面を描画するメソッド
     * @param {*} currentStone 
     * @param {*} selectedX 
     * @param {*} selectedY 
     */
    draw(currentStone, selectedX, selectedY) {
        var direction = 1;
        var x = 0;
        var y = 0;
        this.placeableNum = 0;

        this.rectDrawer.draw(this.BG_COLOR, 0, 0, this.size * 2, this.size * Math.sin(Math.PI / 3) * 2);
        this.nextList.length = 0;
        for (var i = 0; i < this.row; i++) {
            for (var j = 0; j < this.column; j++) {
                x = j * this.tSize / 2;
                y = i * this.cellSize * 3 / 2 + 1;
                if ((i + j) % 2 == 0) {// 上向きの三角形
                    direction = 0;
                    y += this.cellSize;
                } else { //下向きの三角形
                    direction = 1;
                    y += this.cellSize / 2;
                }

                var bgColor = "green";// 通常マスは緑
                if (this.canPut(currentStone, j, i)) {
                    bgColor = "lime";// 次に置けるマスは薄緑
                    this.nextList.push([j, i]);
                    this.placeableNum++;
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

    /**
     * 現在の盤面から各プレイヤーの得点リストを作成するメソッド
     * @returns 
     */
    createPointList() {
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

    /**
     * フィールドの情報をリセットするメソッド
     */
    reset() {
        this.fieldList = Array.from(new Array(this.column), () => new Array(this.row).fill(0));
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

class Field {
    constructor() {
        if (Field.instance) return Field.instance;// シングルトン
        Field.instance = this
        this.player = 1;
        this.canvas = document.querySelector("canvas");
        this.context = this.canvas.getContext("2d");
        this.size = this.canvas.width / 2;//フィールドの大きさ(6角形の1辺の長さ)
        this.tSize = this.size / 4;// マス一辺の長さ
        this.cellSize = this.tSize * Math.sin(Math.PI / 3) * (2 / 3);//各頂点から外心までの距離(正三角形なので外心＝重心)
        this.row = 2 * this.size / this.tSize;
        this.column = 4 * this.size / this.tSize + 1;
        this.fieldList = Array.from(new Array(this.column), () => new Array(this.row).fill(0));
        this.nextList = Array.from(new Array());
        this.currentStone = 1;
        this.selectedX = 0;
        this.selectedY = 0;
        this.gameStatus = 0;
        this.skipNum = 0;
        this.numOfCanPut=0;
        // 周囲のマスを表す配列(例：dx[0], dy[0]は右上のマスを表す)
        this.dx = [1, 2, 1, -1, -2, -1];
        this.dy = [-1, 0, 1, 1, 0, -1];
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

    getNumOfCanPut(){
        return this.numOfCanPut;
    }

    getStone(x, y) {
        if (!this.checkOnField(x, y)) return -1;
        return this.fieldList[x][y];
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

    putStone(x, y, stone) {
        this.setStone(x, y, stone);
        for (var i = 0; i < 6; i++) {
            if (this.getReversibleNum(stone, x, y, this.dx[i], this.dy[i], 0) > 0) this.reverse(stone, x, y, this.dx[i], this.dy[i]);
        }
    }

    autoPut() {
        var index = Math.floor(Math.random() * this.nextList.length);
        this.selectedX = this.nextList[index][0];
        this.selectedY = this.nextList[index][1];
        this.putStone(this.selectedX, this.selectedY, this.currentStone);
        this.currentStone++;
        if (this.currentStone > 3) this.currentStone = 1;
        this.updateField();
    }

    gameFinish() {
        var message = "試合終了\n";
        var point = 0;
        var ranking = 0;
        var pointOfPlayer1 = 0;
        var pointOfPlayer2 = 0;
        var pointOfPlayer3 = 0;
        this.gameStatus = 2;
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
        if (this.player == 1) {
            point = pointOfPlayer1;
        } else if (player == 2) {
            point = pointOfPlayer2;
        } else if (player == 3) {
            point = pointOfPlayer3;
        }
        var pointList = [pointOfPlayer1, pointOfPlayer2, pointOfPlayer3];
        pointList.sort();
        console.log(pointList);
        for (var i = 0; i < pointList.length; i++) {
            if (pointList[i] == point) {
                ranking = 3 - i;
                break;
            }
        }
        message += "得点: " + point + "\n順位: " + ranking;
        console.log(message);
        setTimeout(function () { alert(message) }, 1000);
    }

    updateField() {
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
                if (this.canPut(this.currentStone, j, i)) {
                    bgColor = "lime";// 次に置けるマスは薄緑
                    this.nextList.push([j, i]);
                    this.numOfCanPut++;
                }
                if (j == this.selectedX && i == this.selectedY) bgColor = "yellow";// 最後に石を置いたマスは黄色

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
        if (this.numOfCanPut == 0 && this.gameStatus == 1) {// 置けるマスがなければ番を交代
            this.currentStone++;
            if (this.currentStone > 3) this.currentStone = 1;
            if (this.skipNum < 3) {
                this.skipNum++;
                this.updateField();
            } else {//全員スキップならば試合終了
                this.gameFinish();
            }
        } else {
            this.skipNum = 0;
        }
    }

    onClick(e) {
        // 自分の番か判定
        if (this.currentStone != this.player) return;

        // クリックされたマスの座標を取得
        var rect = e.target.getBoundingClientRect();
        var y = Math.floor((e.clientY - rect.top) / (this.cellSize * 3 / 2));//クリックした値より小さい最大のマス
        var x = Math.floor((e.clientX - rect.left) / (this.tSize / 2));//クリックした値より小さい最大のマス
        if ((x + y) % 2 == 0) {//上向きの場合
            //x,yが表す三角形の(一番上の)頂点を原点として相対的な座標でクリックしたマスのx座標がxかx＋１か判定する
            var topOfTriangleY = y * this.cellSize * 3 / 2;
            var topOfTriangleX = x * this.tSize / 2;
            var relativeY = (e.clientY - rect.top) - topOfTriangleY;
            var relativeX = (e.clientX - rect.left) - topOfTriangleX;
            if (relativeY < 2 * Math.sin(Math.PI / 3) * relativeX) {
                x++;
            }
        } else if ((x + y) % 2 == 1) {//下向きの場合
            //x,yが表す三角形の(一番下の)頂点を原点として相対的な座標でクリックしたマスのx座標がxかx＋１か判定する
            var topOfTriangleY = (y + 1) * this.cellSize * 3 / 2;
            var topOfTriangleX = x * this.tSize / 2;
            var relativeY = (e.clientY - rect.top) - topOfTriangleY;
            var relativeX = (e.clientX - rect.left) - topOfTriangleX;
            if (relativeY > - 2 * Math.sin(Math.PI / 3) * relativeX) {
                x++;
            }
        }

        if (this.checkOnField(x, y)) {
            if (!this.canPut(this.currentStone, x, y)) return;
            this.putStone(x, y, this.currentStone);
            this.selectedX = x;
            this.selectedY = y;
            this.currentStone++;
            if (this.currentStone > 3) this.currentStone = 1;
            this.updateField();
            var timer = null;
            var count = 0;
            var timer = setInterval(function () {
                new Field().autoPut();
                if (timer != null && count > 0 || this.gameStatus == 2) {
                    clearInterval(timer);
                }
                // count++;
            }, 1000);
        }
    }

    init() {
        this.currentStone = 1;
        this.selectedX = 0;
        this.selectedY = 0;
        this.gameStatus = 1;
        this.skipNum = 0;
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
        this.updateField();
    }

}

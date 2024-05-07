class Judge {
    constructor() {
        // シングルトン
        if (Judge.instance) return Judge.instance;
        Judge.instance = this
        this.canvas = document.querySelector("canvas");
        this.context = this.canvas.getContext("2d");
        this.size = this.canvas.width / 2;//フィールドの大きさ(6角形の1辺の長さ)
        this.tSize = this.size / 4;// マス一辺の長さ
        this.cellSize = this.tSize * Math.sin(Math.PI / 3) * (2 / 3);//各頂点から外心までの距離(正三角形なので外心＝重心)
        this.currentStone = 1;
        this.player = 1;
        this.selectedX = 0;
        this.selectedY = 0;
        this.gameStatus = 0;
        this.skipNum = 0;
        this.dx = [1, 2, 1, -1, -2, -1];
        this.dy = [-1, 0, 1, 1, 0, -1];
        this.field = new Field(this.context, this.size, this.tSize, this.cellSize, this.dx, this.dy);
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

        if (this.field.checkOnField(x, y)) {
            if (!this.field.canPut(this.currentStone, x, y)) return;
            this.putStone(x, y, this.currentStone);
            this.selectedX = x;
            this.selectedY = y;
            this.currentStone++;
            if (this.currentStone > 3) this.currentStone = 1;
            this.updateField();
            var timer = null;
            var count = 0;
            var timer = setInterval(function () {
                new Judge().autoPut();
                if (timer != null && count > 0 || this.gameStatus == 2) {
                    clearInterval(timer);
                }
                // count++;
            }, 1000);
        }
    }

    putStone(x, y, stone) {
        this.field.setStone(x, y, stone);
        for (var i = 0; i < 6; i++) {
            if (this.field.getReversibleNum(stone, x, y, this.dx[i], this.dy[i], 0) > 0) this.field.reverse(stone, x, y, this.dx[i], this.dy[i]);
        }
    }

    autoPut() {
        var index = Math.floor(Math.random() * this.field.getNextList().length);
        var nextList = this.field.getNextList()
        this.selectedX = nextList[index][0];
        this.selectedY = nextList[index][1];
        this.putStone(this.selectedX, this.selectedY, this.currentStone);
        this.currentStone++;
        if (this.currentStone > 3) this.currentStone = 1;
        this.updateField();
    }

    updateField() {
        this.field.updateField(this.currentStone, this.selectedX, this.selectedY);
        if (this.field.getNumOfCanPut() == 0 && this.gameStatus == 1) {// 置けるマスがなければ番を交代
            this.currentStone++;
            if (this.currentStone > 3) this.currentStone = 1;
            if (this.skipNum < 3) {
                this.skipNum++;
                this.updateField(this.currentStone, this.selectedX, this.selectedY);
            } else {//全員スキップならば試合終了
                this.gameFinish();
            }
        } else {
            this.skipNum = 0;
        }
    }

    init() {
        this.currentStone = 1;
        this.selectedX = 0;
        this.selectedY = 0;
        this.gameStatus = 1;
        this.skipNum = 0;
        this.field.reset();
        this.updateField()
    }

    gameFinish() {
        this.gameStatus = 2;
        this.field.gameFinish(this.gameStatus);

        var message = "試合終了\n";
        var point = 0;
        var ranking = 0;
        var pointList = this.field.getPointList();
        point = pointList[this.player - 1];
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

}
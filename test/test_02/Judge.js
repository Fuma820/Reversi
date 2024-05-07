class Judge {
    constructor() {
        //シングルトン
        if (Judge.instance) {
            return Judge.instance
        }
        Judge.instance = this;
        this.canvas = document.querySelector("canvas");
        this.currentStone = 1;
        this.selectedX = 0;
        this.selectedY = 0;
        this.gameStatus = 0;
        this.skipNum = 0;
        this.player = 1;
        this.field = new Field(this.canvas);
    }

    getGameStatus() {
        return this.gameStatus;
    }

    gameFinish() {
        this.gameStatus = 2;
        var message = "試合終了\n";
        var point = 0;
        var ranking = 0;
        var pointList = this.field.getPointList();
        point = pointList[this.player - 1];
        pointList.sort(function (a, b) { return b - a });
        console.log(pointList);
        for (var i = 0; i < pointList.length; i++) {
            if (pointList[i] == point) {
                ranking = i + 1;
                break;
            }
        }
        message += "得点: " + point + "\n順位: " + ranking;
        console.log(message);
        setTimeout(function () { alert(message) }, 1000);
    }

    checkCanPut() {
        if (this.field.getNumOfCanPut() == 0) return false;
        return true;
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

    changeTurn() {
        this.currentStone++;
        if (this.currentStone > 3) this.currentStone = 1;
    }

    updateField() {
        this.field.update(this.currentStone, this.selectedX, this.selectedY);
        if (this.skipNum >= 3) {//全員スキップならば試合終了
            this.gameFinish();
            return;
        }
        if (this.field.getNumOfCanPut() == 0 && this.gameStatus == 1) {// 置けるマスがなければ番を交代
            this.skipNum++;
        } else {
            this.skipNum = 0;
        }
    }

    autoPut(id) {
        var nextList = this.field.getNextList();
        var index = Math.floor(Math.random() * nextList.length);
        if (!nextList.length == 0) {
            this.selectedX = nextList[index][0];
            this.selectedY = nextList[index][1];

            this.field.setStone(this.selectedX, this.selectedY, this.currentStone);
            for (var i = 0; i < 6; i++) {
                if (this.field.getReversibleNum(id, this.selectedX, this.selectedY, i, 0) > 0) {
                    this.field.reverse(id, this.selectedX, this.selectedY, i);
                }
            }
        }
        this.changeTurn();
        this.updateField();
    }

    canSelect(e){
        // 自分の番か判定
        if (this.currentStone != this.player) return false;
        // クリックされたマスの座標を取得
        var rect = e.target.getBoundingClientRect();
        var resolution = this.canvas.width / Number(this.canvas.style.width.replace(/[^0-9]/g, ""));// canvasの解像度
        var triangle = this.field.getTriangle(Math.floor((e.clientX - rect.left) * resolution), Math.floor((e.clientY - rect.top) * resolution));
        var x = triangle[0];
        var y = triangle[1];
        if (!this.field.canPut(this.currentStone, x, y)) return false;
        return true;
    }

    putStone(e, stone) {
        // 自分の番か判定
        if (this.currentStone != this.player) return;
        // クリックされたマスの座標を取得
        var rect = e.target.getBoundingClientRect();
        var resolution = this.canvas.width / Number(this.canvas.style.width.replace(/[^0-9]/g, ""));// canvasの解像度
        var triangle = this.field.getTriangle(Math.floor((e.clientX - rect.left) * resolution), Math.floor((e.clientY - rect.top) * resolution));
        var x = triangle[0];
        var y = triangle[1];


        if (!this.field.canPut(this.currentStone, x, y)) return;
        this.field.setStone(x, y, stone);
        for (var i = 0; i < 6; i++) {
            if (this.field.getReversibleNum(stone, x, y, i, 0) > 0) this.field.reverse(stone, x, y, i);
        }

        this.selectedX = x;
        this.selectedY = y;
        this.changeTurn();
        this.updateField();
    }

    // onClick(e, id) {
    //     if (this.field.checkOnField(x, y)) {
    //         if (!this.field.canPut(this.currentStone, x, y)) return;
    //         this.putStone(x, y, this.currentStone);
    //         this.selectedX = x;
    //         this.selectedY = y;
    //         this.currentStone++;
    //         if (this.currentStone > 3) this.currentStone = 1;
    //         this.updateField();
    //         var timer = null;
    //         var count = 0;
    //         var timer = setInterval(function (judge) {
    //             judge.autoPut();
    //             if (timer != null && count > 0 || judge.getGameStatus() == 2) {
    //                 clearInterval(timer);
    //             }
    //             // count++;
    //         }, 1000, this);
    //     }
    // }
}

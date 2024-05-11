class GameMaster {
    constructor(canvas) {
        this.canvas = canvas;
        this.currentStone = 1;
        this.selectedX = 0;
        this.selectedY = 0;
        this.gameStatus = 0;
        this.skipNum = 0;
        this.field = new Field(this.canvas);
        this.playerList = [];
    }

    setData(currentStone, selectedX, selectedY, gameStatus, field) {
        this.currentStone = currentStone;
        this.selectedX = selectedX;
        this.selectedY = selectedY;
        this.gameStatus = gameStatus;
        this.field.set(field);
    }

    register(player) {
        this.playerList.push(player);
    }

    sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));// 引数分待つ関数

    action(clientX, clientY) {
        var type = this.playerList[this.currentStone - 1].getType();
        if (type == "human") {
            this.putStone(clientX, clientY, this.currentStone);
        } else if (type == "cpu") {
            this.autoPut();
        }

        while (this.field.getPlaceableNum() == 0 && this.gameStatus == 1) {
            this.skipTurn();
        }

        if (this.playerList[this.currentStone - 1].getType() == "cpu" && this.gameStatus == 1) {
            setTimeout((gameMaster) => {
                gameMaster.action(clientX, clientY);
            }, 1000, this);
        }
    }

    getGameStatus() {
        return this.gameStatus;
    }

    gameFinish(id) {
        this.gameStatus = 2;
        var message = "試合終了\n";
        var ranking = 0;//
        var point = 0;
        var pointList = this.field.getPointList();
        this.playerList[id - 1].setPoint(pointList[id - 1]);
        point = pointList[id - 1];//
        pointList.sort(function (a, b) { return b - a });
        console.log(pointList);
        for (var i = 0; i < pointList.length; i++) {
            if (pointList[i] == this.playerList[id - 1].getPoint()) {
                this.playerList[id - 1].setRanking(i + 1);
                ranking = i + 1;//
                break;
            }
        }
        message += "得点: " + point + "\n順位: " + ranking;//
        setTimeout((message) => {
            alert(message);//
        }, 1000, message);

    }

    changeTurn() {
        this.currentStone++;
        if (this.currentStone > 3) this.currentStone = 1;
        this.field.draw(this.currentStone, this.selectedX, this.selectedY);
    }

    skipTurn() {
        this.skipNum++;
        this.changeTurn();
        console.log("スキップ" + this.skipNum);
        if (this.skipNum >= 3) {//全員スキップならば試合終了
            console.log("ゲーム終了");
            this.gameFinish(1);
        }
    }

    canSelect(clientX, clientY, id) {
        // 自分の番か判定
        if (this.currentStone != id) return false;
        // クリックされたマスの座標を取得
        var triangle = this.field.getTriangle(clientX, clientY);
        var x = triangle[0];
        var y = triangle[1];
        if (!this.field.canPut(this.currentStone, x, y)) return false;
        return true;
    }

    putStone(clientX, clientY, stone) {
        // クリックされたマスの座標を取得
        var triangle = this.field.getTriangle(clientX, clientY);
        var x = triangle[0];
        var y = triangle[1];

        this.field.setStone(x, y, stone);
        for (var i = 0; i < 6; i++) {
            if (this.field.getReversibleNum(stone, x, y, i, 0) > 0) this.field.reverse(stone, x, y, i);
        }

        this.skipNum = 0;
        this.selectedX = x;
        this.selectedY = y;
        this.changeTurn();
    }

    autoPut() {
        var nextList = this.field.getNextList();
        var index = Math.floor(Math.random() * nextList.length);
        this.selectedX = nextList[index][0];
        this.selectedY = nextList[index][1];

        this.field.setStone(this.selectedX, this.selectedY, this.currentStone);
        for (var i = 0; i < 6; i++) {
            if (this.field.getReversibleNum(this.currentStone, this.selectedX, this.selectedY, i, 0) > 0) {
                this.field.reverse(this.currentStone, this.selectedX, this.selectedY, i);
            }
        }
        this.skipNum = 0;
        this.changeTurn();
    }

    init() {
        this.currentStone = 1;
        this.selectedX = 0;
        this.selectedY = 0;
        this.gameStatus = 1;
        this.skipNum = 0;
        this.field.reset();
        this.field.draw(this.currentStone, this.selectedX, this.selectedY);
    }
}

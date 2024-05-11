class Player {
    constructor(id, gameMaster) {
        this.id = id;
        this.gameMaster = gameMaster;
        this.point = 0;
        this.ranking=0;
        this.type = "null";
    }

    getID() {
        return this.id;
    }

    getPoint() {
        return this.point;
    }

    setPoint(point) {
        this.point = point;
    }

    setRanking(ranking) {
        this.ranking = ranking;
    }
    
}
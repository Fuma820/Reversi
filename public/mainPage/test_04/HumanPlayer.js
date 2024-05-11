class HumanPlayer extends Player {
    constructor(uid, id, gameMaster) {
        super(id, gameMaster);
        this.type = "human";
        this.id = id;
    }

    getType() {
        return this.type;
    }

    request(x, y) {
        if (!this.gameMaster.canSelect(x, y, this.id)) return;
        this.gameMaster.action(x, y);
    }
    
}
class HumanPlayer extends Player {
    constructor(id, gameMaster) {
        super(id, gameMaster);
        this.type = "human";
    }

    getType() {
        return this.type;
    }

    register() { }

    request(x, y) {
        if (!this.gameMaster.canSelect(x, y, this.id)) return;
        this.gameMaster.action(x, y);
    }

    displayResult() {

    }
    
}
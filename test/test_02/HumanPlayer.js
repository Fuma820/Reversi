class HumanPlayer extends Player {
    constructor(id, judge) {
        super(id, judge);
    }

    getID() {
        return this.id;
    }

    onClick(e){
        this.judge.onClick(e, this.id);
    }
}
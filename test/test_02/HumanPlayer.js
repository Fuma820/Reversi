class HumanPlayer extends Player {
    constructor(id, judge) {
        super(id, judge);
    }

    getID() {
        return this.id;
    }

    action(e){
        this.judge.putStone(e, this.id);
    }

    canSelect(e){
        return this.judge.canSelect(e);
    }

    canAction(){
        this.judge.checkCanPut();
    }

}
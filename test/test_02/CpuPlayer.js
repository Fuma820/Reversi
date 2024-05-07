class CpuPlayer extends Player {
    constructor(id, judge) {
        super(id, judge);
    }

    getID() {
        return this.id;
    }

    action(){
        this.judge.autoPut(this.id);
    }
    
    canAction(){
        this.judge.checkCanPut();
    }
}
class CpuPlayer extends Player {
    constructor(id, gameMaster) {
        super(id, gameMaster);
        this.type = "cpu";
    }

    getType() {
        return this.type;
    }
}
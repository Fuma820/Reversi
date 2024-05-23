class DBManager {
    constructor(db) {
        this.db = db;
    }

    async logout() {
        firebase.auth().signOut().then(() => {
            // Sign-out successful.
        }).catch((error) => {
            // An error happened.
            console.error("Error logout: ", error);
        });
    }

    async checkLogin() {
        await this.db.collection("data").doc("users").get().then(doc => {
            if (doc.data().uid1 != uid && doc.data().uid2 != uid && doc.data().uid3 != uid) {
                this.logout();
            }
        });
    }

    async resetUsers() {
        await this.db.collection("data").doc("users").update({
            uid1: null,
            uid2: null,
            uid3: null,
            status1: 0,
            status2: 0,
            status3: 0
        });
    }

    async syncWith(gameMaster) {
        await this.db.collection("data").doc("field").get().then(doc => {
            gameMaster.setData(doc.data().stone, doc.data().x, doc.data().y,
                doc.data().gameStatus, JSON.parse(doc.data().fieldList));
        });
    }

    async setData(selectedX, selectedY, currentStone, gameStatus, field) {
        await this.db.collection("data").doc("field").update({
            x: selectedX,
            y: selectedY,
            stone: currentStone,
            gameStatus: gameStatus,
            fieldList: JSON.stringify(field.getFieldList()),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    async checkTimeOut(limitTime) {
        var result = false;
        await db.collection("data").doc("field").get().then(doc => {
            // 最後の処理からlimitTime以上経っていれば初期化する
            if (doc.data().createdAt != null) {
                noDBAccPeriod = new Date().getTime() - doc.data().createdAt.toDate().getTime();
            }
            if (noDBAccPeriod > limitTime) result = true;
        });
        return result;
    }

    async getUserName(uid) {
        var result = "未設定";
        await db.collection("users").doc(uid).get().then(doc => {
            if (doc.exists) result = doc.data().name;
        });
        return result;
    }

    async getPlayerNum() {
        var result = 0// 試合に参加している人数
        await db.collection("data").doc("users").get().then(doc => {
            if (doc.data().uid1 != null) result++;
            if (doc.data().uid2 != null) result++;
            if (doc.data().uid3 != null) result++;
        });
        return result;
    }

    async getReadyNum() {
        var result = 0// 試合に参加している人数
        await db.collection("data").doc("users").get().then(doc => {
            if (doc.data().status1 == 1) result++;
            if (doc.data().status2 == 1) result++;
            if (doc.data().status3 == 1) result++;
        });
        return result;
    }

    async update(property, value) {
        if (property == "uid1") await db.collection("data").doc("users").update({ uid1: value });
        else if (property == "uid2") await db.collection("data").doc("users").update({ uid2: value });
        else if (property == "uid3") await db.collection("data").doc("users").update({ uid3: value });
        else if (property == "status1") await db.collection("data").doc("users").update({ status1: value });
        else if (property == "status2") await db.collection("data").doc("users").update({ status2: value });
        else if (property == "status3") await db.collection("data").doc("users").update({ status3: value });
        else if (property == "gameStatus") await db.collection("data").doc("field").update({ gameStatus: value });
    }

    async deleteUser(id) {
        if (id == 1) await db.collection("data").doc("users").update({ uid1: null, status1: 0 });
        else if (id == 2) await db.collection("data").doc("users").update({ uid2: null, status2: 0 });
        else if (id == 3) await db.collection("data").doc("users").update({ uid3: null, status3: 0 });
    }

    async getGameStatus() {
        var result;
        await db.collection("data").doc("field").get().then(doc => {
            result = doc.data().gameStatus;
        });
        return result;
    }

    async getStatus(id) {
        var result;
        await db.collection("data").doc("users").get().then(doc => {
            if (id == 1) { result = doc.data().status1 }
            else if (id == 2) { result = doc.data().status2 }
            else if (id == 3) { result = doc.data().status3 }
        })
        return result;
    }

    async createID() {
        var result = 0;
        await db.collection("data").doc("users").get().then(doc => {
            if (doc.data().uid1 == uid) result = 1;
            else if (doc.data().uid2 == uid) result = 2;
            else if (doc.data().uid3 == uid) result = 3;
            else if (doc.data().uid1 == null) result = 1;
            else if (doc.data().uid2 == null) result = 2;
            else if (doc.data().uid3 == null) result = 3;
        });
        return result;
    }

    async existUserData() {
        var result = false;
        await db.collection("users").doc(uid).get().then(doc => {
            if (doc.exists) result = true;
        });
        return result;
    }

    async existPlayer() {
        var result = true;
        await db.collection("data").doc("users").get().then(doc => {
            if (uid != doc.data().uid1 && uid != doc.data().uid2 && uid != doc.data().uid3) {
                result = false;
            }
        });
        return result;
    }

    async createUserDoc(uid) {
        await db.collection("users").doc(uid).set({
            uid: uid,
            name: "未設定"
        });
    }

}

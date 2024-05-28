/**
 * データベースの更新，値の取得などを行うクラス
 */
class DBManager {
    constructor(db) {
        this.db = db;
    }

    async getUid(id) {
        var result;
        await db.collection("data").doc("users").get().then(async doc => {
            if (id == 1) result = doc.data().uid1;
            if (id == 2) result = doc.data().uid2;
            if (id == 3) result = doc.data().uid3;
        });
        return result;
    }

    /**
     * 引数のuidのユーザーidを取得するメソッド
     * @param {*} uid 
     * @returns 
     */
    async getUserName(uid) {
        var result = "未設定";
        await db.collection("users").doc(uid).get().then(doc => {
            if (doc.exists) result = doc.data().name;
        });
        return result;
    }

    /**
     * ゲームの状態を取得するメソッド
     * @returns 
     */
    async getGameStatus() {
        var result;
        await db.collection("data").doc("field").get().then(doc => {
            result = doc.data().gameStatus;
        });
        return result;
    }

    /**
     * 引数のidの準備状況を取得するメソッド
     * @param {*} id 
     * @returns 
     */
    async getStatus(id) {
        var result;
        await db.collection("data").doc("users").get().then(doc => {
            if (id == 1) { result = doc.data().status1 }
            else if (id == 2) { result = doc.data().status2 }
            else if (id == 3) { result = doc.data().status3 }
        });
        return result;
    }

    /**
     * 参加プレイヤーの数を取得するメソッド
     * @returns 
     */
    async getPlayerNum() {
        var result = 0// 試合に参加している人数
        await db.collection("data").doc("users").get().then(doc => {
            if (doc.data().uid1 != null) result++;
            if (doc.data().uid2 != null) result++;
            if (doc.data().uid3 != null) result++;
        });
        return result;
    }

    /**
     * 準備完了したプレイヤーの数を取得するメソッド
     * @returns 
     */
    async getReadyNum() {
        var result = 0// 試合に参加している人数
        await db.collection("data").doc("users").get().then(doc => {
            if (doc.data().status1 == 1) result++;
            if (doc.data().status2 == 1) result++;
            if (doc.data().status3 == 1) result++;
        });
        return result;
    }

    /**
     * ゲームの参加ユーザー情報を初期化するメソッド
     */
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

    /**
     * データベースの盤面のデータを更新するメソッド
     * @param {*} selectedX 
     * @param {*} selectedY 
     * @param {*} currentStone 
     * @param {*} gameStatus 
     * @param {*} field 
     */
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

    /**
     * 引数に与えられたデータベースの情報を更新するメソッド
     * @param {*} property 
     * @param {*} value 
     */
    async update(property, value) {
        if (property == "uid1") await db.collection("data").doc("users").update({ uid1: value });
        else if (property == "uid2") await db.collection("data").doc("users").update({ uid2: value });
        else if (property == "uid3") await db.collection("data").doc("users").update({ uid3: value });
        else if (property == "status1") await db.collection("data").doc("users").update({ status1: value });
        else if (property == "status2") await db.collection("data").doc("users").update({ status2: value });
        else if (property == "status3") await db.collection("data").doc("users").update({ status3: value });
        else if (property == "gameStatus") await db.collection("data").doc("field").update({ gameStatus: value });
    }

    /**
     * ローカルの情報(gameMaster)をデータベースと同期させるメソッド
     * @param {*} gameMaster 
     */
    async syncWith(gameMaster) {
        await this.db.collection("data").doc("field").get().then(doc => {
            gameMaster.setData(doc.data().stone, doc.data().x, doc.data().y,
                doc.data().gameStatus, JSON.parse(doc.data().fieldList));
        });
    }

    /**
     * ログアウトメソッド
     */
    async logout() {
        firebase.auth().signOut().then(() => {
            // Sign-out successful.
        }).catch((error) => {
            // An error happened.
            console.error("Error logout: ", error);
        });
    }

    /**
     * ログインしているか確認するメソッド
     */
    async checkLogin() {
        await this.db.collection("data").doc("users").get().then(doc => {
            if (doc.data().uid1 != uid && doc.data().uid2 != uid && doc.data().uid3 != uid) {
                this.logout();
            }
        });
    }

    /**
     * タイムアウトしているか確認するメソッド
     * @param {*} limitTime 
     * @returns 
     */
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

    /**
     * ゲームで使用するidを生成するメソッド
     * @returns 
     */
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

    /**
     * 個別情報を保持するドキュメントを作成するメソッド
     * @param {*} uid 
     */
    async createUserDoc(uid) {
        await db.collection("users").doc(uid).set({ uid: uid, name: "未設定" });
    }

    /**
     * 個別情報を保持するドキュメントが存在するか確認するメソッド
     * @returns 
     */
    async existUserData(uid) {
        var result = false;
        await db.collection("users").doc(uid).get().then(doc => {
            if (doc.exists) result = true;
        });
        return result;
    }

    /**
     * 引数のuidがゲームに参加しているか確認するメソッド
     * @param {*} uid 
     * @returns 
     */
    async existPlayer(uid) {
        var result = true;
        await db.collection("data").doc("users").get().then(doc => {
            if (uid != doc.data().uid1 && uid != doc.data().uid2 && uid != doc.data().uid3) {
                result = false;
            }
        });
        return result;
    }

    /**
     * 参加プレイヤーの情報から引数のプレイヤーuidを削除する
     * @param {*} id 
     */
    async deleteUser(id) {
        if (id == 1) await db.collection("data").doc("users").update({ uid1: null, status1: 0 });
        else if (id == 2) await db.collection("data").doc("users").update({ uid2: null, status2: 0 });
        else if (id == 3) await db.collection("data").doc("users").update({ uid3: null, status3: 0 });
    }

}

/**
 * データベースの更新や値の取得を行うクラス．
 */
class DBManager {
    constructor(db) {
        this.db = db;
    }

    /**
     * 指定したIDに基づきユーザーのUIDを取得する
     * @param {number} id ユーザーのID (1, 2, 3)
     * @returns {Promise<string | undefined>}
     */
    async getUid(id) {
        try {
            const doc = await this.db.collection("data").doc("users").get();
            return doc.data()[`uid${id}`];
        } catch (error) {
            console.error("Error getting UID:", error);
        }
    }

    /**
     * UIDに基づきユーザー名を取得するメソッド．
     * @param {string} uid ユーザーのUID
     * @returns {Promise<string>}
     */
    async getUserName(uid) {
        try {
            const doc = await this.db.collection("users").doc(uid).get();
            return doc.exists ? doc.data().name : "未設定";
        } catch (error) {
            console.error("Error getting username:", error);
            return "未設定";
        }
    }

    /**
     * ゲームの状態を取得するメソッド．
     * @returns {Promise<any>}
     */
    async getGameStatus() {
        try {
            const doc = await this.db.collection("data").doc("field").get();
            return doc.data().gameStatus;
        } catch (error) {
            console.error("Error getting game status:", error);
        }
    }

    /**
     * 指定したIDに基づき準備状況を取得するメソッド．
     * @param {number} id ユーザーのID
     * @returns {Promise<number | undefined>}
     */
    async getStatus(id) {
        try {
            const doc = await this.db.collection("data").doc("users").get();
            return doc.data()[`status${id}`];
        } catch (error) {
            console.error("Error getting status:", error);
        }
    }

    /**
     * 参加プレイヤー数を取得するメソッド．
     * @returns {Promise<number>}
     */
    async getPlayerNum() {
        try {
            const doc = await this.db.collection("data").doc("users").get();
            let count = 0;

            for (let i = 1; i <= MAX_PLAYER_NUM; i++) {
                if (doc.data()[`uid${i}`]) {
                    count++;
                }
            }

            return count;
        } catch (error) {
            console.error("Error getting player number:", error);
            return 0;
        }
    }

    /**
     * 準備完了したプレイヤー数を取得するメソッド．
     * @returns {Promise<number>}
     */
    async getReadyNum() {
        try {
            const doc = await this.db.collection("data").doc("users").get();
            let readyCount = 0;

            for (let i = 1; i <= MAX_PLAYER_NUM; i++) {
                if (doc.data()[`status${i}`] === GAME_PLAYING) {
                    readyCount++;
                }
            }

            return readyCount;
        } catch (error) {
            console.error("Error getting ready number:", error);
            return 0;
        }
    }

    /**
     * ゲームの参加ユーザー情報を初期化するメソッド．
     */
    async resetUsers() {
        try {
            const updateData = {};

            for (let i = 1; i <= MAX_PLAYER_NUM; i++) {
                updateData[`uid${i}`] = null;
                updateData[`status${i}`] = 0;
            }

            await this.db.collection("data").doc("users").update(updateData);
        } catch (error) {
            console.error("Error resetting users:", error);
        }
    }

    /**
     * 盤面データを更新するメソッド．
     * @param {number} selectedX X座標
     * @param {number} selectedY Y座標
     * @param {number} currentStone 現在の石
     * @param {string} gameStatus ゲームの状態
     * @param {object} field フィールドデータ
     */
    async setData(selectedX, selectedY, currentStone, gameStatus, field) {
        try {
            await this.db.collection("data").doc("field").update({
                x: selectedX,
                y: selectedY,
                stone: currentStone,
                gameStatus: gameStatus,
                fieldList: JSON.stringify(field.fieldList)
            });
        } catch (error) {
            console.error("Error setting data:", error);
        }
    }

    /**
     * 任意のプロパティの値を更新するメソッド．
     * @param {string} property 更新するプロパティ名
     * @param {*} value プロパティの値
     */
    async update(property, value) {
        try {
            if (property.startsWith("uid") || property.startsWith("status")) {
                await this.db.collection("data").doc("users").update({ [property]: value });
            } else if (property === "gameStatus") {
                await this.db.collection("data").doc("field").update({ gameStatus: value });
            }
        } catch (error) {
            console.error("Error updating property:", error);
        }
    }

    /**
     * ローカルのゲームデータをデータベースと同期させるメソッド
     * @param {object} gameMaster 
     */
    async syncWith(gameMaster) {
        try {
            const doc = await this.db.collection("data").doc("field").get();
            const data = doc.data();

            gameMaster.setData(data.stone, data.x, data.y, data.gameStatus, JSON.parse(data.fieldList));
        } catch (error) {
            console.error("Error syncing with database:", error);
        }
    }

    /**
     * ログアウトメソッド
     */
    async logout() {
        try {
            await firebase.auth().signOut();

            console.log("Successfully signed out.");
        } catch (error) {
            console.error("Error during logout:", error);
        }
    }

    /**
     * ログイン状態を確認するメソッド．
     * @param {string} uid ユーザーのUID
     */
    async checkLogin(uid) {
        try {
            const doc = await this.db.collection("data").doc("users").get();
            const data = doc.data();

            let isLoggedIn = false;
            for (let i = 1; i <= MAX_PLAYER_NUM; i++) {
                if (data[`uid${i}`] === uid) {
                    isLoggedIn = true;
                    break;
                }
            }

            // UIDが見つからない場合はログアウト
            if (!isLoggedIn) {
                await this.logout();
            }
        } catch (error) {
            console.error("Error checking login status:", error);
        }
    }

    /**
     * タイムアウトを確認するメソッド．
     * @param {number} limitTime タイムアウト制限時間 (ミリ秒)
     * @returns {Promise<boolean>} タイムアウトしているか
     */
    async checkTimeOut(limitTime) {
        try {
            const doc = await this.db.collection("data").doc("field").get();
            const createdAt = doc.data().createdAt;

            if (createdAt) {
                const noDBAccPeriod = Date.now() - createdAt.toDate().getTime();
                return noDBAccPeriod > limitTime;
            }

            return false;
        } catch (error) {
            console.error("Error checking timeout:", error);
            return false;
        }
    }

    /**
     * ゲームで使用するIDを生成するメソッド．
     * @param {string} uid ユーザーのUID
     * @returns {Promise<number>} ゲームのID (1, 2, 3)
     */
    async createID(uid) {
        try {
            const doc = await this.db.collection("data").doc("users").get();
            const data = doc.data();

            // 既存UIDがあればそのIDを返す
            for (let i = 1; i <= MAX_PLAYER_NUM; i++) {
                if (data[`uid${i}`] === uid) {
                    return i;
                }
            }

            // 空きスロットがあればIDを返す
            for (let i = 1; i <= MAX_PLAYER_NUM; i++) {
                if (data[`uid${i}`] == null) {
                    return i;
                }
            }

        } catch (error) {
            console.error("Error creating ID:", error);
            return 0;
        }
    }

    /**
     * 個別ユーザー情報をFirestoreに保存するメソッド．
     * @param {string} uid ユーザーのUID
     */
    async createUserDoc(uid) {
        try {
            await this.db.collection("users").doc(uid).set({ uid: uid, name: "未設定" });
        } catch (error) {
            console.error("Error creating user document:", error);
        }
    }

    /**
     * ユーザーデータが存在するか確認するメソッド
     * @param {string} uid 確認するUID
     * @returns {Promise<boolean>} ユーザーデータが存在するかどうか
     */
    async existUserData(uid) {
        try {
            const doc = await this.db.collection("users").doc(uid).get();
            return doc.exists;
        } catch (error) {
            console.error("Error checking if user data exists:", error);
            return false;
        }
    }

    /**
     * ユーザーデータの存在を確認するメソッド．
     * @param {string} uid 確認するUID
     * @returns {Promise<boolean>} ユーザーデータが存在するか
     */
    async existPlayer(uid) {
        try {
            const doc = await this.db.collection("data").doc("users").get();
            const data = doc.data();

            for (let i = 1; i <= MAX_PLAYER_NUM; i++) {
                if (data[`uid${i}`] === uid) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error("Error checking if player exists:", error);
            return false;
        }
    }

    /**
     * 参加プレイヤー情報から引数のIDのプレイヤーを削除するメソッド
     * @param {number} id 削除するプレイヤーのID (1, 2, 3)
     */
    async deleteUser(id) {
        try {
            const updateData = { [`uid${id}`]: null, [`status${id}`]: 0 };
            await this.db.collection("data").doc("users").update(updateData);
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    }

    /**
     * ユーザーIDとクリックした日時をFirestoreに保存するメソッド．
     * @param {string} uid ユーザーのID
     */
    async saveTimeStamp(uid) {
        try {
            await this.db.collection("data").doc("field").update({
                uid: uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('タイムスタンプが正常に保存されました。');
        } catch (error) {
            console.error('タイムスタンプの保存中にエラーが発生しました:', error);
        }
    }

}

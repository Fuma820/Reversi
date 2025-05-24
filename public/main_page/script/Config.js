/**
 * Firebaseの設定を管理するクラス
 */
class Config {
    static firebaseConfig = {
        // Firebaseの設定情報をここに記述
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: "",
        measurementId: ""
    };

    /**
     * Firebaseの設定を取得するメソッド
     * @returns {Object} Firebaseの設定オブジェクト
     */
    static getFirebaseConfig() {
        return this.firebaseConfig;
    }
}

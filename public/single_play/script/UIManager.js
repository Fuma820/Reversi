/**
/**
 * UIの変更を行うクラス．
 */
class UIManager {
    /**
     * 第1引数のidを持つタグのテキストを第2引数の値に変更するメソッド．
     * @param {string} id ドキュメント要素のID
     * @param {string} text 表示するテキスト
     */
    setText(id, text) {
        document.getElementById(id).textContent = text;
    }

}

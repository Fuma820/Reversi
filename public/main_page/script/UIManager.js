/**
 * UIの変更を行うクラス
 */
class UIManager{
    /**
     * 第1引数のidを持つタグのテキストを第2引数の値に変更するメソッド
     * @param {*} id 
     * @param {*} text 
     */
    setText(id,text){
        document.getElementById(id).textContent = text;
    }

    /**
     * 引数のidを持つボタンを日活性化するメソッド
     * @param {*} id 
     */
    disableBtn(id){
        document.getElementById(id).disable = true;
    }
}

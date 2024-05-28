// ページが完全に読み込まれた時実行
document.addEventListener("DOMContentLoaded", () => {
    // 認証状態が変更された時に実行
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {// ログインしている場合はmain.htmlにリダイレクト
            window.location.replace("main_page/main.html");
        }
    });
    // ログインボタンが押された時実行
    document.getElementById("login_btn").onclick = () => {
        // Googleアカウントでログイン
        let provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).then((result) => {
            console.log("User logged in: ", result.user.email);
        }).catch((error) => {
            console.error(error);
            alert("ログインに失敗しました。もう一度お試しください。");
        });
    }
    // シングルプレイボタンが押された時実行
    document.getElementById("singlePlay_btn").onclick = () => {
        window.location.replace("single_play/single_play.html");
    }
});
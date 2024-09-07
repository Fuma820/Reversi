/**
 * メニューをスライドする関数．
 */
function menuActive() { document.getElementById("menu-wrapper").classList.toggle("open"); }

/**
 * ユーザー名を更新する関数．
 */
function updateName() {
    db.collection("users").doc(uid).update({
        name: document.getElementById("input_name").value
    });
}

// ユーザー情報
db.collection("users").onSnapshot(() => {
    db.collection("users").doc(uid).get().then(doc => {
        if (!doc.exists) return;
        document.getElementById("input_name").value = doc.data().name;
    });
});

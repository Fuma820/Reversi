// const firebaseConfig = {
//     apiKey: "AIzaSyAdCIMrxlj-C0h1fAC8jZ3dtkpBlIZpTvc",
//     authDomain: "test-b1eea.firebaseapp.com",
//     databaseURL: "https://test-b1eea-default-rtdb.firebaseio.com",
//     projectId: "test-b1eea",
//     storageBucket: "test-b1eea.appspot.com",
//     messagingSenderId: "32628222705",
//     appId: "1:32628222705:web:6784cadb557a1f8d301750",
//     measurementId: "G-DFPZ7PDY47"
// }

// var db = firebase.firestore(firebase.initializeApp(firebaseConfig));
var date = new Date();
var noDBAccPeriod = 0;
var limitTime = 10 * 60 * 1000;
var uid = null;
var player = 0;
var context = document.querySelector("canvas").getContext("2d");
var size = document.querySelector("canvas").width / 2;//フィールドの大きさ(6角形の1辺の長さ)
var tSize = size / 4;// マス一辺の長さ
var cellSize = tSize * Math.sin(Math.PI / 3) * (2 / 3);//各頂点から外心までの距離(正三角形なので外心＝重心)
var row = 2 * size / tSize;
var column = 4 * size / tSize + 1;
var field = Array.from(new Array(column), () => new Array(row).fill(0));
var currentStone = 1;
var selectedX = 0;
var selectedY = 0;
var numOfTarns = 0;
var skipNum = 0;
// 周囲のマスを表す配列(例：dx[0], dy[0]は右上のマスを表す)
var dx = [1, 2, 1, -1, -2, -1];
var dy = [-1, 0, 1, 1, 0, -1];
const COLOR_1 = "red";
const COLOR_2 = "blue";
const COLOR_3 = "white";

updateField();

// 長方形を描画する関数
function drawRect(color, x, y, w, h) {
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
}

// 円を描画する
function drawCircle(color, x, y, r) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.closePath();
    context.fill();
}

/**
 * 六角形を表す
 * @param {*} color 
 * @param {*} x 中心のx座標
 * @param {*} y 中心のy座標
 */
function drawHexagon(color, x, y) {
    var degree = 0;
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(x + size, y);
    for (var i = 1; i < 6; i++) {
        degree += Math.PI / 3;
        context.lineTo(x + size * Math.cos(degree), y - size * Math.sin(degree));
    }
    context.closePath();
    context.fill();
}

/**
 * 
 * @param {*} color 
 * @param {*} size 
 * @param {*} x マスの外心のx座標
 * @param {*} y マスの外心のy座標
 * @param {*} direction 0なら上，1なら下
 */
function drawTriangle(color, x, y, direction) {
    var degree;
    if (direction == 0) {
        degree = Math.PI / 2;
    } else if (direction == 1) {
        degree = -Math.PI / 2;
    }
    context.fillStyle = color;
    context.strokeStyle = "black";
    context.beginPath();
    context.moveTo(x + cellSize * Math.cos(degree), y - cellSize * Math.sin(degree));
    degree += Math.PI * 2 / 3;
    context.lineTo(x + cellSize * Math.cos(degree), y - cellSize * Math.sin(degree));
    degree += Math.PI * 2 / 3;
    context.lineTo(x + cellSize * Math.cos(degree), y - cellSize * Math.sin(degree));
    context.closePath();
    context.fill();
    context.stroke();
}

function checkOnField(x, y) {
    /*
     * size / tSize = 4
     * よって
     * ・y=-x+4
     * ・y=x-12
     * ・y=x+4
     * ・y=-x+20
     * ・y=0
     * ・y=8
     * の6直線に囲まれた六角形について考える
     */
    if (size / tSize <= x + y
        && x - y <= (size / tSize) * 3
        && y - x < size / tSize
        && x + y < (size / tSize) * 5
        && 0 <= y
        && y < (size / tSize) * 2) {
        return true;
    }
    return false;
}

function setStone(x, y, stone) {
    if (!checkOnField(x, y)) return -1;
    field[x][y] = stone;
}

function getStone(x, y) {
    if (!checkOnField(x, y)) return -1;
    return field[x][y];
}

function getReversibleNum(stone, x, y, dx, dy, n) {
    if (getStone(x + dx, y + dy) < 1) return 0;
    if (getStone(x + dx, y + dy) == stone) return n;
    return getReversibleNum(stone, x + dx, y + dy, dx, dy, n + 1);
}

// 引数のマスに石を置けるか判定する関数
function canPut(stone, x, y) {
    if (!checkOnField(x, y)) return false;
    if (getStone(x, y) > 0) return;
    // 周囲のマスをひっくり返せるか確かめる
    for (var i = 0; i < 6; i++) {
        if (getReversibleNum(stone, x, y, dx[i], dy[i], 0) > 0) return true;
    }
    return false;
}

// 引数の方向の石をひっくり返す関数
function reverse(stone, x, y, dx, dy) {
    if (getStone(x + dx, y + dy) == stone) return;
    setStone(x + dx, y + dy, stone);
    reverse(stone, x + dx, y + dy, dx, dy);
}

function putStone(x, y, stone) {
    setStone(x, y, stone);
    for (var i = 0; i < 6; i++) {
        if (getReversibleNum(stone, x, y, dx[i], dy[i], 0) > 0) reverse(stone, x, y, dx[i], dy[i]);
    }
}

function updateField() {
    var direction = 1;
    var numOfCanPut = 0;
    var x = 0;
    var y = 0;

    drawRect("black", 0, 0, size * 2, size * Math.sin(Math.PI / 3) * 2);
    for (var i = 0; i < row; i++) {
        for (var j = 0; j < column; j++) {
            x = j * tSize / 2;
            y = i * cellSize * 3 / 2 + 1;
            if ((i + j) % 2 == 0) {
                direction = 0;
                y += cellSize;
            } else {
                direction = 1;
                y += cellSize / 2;
            }
            //マスの色
            var bgColor = "green";// 通常マスは緑
            if (canPut(currentStone, j, i)) {
                bgColor = "lime";// 次に置けるマスは薄緑
                numOfCanPut++;
            }
            if (j == selectedX && i == selectedY) bgColor = "yellow";// 石を置いたマスなら黄色

            if (checkOnField(j, i)) {
                drawTriangle(bgColor, x, y, direction);
                //円の表示
                if (field[j][i] == 1) {
                    drawCircle(COLOR_1, x, y, 0.9 * cellSize / 2);
                } else if (field[j][i] == 2) {
                    drawCircle(COLOR_2, x, y, 0.9 * cellSize / 2);
                } else if (field[j][i] == 3) {
                    drawCircle(COLOR_3, x, y, 0.9 * cellSize / 2);
                }
            }
        }
    }
    // 置けるマスがなければ番を交代
    console.log(numOfCanPut);
    if (numOfCanPut == 0 && numOfTarns != 0) {
        currentStone++;
        if (currentStone > 3) currentStone == 1;
        if (skipNum < 3) {
            skipNum++;
            updateField();
        } else {
            //試合終了
            console.log("試合終了");
        }
    } else {
        skipNum = 0;
    }
}

function onClick(e) {
    // db.collection("data").doc("field").onSnapshot(snapshot => {
    //     if (snapshot.data().createdAt != null) {
    //         noDBAccPeriod = date.getTime() - snapshot.data().createdAt.toDate().getTime();
    //     }
    //     if (noDBAccPeriod > limitTime) {
    //         init();
    //         logout();
    //         return;
    //     }
    // });

    // クリックされたマスの座標を取得
    var rect = e.target.getBoundingClientRect();
    var y = Math.floor((e.clientY - rect.top) / (cellSize * 3 / 2));//クリックした値より小さい最大のマス
    var x = Math.floor((e.clientX - rect.left) / (tSize / 2));//クリックした値より小さい最大のマス
    if ((x + y) % 2 == 0) {//上向きの場合
        //x,yが表す三角形の(一番上の)頂点を原点として相対的な座標でクリックしたマスのx座標がxかx＋１か判定する
        var topOfTriangleY = y * cellSize * 3 / 2;
        var topOfTriangleX = x * tSize / 2;
        var relativeY = (e.clientY - rect.top) - topOfTriangleY;
        var relativeX = (e.clientX - rect.left) - topOfTriangleX;
        if (relativeY < 2 * Math.sin(Math.PI / 3) * relativeX) {
            x++;
        }
    } else if ((x + y) % 2 == 1) {//下向きの場合
        //x,yが表す三角形の(一番下の)頂点を原点として相対的な座標でクリックしたマスのx座標がxかx＋１か判定する
        var topOfTriangleY = (y + 1) * cellSize * 3 / 2;
        var topOfTriangleX = x * tSize / 2;
        var relativeY = (e.clientY - rect.top) - topOfTriangleY;
        var relativeX = (e.clientX - rect.left) - topOfTriangleX;
        if (relativeY > - 2 * Math.sin(Math.PI / 3) * relativeX) {
            x++;
        }
    }

    if (checkOnField(x, y)) {
        if (!canPut(currentStone, x, y)) return;
        putStone(x, y, currentStone);
        selectedX = x;
        selectedY = y;
        currentStone++;
        if (currentStone > 3) currentStone = 1;
        numOfTarns++;
        updateField();
        // db.collection("data").doc("field").update({
        //     x: x,
        //     y: y,
        //     stone: currentStone,
        //     field: JSON.stringify(field), // 配列をJSON形式で保存
        //     uid: uid,
        //     createdAt: firebase.firestore.FieldValue.serverTimestamp()
        //   });
    }
}

/**
 * フィールドを初期化する関数
 */
function init() {
    field = Array.from(new Array(column), () => new Array(row).fill(0));
    currentStone = 1;
    selectedX = 0;
    selectedY = 0;
    numOfTarns = 1;
    skipNum = 0;
    setStone(8, 2, 1);
    setStone(8, 3, 1);
    setStone(8, 4, 1);
    setStone(8, 5, 1);
    setStone(6, 3, 2);
    setStone(7, 3, 2);
    setStone(9, 4, 2);
    setStone(10, 4, 2);
    setStone(9, 3, 3);
    setStone(10, 3, 3);
    setStone(7, 4, 3);
    setStone(6, 4, 3);
    updateField();
    // データベースを初期化
    //     db.collection("data").doc("field").update({
    //         x: selectedX,
    //         y: selectedY,
    //         uid: uid,
    //         stone: currentStone,
    //         field: JSON.stringify(field),
    //         createdAt: firebase.firestore.FieldValue.serverTimestamp()
    //     });
}

// ログアウト関数
// function logout() {
//     firebase.auth().signOut().then(() => {
//         // Sign-out successful.
//         db.collection("data").doc("users").update({
//             uid1: null,
//             uid2: null,
//             uid3: null
//         }).then(function () {
//             window.location.replace("../index.html");
//         }).catch(function (error) {
//             // The document probably doesn't exist.
//             console.error("Error updating document: ", error);
//         });
//     }).catch((error) => {
//         // An error happened.
//     });
// }

//ログイン状況が変化した場合呼び出す
// firebase.auth().onAuthStateChanged(function (user) {
//     // ログインしていない場合はログインページに移動
//     if (!user) window.location.replace("../index.html");
//     uid = user.uid;
//     db.collection("data").doc("field").onSnapshot(snapshot => {
//       if (snapshot.data().createdAt != null) {
//         noDBAccPeriod = date.getTime() - snapshot.data().createdAt.toDate().getTime();
//       }
//     });
//     db.collection("data").doc("users").onSnapshot(snapshot => {
//       // 最後の処理から10分以上経っていれば初期化する
//       if (noDBAccPeriod > limitTime
//         && snapshot.data().uid1 != uid
//         && snapshot.data().uid2 != uid) {
//         db.collection("data").doc("users").update({
//           uid1: null,
//           uid2: null
//         });
//         init();
//       }
//       // ログイン情報をデータベースに格納
//       if (snapshot.data().uid1 == uid || snapshot.data().uid1 == null) {
//         player = 1;
//         db.collection("data").doc("users").update({ uid1: uid });
//       } else if (snapshot.data().uid2 == uid || snapshot.data().uid2 == null) {
//         player = 2;
//         db.collection("data").doc("users").update({ uid2: uid });
//         init();
//       }
//       else {// 2人以上ログインしている場合はログインページに戻る
//         logout();
//       }
//     });
//   });

// データベースからfieldの値を取得
// db.collection("data").doc("field").onSnapshot(snapshot => {
//     field = JSON.parse(snapshot.data().field);
//     selectedX = snapshot.data().x;
//     selectedY = snapshot.data().y;
//     currentStone = snapshot.data().stone;
//     checkField();
// });
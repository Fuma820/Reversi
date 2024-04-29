const firebaseConfig = {
  apiKey: "AIzaSyAdCIMrxlj-C0h1fAC8jZ3dtkpBlIZpTvc",
  authDomain: "test-b1eea.firebaseapp.com",
  databaseURL: "https://test-b1eea-default-rtdb.firebaseio.com",
  projectId: "test-b1eea",
  storageBucket: "test-b1eea.appspot.com",
  messagingSenderId: "32628222705",
  appId: "1:32628222705:web:6784cadb557a1f8d301750",
  measurementId: "G-DFPZ7PDY47"
};

var db = firebase.firestore(firebase.initializeApp(firebaseConfig));
var date = new Date();
var noDBAccPeriod = 0;
var player = 0;
var uid = null;
var context = document.querySelector("canvas").getContext("2d");
var ref = null;
var field = Array.from(new Array(8), () => new Array(8).fill(0));
var currentStone = 1;
var selectedX = 0;
var selectedY = 0;
var cellSize = 100;
// 周囲のマスへの移動を表す配列(例：dx[0], dy[0]は上への移動を表す)
var dx = [0, 1, 1, 1, 0, -1, -1, -1];
var dy = [-1, -1, 0, 1, 1, 1, 0, -1];

//ログイン状況が変化した場合呼び出す
firebase.auth().onAuthStateChanged(function (user) {
  // ログインしていない場合はログインページに移動
  if (!user) window.location.replace("../index.html");
  uid = user.uid;
  // 最後の更新時間との差を求める
  db.collection("data").doc("field").onSnapshot(snapshot => {
    if (snapshot.data().createdAt != null) {
      noDBAccPeriod = date.getTime() - snapshot.data().createdAt.toDate().getTime();
    }
  });
  db.collection("data").doc("users").onSnapshot(snapshot => {
    // 最後の処理から10分以上経っていれば初期化する
    if (noDBAccPeriod > 10 * 60 * 1000) {
      db.collection("data").doc("users").update({
        uid1: null,
        uid2: null
      });
      init();
    }
    //ログイン情報をデータベースに格納
    if (snapshot.data().uid1 == uid || snapshot.data().uid1 == null) {
      player = 1;
      db.collection("data").doc("users").update({ uid1: uid });
    } else if (snapshot.data().uid2 == uid || snapshot.data().uid2 == null) {
      player = 2;
      db.collection("data").doc("users").update({ uid2: uid });
      init();
    }
    else {// 2人以上ログインしている場合はログインページに戻る
      logout();
    }
  });
});

// データベースからfieldの値を取得
db.collection("data").doc("field").onSnapshot(snapshot => {
  ref = snapshot.ref;
  field = JSON.parse(snapshot.data().field);
  selectedX = snapshot.data().x;
  selectedY = snapshot.data().y;
  currentStone = snapshot.data().stone;
  checkField();
});

// 引数の座標のマスの情報を取得する関数
function getStone(x, y) {
  if (x < 1 || x > 8 || y < 1 || y > 8) return -1;
  return field[y - 1][x - 1];
}

// 引数の座標のマスの情報を設定する関数(stone: 0=石がない，1=黒石，2=白石)
function setStone(x, y, stone) {
  if (x < 1 || x > 8 || y < 1 || y > 8) return;
  field[y - 1][x - 1] = stone;
}

// 長方形を描画する関数
function drawRect(color, x, y, w, h) {
  context.fillStyle = color;
  context.fillRect(x, y, w, h);
}

// 円を描画する関数
function drawCircle(color, x, y, r) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, r, 0, 2 * Math.PI);
  context.closePath();
  context.fill();
}

// フィールドを描写する関数
function checkField() {
  var numOfCanPut = 0;
  drawRect("black", 0, 0, cellSize * 8, cellSize * 8);
  for (var y = 1; y <= 8; y++) {
    for (var x = 1; x <= 8; x++) {
      var bgColor = "green";// 通常マスは緑
      if (canPut(currentStone, x, y)) {
        bgColor = "lime";// 次に置けるマスは薄緑
        numOfCanPut++;
      }
      if (x == selectedX && y == selectedY) bgColor = "yellow";// 石を置いたマスなら黄色
      drawRect(bgColor, (x - 1) * cellSize, (y - 1) * cellSize, cellSize - 1, cellSize - 1);
      if (getStone(x, y) == 1) drawCircle("black", x * cellSize - cellSize / 2, y * cellSize - cellSize / 2, cellSize * 0.9 / 2);
      if (getStone(x, y) == 2) drawCircle("white", x * cellSize - cellSize / 2, y * cellSize - cellSize / 2, cellSize * 0.9 / 2);
    }
  }
  // 置けるマスがなければ番を交代
  if (numOfCanPut == 0) currentStone = currentStone % 2 + 1;
  // 最後に石を置いたのが自分かつ置けるマスがなければ試合終了
}

// 引数のマスに石を置けるか判定する関数
function canPut(stone, x, y) {
  if (getStone(x, y) > 0) return;
  // 周囲のマスをひっくり返せるか確かめる
  for (var i = 0; i < 8; i++) {
    if (getReversibleNum(stone, x, y, dx[i], dy[i], 0) > 0) return true;
  }
  return false;
}

// 石を設置し，周囲の石をひっくり返す関数
function putStone(x, y, stone) {
  setStone(x, y, stone);
  for (var i = 0; i < 8; i++) {
    if (getReversibleNum(stone, x, y, dx[i], dy[i], 0) > 0) reverse(stone, x, y, dx[i], dy[i]);
  }
}

// dx方向にひっくる返せる石の数を返す関数
function getReversibleNum(stone, x, y, dx, dy, n) {
  if (getStone(x + dx, y + dy) < 1) return 0;
  if (getStone(x + dx, y + dy) == stone) return n;
  return getReversibleNum(stone, x + dx, y + dy, dx, dy, n + 1);
}

// 引数の方向の石をひっくり返す関数
function reverse(stone, x, y, dx, dy) {
  if (getStone(x + dx, y + dy) == stone) return;
  setStone(x + dx, y + dy, stone);
  reverse(stone, x + dx, y + dy, dx, dy);
}

// 画面をクリックした時の関数
function onClick(e) {
  // ログインしていなければログインページに戻る
  if (!uid) window.location.replace("../index.html");
  db.collection("data").doc("users").onSnapshot(snapshot => {
    // 自分の番か判定
    if (snapshot.data().uid2 != null && currentStone != player) return;
    // クリックされたマスの座標を取得
    var rect = e.target.getBoundingClientRect();
    var x = Math.floor((e.clientX - rect.left) / cellSize) + 1;
    var y = Math.floor((e.clientY - rect.top) / cellSize) + 1;

    if (!canPut(currentStone, x, y)) return;
    selectedX = x;
    selectedY = y;
    putStone(x, y, currentStone);
    currentStone = currentStone % 2 + 1;// 番交代
    checkField();
    db.collection("data").doc("field").update({
      x: x,
      y: y,
      stone: currentStone,
      field: JSON.stringify(field), // 配列をJSON形式で保存
      uid: uid,
      prev: ref,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });
}

// フィールドを初期化する関数
function init() {
  field = Array.from(new Array(8), () => new Array(8).fill(0));
  currentStone = 1;
  selectedX = 0;
  selectedY = 0;
  setStone(4, 5, 1);
  setStone(5, 4, 1);
  setStone(4, 4, 2);
  setStone(5, 5, 2);
  checkField();
  // データベースを初期化
  db.collection("data").doc("field").update({
    x: selectedX,
    y: selectedY,
    uid: uid,
    stone: currentStone,
    field: JSON.stringify(field),
    prev: ref,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// ログアウト関数
function logout() {
  firebase.auth().signOut().then(() => {
    // Sign-out successful.
    if (player == 1) {
      db.collection("data").doc("users").update({
        uid1: null,
        uid2: null
      }).then(function () {
        window.location.replace("../index.html");
      }).catch(function (error) {
        // The document probably doesn't exist.
        console.error("Error updating document: ", error);
      });
    }else if (player == 2) {
      db.collection("data").doc("users").update({
        uid2: null
      }).then(function () {
        window.location.replace("../index.html");
      }).catch(function (error) {
        // The document probably doesn't exist.
        console.error("Error updating document: ", error);
      });
    }
  }).catch((error) => {
    // An error happened.
  });
}

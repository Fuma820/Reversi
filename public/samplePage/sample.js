/*
 var firebaseConfig = {
    apiKey: "AIzaSyD8F1resUpF8cKNcRM-v0dlkiKmCyJfxaw",
    authDomain: "othello-ac140.firebaseapp.com",
    databaseURL: "https://othello-ac140.firebaseio.com",
    projectId: "othello-ac140",
    storageBucket: "othello-ac140.appspot.com",
    messagingSenderId: "307954798548",
    appId: "1:307954798548:web:8007d324527bfaade21041"
};
*/
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAdCIMrxlj-C0h1fAC8jZ3dtkpBlIZpTvc",
    authDomain: "test-b1eea.firebaseapp.com",
    projectId: "test-b1eea",
    storageBucket: "test-b1eea.appspot.com",
    messagingSenderId: "32628222705",
    appId: "1:32628222705:web:6784cadb557a1f8d301750",
    databaseURL: "https://othello-ac140.firebaseio.com",
    measurementId: "G-DFPZ7PDY47"
  };
  
// Initialize Firebase
var db = firebase.firestore(firebase.initializeApp(firebaseConfig));
var uid = null;
firebase.auth().signInAnonymously();
firebase.auth().onAuthStateChanged(function (user) {
    if (user) uid = user.uid;
});

db.collection("actions").orderBy("createdAt", "desc").limit(1).onSnapshot(function (querySnapshot) {
    querySnapshot.forEach(function(doc) {
        var data = doc.data();
        ref = doc.ref;
        field = JSON.parse(data.field);
        selectedX = data.x;
        selectedY = data.y;
        currentStone = data.stone;
        drawField();
    });
})

var context = document.querySelector("canvas").getContext("2d");
var ref = null;
var field = Array.from(new Array(8), () => new Array(8).fill(0));
var currentStone = 1;
var selectedX = 0;
var selectedY = 0;
drawField();

function getStone(x, y) {
    if (x < 1 || x > 8 || y < 1 || y > 8) return -1;
    return field[y - 1][x - 1];
}

function setStone(x, y, stone) {
    if (x < 1 || x > 8 || y < 1 || y > 8) return;
    field[y - 1][x - 1] = stone;
}

function drawRect(color, x, y, w, h) {
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
}

function drawCircle(color, x, y, r) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.closePath();
    context.fill();
}

function drawField() {
    console.log(selectedX, selectedY)
    drawRect("white", 0, 0, 800, 800);
    for (var y = 1; y <= 8; y++) {
        for (var x = 1; x <= 8; x++) {
            var bgColor = (x == selectedX && y == selectedY) ? "yellow" : "green";
            drawRect(bgColor, (x - 1) * 100, (y - 1) * 100, 99, 99);
            if (getStone(x, y) == 1) drawCircle("black", x * 100 - 50, y * 100 - 50, 44);
            if (getStone(x, y) == 2) drawCircle("white", x * 100 - 50, y * 100 - 50, 44);
        }
    }
}

var dx = [0, 1, 1, 1, 0, -1, -1, -1];
var dy = [-1, -1, 0, 1, 1, 1, 0, -1];
function canReverse(stone, x, y) {
    if (getStone(x, y) > 0) return;
    for (var i = 0; i < 8; i++) {
        if (getReversibleNum(stone, x + dx[i], y + dy[i], dx[i], dy[i], 0) > 0) return true;
    }
    return false;
}

function putStone(x, y, stone) {
    setStone(x, y, stone);
    for (var i = 0; i < 8; i++) {
        if (getReversibleNum(stone, x + dx[i], y + dy[i], dx[i], dy[i], 0) > 0) reverse(stone, x + dx[i], y + dy[i], dx[i], dy[i]);
    }
}

function getReversibleNum(stone, x, y, dx, dy, n) {
    if (getStone(x, y) < 1) return 0;
    if (getStone(x, y) == stone) return n;
    return getReversibleNum(stone, x + dx, y + dy, dx, dy, n + 1);
}

function reverse(stone, x, y, dx, dy) {
    if (getStone(x, y) < 1) return;
    if (getStone(x, y) == stone) return;
    setStone(x, y, stone);
    reverse(stone, x + dx, y + dy, dx, dy);
}

function init() {
    field = Array.from(new Array(8), () => new Array(8).fill(0));
    currentStone = 1;
    selectedX = 0;
    selectedY = 0;
    setStone(4, 5, 1);
    setStone(5, 4, 1);
    setStone(4, 4, 2);
    setStone(5, 5, 2);
    drawField();
    db.collection("actions").add({
        x: selectedX,
        y: selectedY,
        stone: currentStone,
        field: JSON.stringify(field),
        uid: uid,
        prev: ref,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

function onClick(e) {
    var rect = e.target.getBoundingClientRect()
    var x = Math.floor((e.clientX - rect.left) / 100) + 1
    var y = Math.floor((e.clientY - rect.top) / 100) + 1
    console.log(x, y)
    if (!canReverse(currentStone, x, y)) return;
    selectedX = x;
    selectedY = y;
    putStone(x, y, currentStone)
    currentStone = currentStone % 2 + 1;
    drawField();
    db.collection("actions").add({
        x: x,
        y: y,
        stone: currentStone,
        field: JSON.stringify(field),
        uid: uid,
        prev: ref,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

var uid = null;
var player = 1;
var context = document.querySelector("canvas").getContext("2d");
var size = document.querySelector("canvas").width / 2;//フィールドの大きさ(6角形の1辺の長さ)
var tSize = size / 4;// マス一辺の長さ
var cellSize = tSize * Math.sin(Math.PI / 3) * (2 / 3);//各頂点から外心までの距離(正三角形なので外心＝重心)
var row = 2 * size / tSize;
var column = 4 * size / tSize + 1;
var field = Array.from(new Array(column), () => new Array(row).fill(0));
var nextList = Array.from(new Array());
var currentStone = 1;
var selectedX = 0;
var selectedY = 0;
var gameStatus = 0;
var skipNum = 0;
// 周囲のマスを表す配列(例：dx[0], dy[0]は右上のマスを表す)
var dx = [1, 2, 1, -1, -2, -1];
var dy = [-1, 0, 1, 1, 0, -1];
const COLOR_1 = "red";
const COLOR_2 = "blue";
const COLOR_3 = "white";
const BG_COLOR = "white";

/**
 * 長方形を描画する関数
 * @param {*} color 
 * @param {*} x 
 * @param {*} y 
 * @param {*} w 
 * @param {*} h 
 */
function drawRect(color, x, y, w, h) {
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
}

/**
 * 円を描画する関数
 * @param {*} color 
 * @param {*} x 
 * @param {*} y 
 * @param {*} r 
 */
function drawCircle(color, x, y, r) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.closePath();
    context.fill();
}

/**
 * 六角形を描画する関数
 * @param {*} color 
 * @param {*} x 中心のx座標
 * @param {*} y 中心のy座標
 */
// function drawHexagon(color, x, y) {
//     var degree = 0;
//     context.fillStyle = color;
//     context.beginPath();
//     context.moveTo(x + size, y);
//     for (var i = 1; i < 6; i++) {
//         degree += Math.PI / 3;
//         context.lineTo(x + size * Math.cos(degree), y - size * Math.sin(degree));
//     }
//     context.closePath();
//     context.fill();
// }

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

/**
 * 引数で指定する座標がフィールド上であるか判定する関数
 * @param {*} x 
 * @param {*} y 
 * @returns 
 */
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

/**
 * field配列に引数の情報を格納する関数
 * @param {*} x 
 * @param {*} y 
 * @param {*} stone 
 * @returns 
 */
function setStone(x, y, stone) {
    if (!checkOnField(x, y)) return -1;
    field[x][y] = stone;
}

/**
 * 引数で指定したマスの石の情報を返す関数
 * @param {*} x 
 * @param {*} y 
 * @returns 引数で指定したマスの石の情報
 */
function getStone(x, y) {
    if (!checkOnField(x, y)) return -1;
    return field[x][y];
}

/**
 * 引数の座標から引数で指定した方向に何個ひっくり返せるか
 * 判定する再帰関数
 * @param {*} stone 
 * @param {*} x 
 * @param {*} y 
 * @param {*} dx 
 * @param {*} dy 
 * @param {*} n 
 * @returns ひっくり返せる個数
 */
function getReversibleNum(stone, x, y, dx, dy, n) {
    if (getStone(x + dx, y + dy) < 1) return 0;
    if (getStone(x + dx, y + dy) == stone) return n;
    return getReversibleNum(stone, x + dx, y + dy, dx, dy, n + 1);
}

/**
 * 引数のマスに石を置けるか判定する関数
 * @param {*} stone 
 * @param {*} x 
 * @param {*} y 
 * @returns 
 */
function canPut(stone, x, y) {
    if (!checkOnField(x, y)) return false;
    if (getStone(x, y) > 0) return;
    // 周囲のマスをひっくり返せるか確かめる
    for (var i = 0; i < 6; i++) {
        if (getReversibleNum(stone, x, y, dx[i], dy[i], 0) > 0) return true;
    }
    return false;
}

/**
 * 引数の方向に石をひっくり返していく再帰関数
 * @param {*} stone
 * @param {*} x 
 * @param {*} y 
 * @param {*} dx 
 * @param {*} dy 
 * @returns 
 */
function reverse(stone, x, y, dx, dy) {
    if (getStone(x + dx, y + dy) == stone) return;
    setStone(x + dx, y + dy, stone);
    reverse(stone, x + dx, y + dy, dx, dy);
}

/**
 * 引数で指定したマスに石を置き，全ての方向のひっくり返せる石をひっくり返す関数
 * @param {*} x 
 * @param {*} y 
 * @param {*} stone 
 */
function putStone(x, y, stone) {
    setStone(x, y, stone);
    for (var i = 0; i < 6; i++) {
        if (getReversibleNum(stone, x, y, dx[i], dy[i], 0) > 0) reverse(stone, x, y, dx[i], dy[i]);
    }
}

/**
 * ランダムに自動で石を置く関数
 */
function autoPut() {
    var index = Math.floor(Math.random() * nextList.length);
    selectedX = nextList[index][0];
    selectedY = nextList[index][1];
    putStone(selectedX, selectedY, currentStone);
    currentStone++;
    if (currentStone > 3) currentStone = 1;
    updateField();
}

/**
 * ゲーム終了関数
 */
function gameFinish() {
    var message = "試合終了\n"
    var point = 0;
    var ranking = 0;
    var pointOfPlayer1 = 0;
    var pointOfPlayer2 = 0;
    var pointOfPlayer3 = 0;
    gameStatus = 2;
    //fieldの値からそれぞれの色の数を取得
    //順位を決定
    //順位とメッセージを表示
    for (var i = 0; i < row; i++) {
        for (var j = 0; j < column; j++) {
            if (field[j][i] == 1) {
                pointOfPlayer1++;
            } else if (field[j][i] == 2) {
                pointOfPlayer2++;
            } else if (field[j][i] == 3) {
                pointOfPlayer3++;
            }
        }
    }
    if (player == 1) {
        point = pointOfPlayer1;
    } else if (player == 2) {
        point = pointOfPlayer2;
    } else if (player == 3) {
        point = pointOfPlayer3;
    }
    var pointList = [pointOfPlayer1, pointOfPlayer2, pointOfPlayer3];
    pointList.sort();
    for (var i = 0; i < pointList.length; i++) {
        if (pointList[i] == point) {
            ranking = i;
            break;
        }
    }
    message += "得点: " + point + "\n順位: " + ranking;
    setTimeout(function(){alert(message)}, 1000);
}

/**
 * 盤面の情報を更新する関数
 */
function updateField() {
    var direction = 1;
    var numOfCanPut = 0;
    var x = 0;
    var y = 0;
    // 盤面表示
    drawRect(BG_COLOR, 0, 0, size * 2, size * Math.sin(Math.PI / 3) * 2);
    nextList.length = 0;
    for (var i = 0; i < row; i++) {
        for (var j = 0; j < column; j++) {
            x = j * tSize / 2;
            y = i * cellSize * 3 / 2 + 1;
            if ((i + j) % 2 == 0) {// 上向き
                direction = 0;
                y += cellSize;
            } else { //下向き
                direction = 1;
                y += cellSize / 2;
            }
            //マスの色
            var bgColor = "green";// 通常マスは緑
            if (canPut(currentStone, j, i)) {
                bgColor = "lime";// 次に置けるマスは薄緑
                nextList.push([j, i]);
                numOfCanPut++;
            }
            if (j == selectedX && i == selectedY) bgColor = "yellow";// 最後に石を置いたマスは黄色

            if (checkOnField(j, i)) {
                drawTriangle(bgColor, x, y, direction);
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

    if (numOfCanPut == 0 && gameStatus == 1) {// 置けるマスがなければ番を交代
        currentStone++;
        if (currentStone > 3) currentStone = 1;
        if (skipNum < 3) {
            skipNum++;
            updateField();
        } else {//全員スキップならば試合終了
            gameFinish();
        }
    } else {
        skipNum = 0;
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
    gameStatus = 1;
    skipNum = 0;
    setStone(8, 2, 1);
    setStone(8, 3, 1);
    setStone(8, 4, 1);
    setStone(8, 5, 1);
    setStone(6, 3, 2);
    setStone(7, 3, 2);
    setStone(9, 4, 2);
    setStone(10, 4, 2);
    setStone(6, 4, 3);
    setStone(7, 4, 3);
    setStone(9, 3, 3);
    setStone(10, 3, 3);
    updateField();
}

/**
 * ログアウト関数
 */
function logout() {
    window.location.replace("index.html");
}

/**
 * 画面クリック時関数
 * @param {*} e 
 */
function onClick(e) {
    // 自分の番か判定
    if (currentStone != player) return;

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
        updateField();
        var timer = null;
        var count = 0;
        var timer = setInterval(function () {
            autoPut();
            if (timer != null && count > 0 || gameStatus == 2) {
                clearInterval(timer);
            }
            count++;
        }, 1000);
    }
}

init();

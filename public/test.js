var context = document.querySelector("canvas").getContext("2d");
var size = document.querySelector("canvas").width / 2;//フィールドの大きさ(6角形の1辺の長さ)
var tSize = size / 4;// マス一辺の長さ
var cellSize = tSize * Math.sin(Math.PI / 3) * (2 / 3);//各頂点から外心までの距離(正三角形なので外心＝重心)
drawField();


// 長方形を描画する関数
function drawRect(color, x, y, w, h) {
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
}

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
 * @param {*} direction 0なら上，1なら下，2なら右，3なら左
 */
function drawTriangle(color, x, y, direction) {
    var degree;
    if (direction == 0) {
        degree = Math.PI / 2;
    } else if (direction == 1) {
        degree = -Math.PI / 2;
    } else if (direction == 2) {
        degree = 0;
    } else if (direction == 3) {
        degree = -Math.PI;
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

function drawField() {
    var direction = 1;
    var x = size / 2 + tSize / 2;
    var y = cellSize / 2;
    var row = size * 2 / tSize;
    var column = size / tSize;

    drawRect("black", 0, 0, size * 2, size * Math.sin(Math.PI / 3) * 2);

    for (var i = 0; i < row; i++) {
        for (var j = 0; j < column; j++) {
            drawTriangle("green", x, y, direction);
            x += tSize;
            direction
        }
        x = x - tSize * column;
        y += cellSize / 2;
        direction--;
        if (i < row / 2) {
            column++;
            x -= tSize / 2
        } else {
            column--;
            x += tSize / 2;
        }
        for (var j = 0; j < column; j++) {
            drawTriangle("green", x, y, direction);
            x += tSize;
        }
        x = x - tSize * column;
        y += cellSize;
        direction++;
    }
}

function drawCircle(color, x, y, r) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.closePath();
    context.fill();
}

function onClick(e) {
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
        console.log(x + ", " + y);
    }
}

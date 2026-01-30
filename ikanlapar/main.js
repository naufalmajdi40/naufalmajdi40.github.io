// scene
let boardW = 720;
let boardH = window.innerHeight;

//player
let playerX = 0;
let playerY = boardH / 2;
let playerWidth = 100
let playerHeight = 80
let playerImage = new Image();
let sharkImage = new Image();
let coinImage = new Image();
let board
let gameOver = false;
playerImage.src = "player.svg"
sharkImage.src = "shark.png"
coinImage.src = "coin.png"

const player = {
    x: playerX,
    y: playerY,
    width: playerWidth,
    height: playerHeight
}

//enemy 
let sharkArray = []
const shark = {
    x: boardW,
    y: 0,
    width: 200,
    height: 100,
    speed: -10
}

//coin 
let coinArray = []
const coin = {
    x: boardW,
    y: 0,
    width: 50,
    height: 50,
    speed: -10,
    tipe: 0
}

//phisik
let mouse = { x: 200, y: 150 }

let context

window.onload = function () {
    board = document.getElementById("board");
    board.width = boardW
    board.height = boardH
    context = board.getContext("2d");
    requestAnimationFrame(mainLoop);
    board.addEventListener("mousemove", gerakmouse);
    board.addEventListener("touchstart", handleTouch, { passive: false });
    board.addEventListener("touchmove", handleTouch, { passive: false });
    this.setInterval(placeShark, 500);
    this.setInterval(placeCoin, 1000);
}

function mainLoop() {
    requestAnimationFrame(mainLoop);
    if (gameOver) {
        return;
    }
    context.clearRect(0, 0, boardW, boardH);

    // render background
    context.fillStyle = "blue";
    context.fillRect(0, 0, boardW, boardH);

    player.y += (mouse.y - player.y) * 0.1;
    context.drawImage(playerImage, player.x, player.y, player.width, player.height);


    //render shark 

    if (sharkArray.length > 0 && sharkArray[0].x < 0 - (shark.width / 2)) {
        console.log("sharkArray", sharkArray[0].x, boardW)
        sharkArray.shift()
    }
    for (let i = 0; i < sharkArray.length; i++) {
        sharkArray[i].x += shark.speed;
        context.drawImage(sharkImage, sharkArray[i].x, sharkArray[i].y, sharkArray[i].width, sharkArray[i].height);
        context.fillStyle = "white";
        if ((player.x + (playerWidth / 2)) >= sharkArray[i].x &&
            player.y > (sharkArray[i].y) &&
            player.y < (sharkArray[i].y + shark.height / 2)) {
            gameOver = true
        }
    }

    for (let i = 0; i < coinArray.length; i++) {
        coinArray[i].x += coin.speed;
        context.drawImage(coinImage, coinArray[i].x, coinArray[i].y, coinArray[i].width, coinArray[i].height);
        context.fillStyle = "white";
        context.fillText("+", coinArray[i].x, coinArray[i].y)
    }
}



function placeCoin() {
    coin.y = Math.random() * boardW;
    const newCoin = {
        x: coin.x,
        y: Math.random() * boardW,
        width: coin.width,
        height: coin.height,
        passed: false
    }
    coinArray.push(newCoin)
}



function gerakmouse(e) {
    const r = board.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
}
function handleTouch(e) {
    e.preventDefault(); // penting biar gak scroll
    const rect = board.getBoundingClientRect();
    const t = e.touches[0];

    mouse.x = t.clientX - rect.left;
    mouse.y = t.clientY - rect.top;
}
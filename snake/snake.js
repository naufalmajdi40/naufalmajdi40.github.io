let blockSize = 25
let rows = 30;
let cols = 30
var board
var context

// snake head
let snakeX = blockSize * 5
let snakeY = blockSize * 5

let velocityX = 0
let velocityY = 0

// snake body
let snakeBody = []

let gameOver = false


//sound
const eatSound = new Audio("sfx_point.wav")
const bgm = new Audio("bgm2.mp4")
const hitSound = new Audio("sfx_hit.wav")
bgm.loop = true

let score = 0

window.onload = function () {
    board = document.getElementById("board")
    board.height = rows * blockSize
    board.width = cols * blockSize
    context = board.getContext("2d") //used for drawing on the canvas
    placeFood()
    document.addEventListener("keyup", changeDirection)
    setInterval(() => {
        update()
    }, 1000 / 10);

}

function changeDirection(e) {
    if (bgm.paused) {
        bgm.play()
    }
    if (e.code == "ArrowUp" && velocityY != 1) {
        velocityX = 0
        velocityY = -1
    }
    else if (e.code == "ArrowDown" && velocityY != -1) {
        velocityX = 0
        velocityY = 1
    }
    else if (e.code == "ArrowLeft" && velocityX != 1) {
        velocityX = -1
        velocityY = 0
    }
    else if (e.code == "ArrowRight" && velocityX != -1) {
        velocityX = 1
        velocityY = 0
    }

}

function update() {
    if (gameOver) {
        bgm.pause()
        return
    }
    document.getElementById("score").innerHTML = "Score: " + score
    context.shadowColor = "rgba(0,0,0,0.3)";
    context.fillStyle = "black"

    context.fillRect(0, 0, board.width, board.height)
    context.fillStyle = "red"
    context.fillRect(foodX, foodY, blockSize, blockSize)
    if (snakeX == foodX && snakeY == foodY) {
        eatSound.play()
        snakeBody.push([foodX, foodY])

        score = score + 10
        placeFood()
    }

    for (let i = snakeBody.length - 1; i > 0; i--) {
        snakeBody[i] = snakeBody[i - 1]
    }
    if (snakeBody.length) {
        snakeBody[0] = [snakeX, snakeY]
    }


    context.fillStyle = "lime"
    snakeX += velocityX * blockSize
    snakeY += velocityY * blockSize
    context.fillRect(snakeX, snakeY, blockSize, blockSize)

    for (let i = 0; i < snakeBody.length; i++) {
        context.fillRect(snakeBody[i][0], snakeBody[i][1], blockSize, blockSize)
    }
    if (snakeX < 0 || snakeX >= board.width || snakeY < 0 || snakeY >= board.height) {
        gameOverAction()
    }
    for (let i = 0; i < snakeBody.length; i++) {
        if (snakeX == snakeBody[i][0] && snakeY == snakeBody[i][1]) {
            gameOverAction()
        }
    }

}

function gameOverAction() {
    gameOver = true
    bgm.pause()
    bgm.currentTime = 0
    hitSound.play()
    context.fillStyle = "white";
    context.font = "48px sans-serif";
    context.fillText("Game Over", 5 * blockSize, 5 * blockSize)
    //alert("Game Over , Your score is " + score)
}
function placeFood() {
    foodX = Math.floor(Math.random() * cols) * blockSize
    foodY = Math.floor(Math.random() * rows) * blockSize
    console.log(foodX,)
}
function restart() {
    window.location.reload()
}
//board
let board
let boardWidth = window.innerWidth
let boardHeight = window.innerHeight
let context
console.log(window.innerWidth, window.innerHeight)
// bird
let birdWidth = 34
let birdHeight = 24
let birdX = boardWidth / 8
let birdY = boardHeight / 2
// let birdImg
let birdImgs = []
let birdImgsIndex = 0

const bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
}


//pipes
let pipeArray = []
let pipeWidth = 64    //1/8
let pipeHeight = 512
let pipeX = boardWidth
let pipeY = 0

let topPipeImg;
let bottomPipeImg;


//physics
let velocityX = -20 // pipes moving
let velocityY = 0 //bird moving
let gravity = 0.4
let rotate = 2

let score = 0
let gameOver = false

//sound
const wingSound = new Audio("assets/sound/sfx_wing.wav")
const hitSound = new Audio("assets/sound/sfx_hit.wav")
const bgm = new Audio("assets/sound/bgm.mp4")
const pointSound = new Audio("assets/sound/sfx_point.wav")
const soundDie = new Audio("assets/sound/sfx_die.wav")
let angle = 0
bgm.loop = true

//sound

window.onload = function () {
    board = document.getElementById('board')
    board.height = boardHeight
    board.width = boardWidth
    context = board.getContext('2d') //used for drawing on the board
    // bgm.play()
    //draw the bird
    // context.fillStyle = 'red'
    // context.fillRect(bird.x, bird.y, bird.width, bird.height)
    for (let i = 0; i < 4; i++) {
        let birdImg = new Image()
        birdImg.src = `assets/images/flappybird${i}.png`
        birdImgs.push(birdImg)
    }
    //loadImage
    // birdImg = new Image()
    // birdImg.src = "./flappybird.png"
    // birdImg.onload = function () {
    //     context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height)
    // }

    topPipeImg = new Image()
    topPipeImg.src = "assets/images/toppipe.png"

    bottomPipeImg = new Image()
    bottomPipeImg.src = "assets/images/bottompipe.png"

    requestAnimationFrame(update)
    setInterval(placePipes, 600) //every 1.5
    setInterval(animateBird, 100)
    this.document.addEventListener('keydown', moveBird)
    this.document.addEventListener('click', moveBirdClick)
}
function animateBird() {
    birdImgsIndex++
    birdImgsIndex %= birdImgs.length
}

async function update() {
    requestAnimationFrame(update)
    if (gameOver) {
        return;
    }
    context.clearRect(0, 0, board.width, board.height)

    //bird
    velocityY += gravity
    bird.y = Math.max(bird.y + velocityY, 0)

    // context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height)
    context.drawImage(birdImgs[birdImgsIndex], bird.x, bird.y, bird.width, bird.height)
    //0 1 2 3
    // angle += 0.02;

    if (bird.y > board.height) {

        gameOver = true
        soundDie.play()
    }


    //pipes
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i]
        pipe.x += velocityX
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height)

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5
            pipe.passed = true
            pointSound.play()
        }

        if (checkCollision(bird, pipe)) {
            await hitSound.play()


            gameOver = true
            bgm.currentTime = 0
        }
    }

    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift()
    }

    //score 
    context.fillStyle = "white";
    context.font = "32px sans-serif";
    context.fillText(score, 5, 45)

    if (gameOver) {
        bgm.pause()
        let highScore = localStorage.getItem("flappyBirdScore")
        if (score > parseInt(highScore || 0)) {
            localStorage.setItem("flappyBirdScore", score)
            highScore = score
        }
        context.fillText("Your High score is " + highScore || 0, 5, 100)
        context.fillText("Game Over", 5, 155)

    }

}

function placePipes() {

    if (gameOver) {
        return;
    }

    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2)
    let openingSpace = board.height / 4

    let topPipe = {
        img: topPipeImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }
    pipeArray.push(topPipe)

    let bottomPipe = {
        img: bottomPipeImg,
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }
    pipeArray.push(bottomPipe)
}

function moveBird(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyX') {
        moveBirdAction()
    }
    else if (e.code === 'ArrowDown') {
        moveBirdDown()
    }
}
function moveBirdDown() {
    velocityY = +5
}
function moveBirdClick() {
    moveBirdAction()
}

function moveBirdAction() {
    wingSound.play()
    if (bgm.paused) {
        bgm.play()
    }
    velocityY = -8
    if (gameOver) {
        bird.y = birdY
        pipeArray = []
        score = 0
        gameOver = false
    }
}
function checkCollision(a, b) {
    return a.x < b.x + b.width
        &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y


}
let boardWidth = window.innerWidth
let boardHeight = 720;
let context;
let velocityX = 0

//hiu
let sharkArray = []
let sharkImg
let sharkImgs = []
let sharkImgsIndex = 0;

let sharkWidth = 200;
let sharkHeight = 100;


let sharkX = boardWidth - 200;
let sharkY = 20
let posTextX = 200
let posTextY = 60
let textbox;
let score = 0;
let nyawa = 5;
let highScore = 0
let gameOver = false;
let addInterval = 6000
if (isMobile()) {
    sharkWidth = 100;
    sharkHeight = 50;
    posTextX = 100
    posTextY = 30
    boardHeight = 320
    // sharkX = boardWidth - 300
}
//sound system
const pointSound = new Audio("assets/sfx_point.wav");
const wrongSound = new Audio("assets/sfx_die.wav");
const bgm = new Audio("assets/bgm.mp4");
bgm.loop = true;

window.onload = function () {
    let board = document.getElementById("board");
    textbox = document.getElementById("inputBox");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d");
    highScore = parseInt(this.localStorage.getItem("highScoreTyping")) || 0;
    for (let i = 1; i <= 7; i++) {
        let img = new Image();
        img.src = `assets/shark${i}.png`;
        sharkImgs.push(img);
    }

    document.addEventListener("keydown", ketik);
    // drawShark();
}

function update() {
    if (gameOver) {
        return;
    }
    context.clearRect(0, 0, boardWidth, boardHeight);
    requestAnimationFrame(update); //update the game

    //draw Shark every 100 frames
    for (let i = 0; i < sharkArray.length; i++) {
        let shark = sharkArray[i];
        shark.x += velocityX;
        context.drawImage(sharkImgs[sharkImgsIndex], shark.x, shark.y, sharkWidth, sharkHeight);
        context.font = "30px Arial black";
        context.fillStyle = "white";
        context.fillText(shark.text, shark.x + posTextX, shark.y + posTextY);
    }

    //remove shark if it goes out of the board
    while (sharkArray.length > 0 && sharkArray[0].x < -sharkWidth) {
        sharkArray.shift();
        nyawa -= 1;
        console.log("Nyawa: " + nyawa);
        wrongSound.play();
    }

    if (nyawa <= 0) {
        bgm.pause();
        gameOver = true;
        if (score > highScore) {
            localStorage.setItem("highScoreTyping", score);
        }
        if (score < 100) {
            alert("Game Over! You Are Junior Software Engineer");
        }
        else if (score >= 100 && score < 500) {
            alert("Game Over! You Are Middle Software Engineer");
        }
        else if (score >= 500 && score < 1000) {
            alert("Game Over! You Are Senior Software Engineer");
        }
        else {
            alert("Game Over! You Are Master of Software Engineer");
        }
        document.getElementById("restart").hidden = false

    }

    document.getElementById("typeData").innerText = sharkArray.length > 0 ? sharkArray[0].text : "";


    //draw score
    context.font = "30px Arial black";
    context.fillStyle = "white";
    context.fillText("Score: " + score, 20, 50);
    context.fillText("High Score: " + highScore, 20, 130);
    context.fillText("Nyawa: " + nyawa, 20, 90);
}
function drawShark() {
    let randomY = Math.floor(Math.random() * (boardHeight - sharkHeight));
    let newShark = {
        img: sharkImg,
        x: sharkX,
        y: randomY,
        passed: false,
        text: syntacs[Math.floor(Math.random() * syntacs.length)]
    }
    sharkArray.push(newShark);
    console.log(sharkArray);
}
function restart() {
    window.location.reload();
}


function ketik(e) {
    // console.log(e.code);
    if (bgm.paused) {
        bgm.play()
    }
    if (e.code === "Enter") {
        console.log(textbox.value);
        for (let i = 0; i < sharkArray.length; i++) {
            if (sharkArray.length > 0 && textbox.value === sharkArray[i].text) {
                score += 10;
                console.log("Score: " + score);
                sharkArray.splice(i, 1);
                textbox.value = "";
                document.getElementById("inputBox").style.backgroundColor = "green";
                pointSound.play();
                setTimeout(() => {
                    document.getElementById("inputBox").style.backgroundColor = "white";
                }, 500);
            } else {
                console.log("Typo")

                document.getElementById("inputBox").style.backgroundColor = "red";
                setTimeout(() => {
                    document.getElementById("inputBox").style.backgroundColor = "white";
                }, 500);
            }
        }

    }
}
function changeAnimationShark() {
    sharkImgsIndex++
    sharkImgsIndex %= sharkImgs.length;
}
function start() {
    let input = document.getElementById("inputBox")
    let enter = document.getElementById("enter")
    enter.hidden = false
    const level = document.getElementById("level").value
    velocityX = velocityX - parseInt(level)
    addInterval = addInterval + (velocityX * 350)
    console.log("Add interval " + addInterval)
    document.getElementById("levelCard").hidden = true
    input.hidden = false
    input.focus()
    bgm.play()
    document.getElementById("start").hidden = true
    drawShark();
    this.setInterval(drawShark, addInterval);
    this.setInterval(changeAnimationShark, 60);
    requestAnimationFrame(update);

}
function enter() {
    const enterEvent = new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true
    });

    document.dispatchEvent(enterEvent);
}
function isMobile() {
    return window.innerWidth <= 768;
}
const syntacs = [
    `let a`,
    `const b`,
    `class person {}`,
    `setTimeout()`,
    `setInterval()`,
    `for(i=0;i<5;i++){}`,
    `while(cond){}`,
    `do{}while(cond)`,
    `function hello(){}`,
    `slice()`,
    `var c`,
    `break;`,
    `continue`,
    `str.length`,
    `String trim()`,
    `console.log()`,
    `str.indexOf()`,
    `Math.random()`,
    `Math.floor()`,
    `Math.ceil()`,
    `Math.round()`,
    `Math.sqrt()`,
    `Math.pow()`,
    `Math.abs()`,
    `Math.max()`,
    `Math.min()`,
    `Math.sin()`,
    `Math.cos()`,
    `Math.tan()`,
    `Math.asin()`,
    `Math.acos()`,
    `Math.atan()`,
    `Math.atan2()`,
    `Math.log()`,
    `Math.exp()`,
    `Math.LN2`,
    `new Date()`,
    `getDate()`,
    `getDay()`,
    `getFullYear()`,
    `getHours()`,
    `getMilliseconds()`,
    `getMinutes()`,
    `getMonth()`,
    `getSeconds()`,
    `getTime()`,
    `eval()`,
    `String()`,
    `toString()`,
    `parseInt()`,
    `parseFloat()`,
    `isNaN()`,
    `isFinite()`,
    `Number()`,
    `Boolean()`,
    `Array()`,
    `array.toString()`,
    `array.join()`,
    `array.push()`,
    `array.pop()`,
    `array.shift()`,
    `array.unshift()`,
    `array.slice()`,
    `array.splice()`,
    `array.reverse()`,
    `array.sort()`,
    `array.concat()`,
    `array.indexOf()`,
    `array.lastIndexOf()`,
    `array.forEach()`,




]
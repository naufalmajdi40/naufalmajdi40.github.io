class Game {
    constructor() {
        this.sharkArray = []
        this.sharkImg = ""
        this.boardWidth = window.innerWidth
        this.boardHeight = 720

        //inputan
        this.input = document.getElementById("inputBox")
        this.enter = document.getElementById("enter")
        // this.enter.hidden = true
        this.level = window.document.getElementById("level")
        this.velocityX = 0

    }
    start() {
        console.log("game start", this.level)
        this.velocityX = this.velocityX - parseInt(this.level)
        this.enter.hidden = false
        this.drawShark();
        requestAnimationFrame(this.update);
    }
    drawShark = () => {
        // this.sharkImg = new Shark()
        this.sharkArray.push(new Shark())
        console.log(this.sharkArray)
    }
    update = () => {
        requestAnimationFrame(this.update)
        for (let i = 0; i < this.sharkArray.length; i++) {
            let shark = sharkArray[i];
            shark.x += velocityX;
            context.drawImage(sharkImgs[sharkImgsIndex], shark.x, shark.y, sharkWidth, sharkHeight);
            context.font = "30px Arial black";
            context.fillStyle = "white";
            context.fillText(shark.text, shark.x + posTextX, shark.y + posTextY);
        }
        //console.log("update")
    }
    // update() {
    //     requestAnimationFrame(this.update())
    //     console.log("update")
    // }
}

class Shark {
    constructor() {
        this.x = window.innerWidth - 400
        this.y = 20
        this.width = 200
        this.Height = 100

    }
}
let game = null
window.onload = () => {
    game = new Game()
    //game.start()

}
function start() {
    game.start()
}
// function start() {
//     const level = document.getElementById("level")
//     game.start(level)
// }
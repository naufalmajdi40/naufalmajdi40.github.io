
class Game {
    constructor() {
        this.board = document.getElementById("board");

        this.ctx = this.board.getContext("2d");
        this.scoreBoard = document.getElementById("score")
        this.boardW = window.innerHeight / 2
        this.boardH = window.innerHeight;
        if (!this.isMobile) {
            this.boardW = window.innerWidth;
        }
        this.board.width = this.boardW;
        this.board.height = this.boardH;
        this.started = false;
        this.mouse = { x: 200, y: this.boardH / 2 };
        this.gameOver = false;

        this.playerImg = new Image();
        this.coinImg = new Image();
        this.playerImg.src = "player.svg";
        this.coinImg.src = "coin.png";

        this.bgImg = new Image();
        this.bgImg.src = "assets/images/bg/sea.jpg";

        this.player = new Player(this.playerImg, this.boardH);
        this.sharks = [];
        this.coins = [];
        this.score = 0;

        this.bgm = new Audio();
        this.bgm.src = "assets/bgm/bgm.mp3";
        this.bgm.loop = true;
        this.bgm.volume = 0.1;

        this.eatSound = new Audio();
        this.eatSound.src = "assets/sounds/eat.mp3";

        this.sfxCount = new Audio();
        this.sfxCount.src = "assets/sounds/sfx_point.wav";

        // this.ctx.fillStyle = "blue";
        // this.ctx.fillRect(0, 0, this.boardW, this.boardH);
        // this.ctx.clearRect(0, 0, this.boardW, this.boardH);
        // this.ctx.drawImage(this.bgImg, 0, 0, this.boardW, this.boardH);
        this.draw();
        this.initEvent();

    }
    initEvent() {
        this.board.addEventListener("mousemove", e => this.onMouse(e));
        this.board.addEventListener("touchstart", (e) => { this.onTouch(e), { passive: false }; this.start(); });
        this.board.addEventListener("touchmove", e => this.onTouch(e), { passive: false });
        this.board.addEventListener("click", e => this.start());
    }

    onMouse(e) {
        const r = this.board.getBoundingClientRect();
        this.mouse.x = e.clientX - r.left;
        this.mouse.y = e.clientY - r.top;
    }

    onTouch(e) {
        e.preventDefault();
        const r = this.board.getBoundingClientRect();
        const t = e.touches[0];
        this.mouse.x = t.clientX - r.left;
        this.mouse.y = t.clientY - r.top;
    }
    setScore(score) {
        // this.scoreBoard.value(`SCORE: ${score}`)
        console.log(this.scoreBoard)
        this.scoreBoard.innerHTML = `SCORE: ${score}`
    }
    spawnShark() {
        // this.sharks.push(new Shark(this.boardW, this.boardH, this.sharkImg));
        this.sharks.push(new Shark(this.boardW, this.boardH));
    }

    spawnCoin() {
        this.coins.push(new Coin(this.boardW, this.boardH, this.coinImg));
    }

    update() {
        this.player.update(this.mouse.x, this.mouse.y);

        this.sharks.forEach(s => s.update());
        this.coins.forEach(c => c.update());

        // cleanup offscreen
        this.sharks = this.sharks.filter(s => s.x + s.width > 100);
        this.coins = this.coins.filter(c => c.x + c.width > 0);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.boardW, this.boardH);

        // this.ctx.fillStyle = "blue";
        // this.ctx.fillRect(0, 0, this.boardW, this.boardH);

        this.ctx.drawImage(this.bgImg, 0, 0, this.boardW, this.boardH);


        this.sharks.forEach(
            (shark, i) => {
                const playerY = this.player.y + (this.player.height / 2)
                // this.ctx.fillText("+", (this.player.x + (this.player.width)), playerY)
                this.ctx.fillStyle = "white";
                // this.ctx.fillText("-", shark.x, shark.y + shark.height / 3)
                // this.ctx.fillText("-", shark.x, shark.y + shark.height / 1.2)
                if (
                    (this.player.x >= shark.x - 90) &&
                    (this.player.x <= shark.x + shark.width / 2) &&
                    playerY > (shark.y + shark.height / 3) &&
                    playerY < (shark.y + shark.height / 1.2)) {
                    this.gameOver = true
                    // this.player.clearRect(0, 0, this.player.width, this.player.height);
                }
                shark.draw(this.ctx);

            }
        );
        this.coins.forEach(
            (coin, i) => {
                const playerY = this.player.y + (this.player.height / 2)
                if ((this.player.x + (this.player.width)) >= coin.x &&
                    playerY > (coin.y + (coin.height / 3)) &&
                    playerY < (coin.y + coin.height / 1.2)) {
                    this.sfxCount.play()
                    this.score += 1
                    this.setScore(this.score)
                    this.coins.splice(i, 1)

                }
                coin.draw(this.ctx);
            }
        );
        if (!this.gameOver) {
            this.player.draw(this.ctx);

        }
    }

    loop() {
        if (this.gameOver) {
            this.bgm.pause()
            this.eatSound.play()
            return
        }
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    start() {
        // if (this.started) return;
        // if (this.bgm.paused) {
        if (this.gameOver) {
            // this.started = false
            console.log("restart")
            this.gameOver = false
            this.eatSound.pause()
            this.score = 0
            this.setScore(this.score)
            this.sharks = []
            this.coins = []
            this.bgm.play();
            this.bgm.currentTime = 0
            this.loop();
        }
        if (!this.started) {
            this.bgm.play();

            this.started = true;
            this.bgm.currentTime = 0
            this.started = true;

            setInterval(() => this.spawnShark(), 500);
            setInterval(() => this.spawnCoin(), 1500);
            setInterval(() => this.animate(), 1000 / 12);
            this.loop();
        }



    }
    animate() {
        this.sharks.forEach(shark => shark.animate());
    }
    isMobile() {
        return window.innerWidth <= 768;
    }
}
window.onload = () => new Game();
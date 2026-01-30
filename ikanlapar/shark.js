class Shark {
    constructor(boardW, boardH) {
        this.x = boardW;
        this.y = Math.random() * (boardH - 100);
        this.width = 200;
        this.height = 100;
        this.speed = -10;
        // this.img = img;
        this.imgs = []
        this.totalImg = 7
        this.indexImg = 0
        for (let i = 0; i < this.totalImg; i++) {
            this.imgs.push(new Image())
            this.imgs[i].src = `assets/images/shark/shark${i}.png`
        }
    }

    update() {
        this.x += this.speed;
    }

    draw(ctx) {
        ctx.drawImage(this.imgs[this.indexImg], this.x, this.y, this.width, this.height);
    }
    animate() {
        if (this.indexImg >= this.totalImg - 1) {
            this.indexImg = 0
        } else {
            this.indexImg++
        }
    }
}


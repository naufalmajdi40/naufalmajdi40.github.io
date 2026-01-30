class Coin {
    constructor(boardW, boardH, img) {
        this.x = boardW;
        this.y = Math.random() * (boardH - 50);
        this.width = 50;
        this.height = 40;
        this.speed = -10;
        this.img = img;
    }

    update() {
        this.x += this.speed;
    }

    draw(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
}
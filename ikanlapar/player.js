
class Player {
    constructor(img, boardH) {
        this.x = 0;
        this.y = boardH / 2;
        this.width = 100;
        this.height = 80;
        this.img = img;
    }

    update(targetX, targetY) {
        this.y += (targetY - this.y) * 0.2;
        this.x += (targetX - this.x) * 0.2;
    }

    draw(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
}
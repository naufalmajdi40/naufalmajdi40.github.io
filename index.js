const game = [
    {
        title: "Typing JS Game (PC Only)",
        desc: "Test your typing skills and Javascript skill with this simple game",
        icon: "assets/typingjs.png",
        link: "typingjs/index.html"
    },
    {
        title: "Flappy Bird",
        desc: "Game Flappy bird Clone",
        icon: "assets/flappybird.png",
        link: "fastflappybird/index.html"
    },
    {
        title: "Snake",
        desc: "game snake clone",
        icon: "assets/snake.png",
        link: "snake/index.html"
    },
]
window.onload = () => {
    let gameList = document.getElementById("card-container");
    game.forEach((item) => {
        gameList.innerHTML += `
            <div class="card-cartoon">
                <img src="${item.icon}" class="card-img" alt="Typing Game JS">
                <div class="card-body">
                    <h4>${item.title}</h4>
                    <p>${item.desc}</p>
                    <a href="${item.link}" class="btn-cartoon">▶ PLAY</a>
                </div>
            </div>

      `
    })
}
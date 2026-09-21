const game = [
    {
        title: "Eat or Be Eaten",
        desc: "Game Makan atau dimakan. tentukan pilihanmu",
        icon: "assets/ikanlapar.png",
        link: "ikanlapar/index.html"
    },
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
const software = [
    {
        title: "GLB Viewer",
        desc: "Sofware untuk Melihat file 3D GLB",
        icon: "assets/glbviewer.png",
        link: "glbviewer/index.html"
    },
    {
        title: "Asyik Editor",
        desc: "Sofware untuk konten visual dengan mudah dan cepat",
        icon: "assets/asyikeditor.png",
        link: "asyikeditor/index.html"
    }
]
window.onload = () => {
    let gameList = document.getElementById("card-container");
    let softwareList = document.getElementById("card-container2");

    game.forEach((item) => {
        gameList.innerHTML += `
            <div class="project-card">
                <div class="card-img-wrapper">
                    <img class="card-img" src="${item.icon}" alt="${item.title}">
                </div>
                <div class="card-content">
                    <span class="card-tags">Arcade</span>
                        <h4 class="card-title">${item.title}</h4>
                        <p class="card-desc">${item.desc}</p>
                <a href="${item.link}" class="card-link">Mainkan Sekarang <span>&rarr;</span></a>
                </div>
            </div>
    `
    })
    software.forEach((item) => {
        softwareList.innerHTML += `
            <div class="project-card">
                <div class="card-img-wrapper">
                    <img class="card-img" src="${item.icon}" alt="${item.title}">
                </div>
                <div class="card-content">
                    <span class="card-tags">Arcade</span>
                        <h4 class="card-title">${item.title}</h4>
                        <p class="card-desc">${item.desc}</p>
                <a href="${item.link}" class="card-link">Run <span>&rarr;</span></a>
                </div>
            </div>
    `
    })
}

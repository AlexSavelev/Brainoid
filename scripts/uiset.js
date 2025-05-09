export default function getFullUISet() {
  return {
    canvas: document.getElementById('game-canvas'),

    loader: document.getElementById('loader'),
    loaderCurrentBar: document.getElementById('load-progress-current'),
    btnLoaderStart: document.getElementById('btn-loader-start'),

    mainMenu: document.getElementById('main-menu'),
    btnSelectLevel: document.getElementById('btn-select-level'),
    btnLeaderboard: document.getElementById('btn-leaderboard'),
    btnAbout: document.getElementById('btn-about'),

    about: document.getElementById('about'),
    btnAboutBack: document.getElementById('btn-about-back'),

    leaderboard: document.getElementById('leaderboard-screen'),
    leaderboardContainer: document.getElementById('leaderboard-container'),
    btnLeaderboardBack: document.getElementById('btn-leaderboard-back'),

    selectLevel: document.getElementById('select-level'),
    levelList: document.getElementById('level-list'),
    btnSelectBack: document.getElementById('btn-select-back'),

    hud: document.getElementById('hud'),
    counterTime: document.getElementById('gcnt__time'),
    counterLife: document.getElementById('gcnt__life'),
    counterCoins: document.getElementById('gcnt__coins'),
    counterBoosters: document.getElementById('gcnt__boosters'),

    gameOver: document.getElementById('game-over-screen'),
    btnGameOverBack: document.getElementById('btn-game-over-back'),

    victory: document.getElementById('victory-screen'),
    victoryCounterTime: document.getElementById('vicscreen__time'),
    btnVictorySave: document.getElementById('btn-victory-save'),
    btnVictoryBack: document.getElementById('btn-victory-back')
  };
}

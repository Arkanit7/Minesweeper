"use strict";

class SoundController {
  constructor() {
    this.boomSound = new Audio("./sounds/boom.wav");
    this.boomSound.volume = 1;
    this.bgMusic = new Audio("./sounds/main.mp3");
    this.bgMusic.volume = 0.1;
    this.bgMusic.loop = true;
  }
  startMusic() {
    this.bgMusic.play();
  }
  stopMusic() {
    this.bgMusic.pause();
    this.bgMusic.currentTime = 0;
  }
  boom() {
    this.boomSound.play();
  }
}

class Minesweeper {
  constructor(dev) {
    this.development = dev ? true : false;
    this.sound = new SoundController();
    this.nodeField = document.querySelector(".game__board");
    this.modeButtonNode = document.querySelector(".mode__btn");
    this.minesCountNode = document.querySelector(".mines-count .count");
    this.difficultyNode = document.querySelector(".diff");
    this.difficultyBtnNodes = document.querySelectorAll("[data-difficulty]");
    this.minesCountNode = document.querySelector(".mines-count__count");
    this.victoryNode = document.querySelector(".victory-screen");
    this.restartBtn = document.querySelector("[data-restart]");
    this.listenToModeSwitcher();
    this.listenToDifficultyBtns();
    this.listenToRestartBtn();

    this.development && console.log(`[dev] Initialized.`);
  }

  listenToModeSwitcher() {
    this.mode = "mines";
    this.modeButtonNode.addEventListener("click", () => {
      this.mode = this.mode === "mines" ? "flags" : "mines";
      this.modeButtonNode.classList.toggle("_flag");

      this.development && console.log(`[dev] Mode switched: ${this.mode}!`);
    });
  }

  newGame() {
    this.clearAll();
    this.toggleDifficultyWindow();
  }

  startGame() {
		this.sound.startMusic();

    this.toggleDifficultyWindow();
    this.generateField();
    this.generateVirtualField();
    //listen to all tiles and reveal them + reveal all bounded empty tiles
    //win or lose the game
    //show win/lose screen and ask for restart
  }

  toggleDifficultyWindow() {
    this.difficultyNode.classList.toggle("hidden");
  }

  listenToDifficultyBtns() {
    this.difficultyBtnNodes.forEach((btn) => {
      btn.addEventListener("click", ({ target }) => {
        this.difficulty = target.dataset.difficulty;

        this.development &&
          console.log(`[dev] Difficulty switched: ${this.difficulty}!`);

        this.startGame();
      });
    });
  }

  listenToRestartBtn() {
    this.restartBtn.addEventListener("click", () => {
      this.toggleVictoryScreen();
      this.newGame();
    });
  }

  clearAll() {
    this.nodeField.innerHTML = null; // or ""
    this.mines = 0;
    this.playerMines = 0;
    this.updateMinesView();
  }

  generateField() {
    switch (this.difficulty) {
      case "easy":
        this.size = { rows: 8, cols: 6 };
        break;
      case "normal":
        this.size = { rows: 10, cols: 8 };
        break;
      case "hard":
        this.size = { rows: 12, cols: 10 };
        break;
      default:
        this.size = { rows: 8, cols: 6 };
    }
    this.nodeField.style.gridTemplateRows = `repeat(${this.size.rows}, 3rem)`;
    this.nodeField.style.gridTemplateColumns = `repeat(${this.size.cols}, 3rem)`;

    for (let i = 0; i < this.size.rows * this.size.cols; i++) {
      const tile = document.createElement("button");
      tile.classList.add("game__tile");
      this.nodeField.appendChild(tile);
      tile.addEventListener("click", () => {
        this.revealTile(i);
      });
    }

    this.tileNodes = document.querySelectorAll(".game__tile");

    this.development &&
      console.log(`[dev] Generated ${this.size.rows * this.size.cols} tiles!`);
  }

  generateVirtualField() {
    this.virtualField = new Array(this.size.rows * this.size.cols).fill(null);
    this.placeMinesRandomly(this.size.rows + 4);
  }

  placeMinesRandomly(minesCount) {
    const placeIt = () => {
      const randomNum = Math.floor(
        Math.random() * this.size.rows * this.size.cols
      );
      if (this.virtualField[randomNum] === true) {
        placeIt();
        return;
      }
      this.virtualField[randomNum] = true;

      this.development && console.log(`Dropped a mine tile #${randomNum}.`);
    };
    for (let i = 0; i < minesCount; i++) {
      placeIt();
    }
    this.mines = minesCount;
    this.playerMines = minesCount;
    this.updateMinesView();
  }

  revealTile(tileNum) {
    const selectedTile = this.tileNodes[tileNum];
    const tileValue = this.virtualField[tileNum];
    const checkTile = (row, col) => {
      if (row >= this.size.rows || row < 0) return;
      if (col >= this.size.cols || col < 0) return;

      const chekingTileNum = this.convertToOneDim(row, col);
      const checkingTileValue = this.virtualField[chekingTileNum];

      if (checkingTileValue === true) return true;
      return false;
    };
    const countAttachedMines = (tileNum) => {
      let minesCount = 0;
      const [row, col] = this.convertToTwoDim(tileNum);
      for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
          if (i === 0 && j == 0) continue;
          if (checkTile(row + i, col + j)) minesCount++;
        }
      }
      return minesCount;
    };

    if (selectedTile.classList.contains("_revealed")) return;
    switch (this.mode) {
      case "mines":
        if (selectedTile.classList.contains("_flagged")) return;
        selectedTile.classList.add("_revealed");
        if (tileValue === true) {
          selectedTile.classList.add("_exploded");
          this.mines--;
          this.playerMines--;
          this.updateMinesView();
					this.sound.boom();
        } else {
          const nearbyMines = countAttachedMines(tileNum);
          if (nearbyMines > 0) {
            selectedTile.classList.add(`_${nearbyMines}`);
            selectedTile.innerText = nearbyMines;
          } else {
            //reveal all nearby tiles
            const [row, col] = this.convertToTwoDim(tileNum);
            for (let i = -1; i < 2; i++) {
              for (let j = -1; j < 2; j++) {
                if (i === 0 && j == 0) continue;
                if (row + i >= this.size.rows || row + i < 0) continue;
                if (col + j >= this.size.cols || col + j < 0) continue;
                const num = this.convertToOneDim(row + i, col + j);
                this.revealTile(num);
              }
            }
          }
        }

        this.development && console.log(`[dev] Revealed #${tileNum} tile.`);
        break;
      case "flags":
        if (selectedTile.classList.contains("_flagged")) {
          this.playerMines++;
          this.updateMinesView();
          if (tileValue === true) {
            this.mines++;
            this.updateMinesView();
          }
        } else {
          this.playerMines--;
          this.updateMinesView();
          if (tileValue === true) {
            this.mines--;
            this.updateMinesView();
          }
        }
        selectedTile.classList.toggle("_flagged");
    }
    this.checkForWin();
  }

  updateMinesView() {
    this.minesCountNode.innerText = this.playerMines;
  }

  checkForWin() {
    if (this.playerMines !== this.mines) return;
    if (this.mines !== 0) return;
		this.sound.stopMusic();
    this.toggleVictoryScreen();
  }

  toggleVictoryScreen() {
    this.victoryNode.classList.toggle("hidden");
  }

  convertToTwoDim(tileNum) {
    const row = Math.floor(tileNum / this.size.cols);
    const col = tileNum - row * this.size.cols;

    return [row, col];
  }
  convertToOneDim(row, col) {
    this.development &&
      console.log(
        `Converted tile #[${row},${col} to #${row * this.size.cols + col}]`
      );
    return row * this.size.cols + col;
  }
}

const game = new Minesweeper(true);
game.newGame();

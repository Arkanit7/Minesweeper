"use strict";
const nodeField = document.querySelector(".game__board");
const modeSwitchNode = document.querySelector(".mode");
const minesCountNode = document.querySelector(".mines-count");

class Minesweeper {
  constructor(dificulty) {
    this.dificulty = dificulty;
    this.dimensions = this.calculateSize();
    this.nodeField = nodeField;
    this.mode = "mines" || "flags";
  }

  calculateSize() {
    if (isNaN(this.dificulty)) {
      switch (this.dificulty) {
        case "easy":
          return [6, 4];
        case "nornal":
          return [8, 6];
        case "hard":
          return [12, 10];
        default:
          return [8, 6];
      }
    }
    return [Math.floor(this.dificulty * 1.2), this.dificulty];
  }

  startGame() {
    this.createModeSwitch();
    this.clearFiled();
    this.createPleceholderField();
    this.byClickGenerateField();
    this.listenToAllTiels();
  }

  createModeSwitch() {
    modeSwitchNode.addEventListener("click", () => {
      this.mode = this.mode === "flags" ? "mines" : "flags";
    });
  }

  clearFiled() {
    this.nodeField.innerHTML = "";
  }

  createPleceholderField() {
    this.setProperCss();

    const size = this.dimensions.reduce((total, value) => total * value);
    for (let i = 0; i < size; i++) {
      const tile = document.createElement("button");
      tile.classList.add("game__tile");
      tile.dataset.tileNumber = i;
      this.nodeField.appendChild(tile);
    }
  }

  setProperCss() {
    this.nodeField.style.gridTemplateColumns = `repeat(${this.dimensions[1]},3rem)`;
    this.nodeField.style.gridTemplateRows = `repeat(${this.dimensions[0]},3rem)`;
  }

  byClickGenerateField() {
    const generateField = () => {
      this.generateField();
      this.nodeField.removeEventListener("click", generateField);
    };
    this.nodeField.addEventListener("click", generateField);
  }

  changeAndShowPlayerMines(number) {
    this.playerMines = number;
    minesCountNode.innerText = this.playerMines;
  }

  generateField() {
    const straightVirtualField = [
      ...new Array(this.dimensions[0]).fill(true),
      ...new Array(this.dimensions[0] * (this.dimensions[1] - 1)).fill(null),
    ];

    this.totalMines = this.dimensions[0];
    this.changeAndShowPlayerMines(this.totalMines);

    for (let i = straightVirtualField.length - 1; i > 0; i--) {
      const j = Math.round(Math.random() * i);
      [straightVirtualField[i], straightVirtualField[j]] = [
        straightVirtualField[j],
        straightVirtualField[i],
      ];
    }

    const convertFieldtoMatrix = (array) => {
      let converted = [];
      for (let i = 0; i < this.dimensions[0]; i++) {
        converted = [
          ...converted,
          array.slice(i * this.dimensions[1], (i + 1) * this.dimensions[1]),
        ];
      }
      return converted;
    };

    const convertMatrixToArray = (matrix) => {
      let converted = [];
      matrix.forEach((array) => (converted = converted.concat(array)));
      return converted;
    };

    this.virtualField = convertFieldtoMatrix(straightVirtualField);
    this.countBombs(this.virtualField);
    this.straightVirtualField = convertMatrixToArray(this.virtualField);
    console.log(this.straightVirtualField);
  }

  countBombs(matrix) {
    matrix.forEach((array, i) =>
      array.forEach((val, j) => this.countBombsByTile(val, i, j))
    );
  }

  countBombsByTile(value, row, col) {
    const more = (col, row) => {
      if (row < 0) return;
      if (row >= this.dimensions[0]) return;
      if (this.virtualField[row][col] === true) return;
      this.virtualField[row][col] += 1;
    };
    const add = (col, row) => {
      if (col < 0) return;
      if (col >= this.dimensions[1]) return;
      more(col, row - 1);
      more(col, row);
      more(col, row + 1);
    };
    if (value !== true) return;
    add(col - 1, row);
    add(col, row);
    add(col + 1, row);
  }

  listenToAllTiels() {
    this.tileNodes = document.querySelectorAll(".game__tile");
    this.tileNodes.forEach((tile) => {
      tile.addEventListener("click", () => {
        this.checkTile(tile.dataset.tileNumber);
      });
    });
  }

  checkTile(number) {
    const value = this.straightVirtualField[number];
    const selectedTile = this.tileNodes[number];

    if (selectedTile.classList.contains("_revealed")) return;
    switch (this.mode) {
      case "mines":
        if (selectedTile.classList.contains("_flagged")) return;
        if (value === true) {
          this.totalMines -= 1;
          this.changeAndShowPlayerMines(this.playerMines - 1);
          selectedTile.classList.add("_exploded");
        }
        if (typeof value === "number") {
          selectedTile.classList.add("_" + value);
          selectedTile.innerText = value;
        }
        selectedTile.classList.add("_revealed");
        break;
      case "flags":
        if (selectedTile.classList.contains("_flagged")) {
          this.changeAndShowPlayerMines(this.playerMines + 1);
          if (value === true) this.totalMines += 1;
        }
        if (!selectedTile.classList.contains("_flagged")) {
          this.changeAndShowPlayerMines(this.playerMines - 1);
          if (value === true) this.totalMines -= 1;
        }
        selectedTile.classList.toggle("_flagged");
    }
    if (this.totalMines === 0 && this.playerMines === 0) this.endGame();
  }
  endGame() {
    //show msg
    this.startGame();
  }
}

const field = new Minesweeper("easy");
field.startGame();

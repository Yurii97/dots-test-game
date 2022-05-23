class GameScene extends Phaser.Scene {
  constructor() {
    super("Game");
  }
  init() {}
  preload() {
    this.load.image("tiles", "assets/sprites/tiles.png");
    this.load.image("arows", "assets/sprites/arrows.png");
  }
  create() {
    this.canPick = true;
    this.dragging = false;
    this.score = 0;
    this.createText();
    this.start();
    this.createScore();
    this.input.on("pointerdown", this.dotSelect, this);
    this.input.on("pointermove", this.drawLine, this);
    this.input.on("pointerup", this.removeDots, this);
  }
  start() {
    this.initPositions();
    this.change = [];
  }
  createText() {
    this.scoreText = this.add.text(50, 80, `Score: `, {
      font: "30px Arial",
    });
  }
  createScore() {
    this.time.addEvent({
      loop: true,
      callback: () => {
        this.scoreText.setText(`Score: ` + this.score);
      },
    });
  }
  createDots(position) {
    const { x, y, delay, value } = position;
    const newDot = new Dot(this, value);
    newDot.init(position);
    newDot.depth = position.delay; //рад відображення z індекс
    newDot.move({
      x,
      y,
      delay,
    });
    return newDot;
  }
  initPositions() {
    this.positionsArray = [];
    const dotTexture = this.textures.get("tiles").getSourceImage();
    const dotWidth = dotTexture.width;
    const dotHeigth = dotTexture.height;
    const offsetX = (config.width - dotWidth * config.cols) / 2 + dotWidth / 2;
    const offsetY =
      (config.height - dotHeigth * config.rows) / 2 + dotHeigth / 2;
    for (let row = 0; row < config.rows; row++) {
      this.positionsArray[row] = []; //масив поля + точки + ліній

      for (let col = 0; col < config.cols; col++) {
        const value = Phaser.Math.Between(0, config.colors.length);

        const position = {
          delay: 300,
          isempty: false,
          value,
          x: offsetX + col * dotWidth,
          y: offsetY + row * dotHeigth,
          row,
          col,
        };
        const arrow = this.add.sprite(position.x, position.y, `arows`); // створює лінії
        arrow.visible = false; // скриває лінії
        this.positionsArray[row][col] = position; // записує в масив дані
        this.positionsArray[row][col].dot = this.createDots(position); // записує в масив точки
        this.positionsArray[row][col].arrow = arrow; // записує в масив лінії
      }
    }
  }
  dotSelect(pointer) {
    const { row, col } = this.currentField(pointer);
    if (this.validPositionField(row, col)) {
      this.canPick = false;
      this.dotInChange(row, col);
      this.dragging = true;
      this.positionsArray[row][col].dot.alpha = 0.5; // ховер-фокус
    }
  }
  currentField(pointer) {
    const dotTexture = this.textures.get("tiles").getSourceImage();
    const dotWidth = dotTexture.width;
    const dotHeigth = dotTexture.height;
    const offsetX = (config.width - dotWidth * config.cols) / 2;
    const offsetY = (config.height - dotHeigth * config.rows) / 2;
    let row = Math.floor((pointer.y - offsetY) / dotHeigth);
    let col = Math.floor((pointer.x - offsetX) / dotWidth);
    return { row, col, dotWidth };
  }
  validPositionField(row, col) {
    return (row >= 0) & (col >= 0) & (row < config.rows) & (col < config.cols);
  }
  dotInChange(row, col) {
    this.change.push({
      row,
      col,
    });
  }
  drawLine(pointer) {
    const { row, col, dotWidth } = this.currentField(pointer);
    if (this.dragging) {
      if (this.validPositionField(row, col)) {
        let distance = Phaser.Math.Distance.Between(
          pointer.x,
          pointer.y,
          this.positionsArray[row][col].x,
          this.positionsArray[row][col].y
        );
        if (distance < dotWidth * 0.4) {
          if (this.correctValue(row, col) && this.correctNextDot(row, col)) {
            //перевіряєм чи коректна крапка та чи є сусідом
            if (!this.anyChange(row, col)) {
              this.hoverDot([{ row, col }], 0.5); // додаємо ховер-фокус
              this.dotInChange(row, col); // добавляємо в масив
              this.moveArrow();
            } else {
              if (this.moveToBack(row, col)) {
                const last = this.change.pop();
                this.hoverDot([last], 1);
                this.hideArrow([{ row, col }]);
              }
            }
          }
        }
      }
    }
  }
  hoverDot(arrey, value) {
    // хвер точки
    arrey.forEach((ar) => {
      const { row, col } = ar;
      this.positionsArray[row][col].dot.alpha = value;
    });
  }
  hideArrow(arrey) {
    // скриваємо лінії
    arrey.forEach((ar) => {
      const { row, col } = ar;
      this.positionsArray[row][col].arrow.angle = 0;
      this.positionsArray[row][col].arrow.setOrigin(0);
      this.positionsArray[row][col].arrow.active = false;
      this.positionsArray[row][col].arrow.visible = false;
    });
  }
  correctValue(row, col) {
    const { value } = this.positionsArray[row][col];
    return value === this.valueChangeArray();
  }
  anyChange(row, col) {
    let value = false;
    this.change.forEach((el) => {
      if (el.row === row && el.col === col) {
        value = true;
      }
    });
    return value;
  }
  valueChangeArray() {
    const { row, col } = this.change[0];
    return this.positionsArray[row][col].value;
  }
  correctNextDot(row2, col2) {
    // чи наступна точка відповідає
    if (this.change.length > 0) {
      const { row, col } = this.change[this.change.length - 1];
      return Math.abs(row2 - row) + Math.abs(col2 - col) == 1;
    }
    return true;
  }
  moveArrow() {
    // малюємо лінії
    if (this.change.length > 0) {
      for (let i = 1; i < this.change.length; i++) {
        const fuildDot = this.change[i];
        const previousDot = this.change[i - 1];
        const arrow =
          this.positionsArray[previousDot.row][previousDot.col].arrow;
        const { value } = this.positionsArray[previousDot.row][previousDot.col];
        arrow.depth = 150;
        arrow.visible = true;
        arrow.tint = config.colors[value];

        if (fuildDot.row === previousDot.row) {
          if (fuildDot.col > previousDot.col) {
            arrow.setOrigin(0, 0.5); //вправо
          } else {
            arrow.setOrigin(1, 0.5); //вліво
          }
        }
        if (fuildDot.col === previousDot.col) {
          if (fuildDot.row > previousDot.row) {
            arrow.angle = 90;
            arrow.setOrigin(0, 0.5); //ввниз
          } else {
            arrow.setOrigin(1, 0.5); //вверх
            arrow.angle = 90;
          }
        }
      }
    }
  }
  moveToBack(row2, col2) {
    // перевіряємо чи хід - назад
    if (this.change.length > 1) {
      const { row, col } = this.change[this.change.length - 2];
      return row === row2 && col === col2;
    }
    return false;
  }
  removeDots() {
    // дія після відпускання кнопки миші
    if (this.dragging) {
      this.dragging = false;
      if (this.change.length < 2) {
        const { row, col } = this.change[0];
        this.hoverDot([{ row, col }], 1);
        this.change = [];
      } else {
        this.hoverDot(this.change, 1);
        this.score += this.change.length;
        const removeDots = [...this.change];
        this.change.pop();
        this.hideArrow(this.change);
        this.refrechPositionArr(removeDots);
        this.change = [];
      }
    }
  }

  refrechPositionArr(arr) {
    // обновляємо масив
    arr.forEach((it) => {
      const { row, col } = it;
      this.positionsArray[row][col].dot.visible = false;
      this.positionsArray[row][col].dot.active = false;
    });
    for (let i = this.positionsArray.length - 1; i >= 0; i--) {
      for (let j = this.positionsArray[i].length - 1; j >= 0; j--) {
        if (!this.positionsArray[i][j].dot.visible) {
          if (i === 0) {
            const value = Phaser.Math.Between(0, config.colors.length);
            this.rewriteDada(i, j, value);
          } else {
            const value = this.returnDodwithCol(i, j);
            this.rewriteDada(i, j, value);
          }
        }
      }
    }
  }
  returnDodwithCol(row, col) {
    // шукаємо збіги по стовпцю та повертаємо значення
    for (let z = row - 1; z >= 0; z--) {
      if (this.positionsArray[z][col].dot.visible) {
        const value = this.positionsArray[z][col].value;
        this.positionsArray[z][col].dot.active = false;
        this.positionsArray[z][col].dot.visible = false;
        return value;
      } else if (z === 0) {
        return Phaser.Math.Between(0, config.colors.length - 1);
      }
    }
  }
  rewriteDada(row, col, value) {
    //перезаписуємо точку - колір
    this.positionsArray[row][col].value = value;
    this.positionsArray[row][col].dot.tint = config.colors[value];
    this.positionsArray[row][col].dot.active = true;
    this.positionsArray[row][col].dot.visible = true;
  }
}

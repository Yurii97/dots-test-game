const config = {
  type: Phaser.AUTO,
  width: 1100,
  height: 550,
  gemSize: 100,
  dots: 6,
  scene: new GameScene(),
  rows: 6,
  cols: 6,
  colors: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff],
};

window.focus();
let game = new Phaser.Game(config);

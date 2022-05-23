class Dot extends Phaser.GameObjects.Sprite {
  constructor(scene, value) {
    super(scene, 0, 0, `tiles`);
    this.scene = scene;
    this.tint = config.colors[value];
    this.scene.add.existing(this);
    this.setInteractive();
    this.opened = false;
  }

  init(position) {
    this.position = position;
    this.setPosition(position, -this.height);
  }
  move(params) {
    this.scene.tweens.add({
      targets: this,
      x: params.x,
      y: params.y,
      delay: params.delay,
      ease: "Linear",
      duration: 300,
    });
  }
}

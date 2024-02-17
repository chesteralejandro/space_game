const Bullet = require("./bullet");

const tiltLeftAngle = -8;
const tiltRightAngle = 8;

class Player {
	constructor(name) {
		this.name = name;
		this.life = 3;
		this.x = 490;
		this.y = 400;
		this.z = 0;
		this.damage = 5;
		this.speed = 30;
		this.score = 0;
		this.leftBullets = [];
		this.rightBullets = [];
		this.bulletSpeed = 2;
	}

	moveUp() {
		this.y -= this.speed;
	}

	moveDown() {
		this.y += this.speed;
	}

	moveLeft() {
		this.x -= this.speed;
		this.z = tiltLeftAngle;
	}

	moveRight() {
		this.x += this.speed;
		this.z = tiltRightAngle;
	}

	tiltForward() {
		this.z = 0;
	}

	addScore(reward) {
		this.score += reward;
	}

	fire() {
		this.leftBullets.push(new Bullet(this.x - 2, this.y - 20));
		this.rightBullets.push(new Bullet(this.x + 18, this.y - 20));
	}

	minusLife() {
		this.life--;
	}
}

module.exports = Player;

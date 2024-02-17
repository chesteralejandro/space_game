const health = {
	drone: 10,
	light: 50,
	heavy: 150,
};

const reward = {
	drone: 5,
	light: 10,
	heavy: 25,
};

const speed = {
	drone: 4,
	light: 3,
	heavy: 1,
};

class Enemy {
	constructor(x, y, type) {
		this.x = x;
		this.y = y;
		this.type = type;
		this.health = health[type];
		this.reward = reward[type];
		this.speed = speed[type];
	}

	moveDown() {
		this.y += this.speed;
	}

	moveLeft() {
		this.x -= 2;
	}

	moveRight() {
		this.x += 2;
	}

	heal() {
		this.health = health[this.type];
	}

	takeHit(damage) {
		this.health -= damage;

		if (this.health <= 0) {
			return this.reward;
		}

		return 0;
	}

	destroy() {
		this.health = 0;
	}

	backToBase(xAxis, yAxis) {
		this.x = xAxis;
		this.y = yAxis;
	}
}

module.exports = Enemy;

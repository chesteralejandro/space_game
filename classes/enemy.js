const health = {
	drone: 10,
	light: 50,
	heavy: 150,
};

const score = {
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
		this.score = score[type];
		this.speed = speed[type];
	}

	heal() {
		this.health = health[this.type];
	}
}

module.exports = Enemy;

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
	}
}

module.exports = Player;

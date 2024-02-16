const path = require("path");
const express = require("express");
const app = express();
const port = 8000;

app.use(express.static(path.join(__dirname, "static")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => res.render("index"));

const server = app.listen(port, () =>
	console.log(`Listening on port ${port}...`)
);
const io = require("socket.io")(server);

class Player {
	constructor(name) {
		this.name = name;
		this.x = 490;
		this.y = 400;
		this.z = 0;
		this.damage = 5;
		this.speed = 30;
		this.score = 0;
		this.bullets = [[], []];
	}
}

class Bullet {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

const boss = {
	x: 470,
	y: -100,
	life: 3000,
	speed: 4,
	isGoingRight: true,
};

//== Change enemy's life here ==//
const droneLife = 10;
const lightLife = 50;
const heavyLife = 150;

const enemies = [
	{ x: 550, y: -1000, type: "drone", life: droneLife },
	{ x: 66, y: -1000, type: "drone", life: droneLife },
	{ x: 20, y: 10, type: "drone", life: droneLife },
	{ x: 656, y: -1000, type: "drone", life: droneLife },
	{ x: 450, y: -1000, type: "light", life: lightLife },
	{ x: 790, y: -1000, type: "light", life: lightLife },
	{ x: 656, y: -1000, type: "light", life: lightLife },
	{ x: 50, y: 100, type: "light", life: lightLife },
	{ x: 100, y: 10, type: "light", life: lightLife },
	{ x: 914, y: -1000, type: "heavy", life: heavyLife },
	{ x: 850, y: -1000, type: "heavy", life: heavyLife },
	{ x: 50, y: -1000, type: "heavy", life: heavyLife },
];

const bossExplosions = [];
const explosions = [];
setInterval(() => explosions.shift(), 800);
const players = {};
let gameloop;

io.on("connection", function (socket) {
	socket.on("newPlayer", function ({ name }) {
		socket.id = name;
		players[socket.id] = new Player(name);

		io.emit("activePlayers", { players });
		socket.emit("createEnemies", { enemies }); // Responds only to the user that triggered the listener
		setInterval(() => {
			moveBullets();
			detectCollision();
		}, 5);
		gameloop = setInterval(() => {
			explosionActivity();
			moveEnemies();
		}, 50);
	});

	socket.on("controls", ({ move }) => {
		if (move == "ArrowUp") {
			players[socket.id]["y"] =
				players[socket.id]["y"] > 20
					? players[socket.id]["y"] - players[socket.id]["speed"]
					: players[socket.id]["y"];
		} else if (move == "ArrowDown") {
			players[socket.id]["y"] =
				players[socket.id]["y"] < 500
					? players[socket.id]["y"] + players[socket.id]["speed"]
					: players[socket.id]["y"];
		} else if (move == "ArrowLeft") {
			players[socket.id]["x"] =
				players[socket.id]["x"] > 20
					? players[socket.id]["x"] - players[socket.id]["speed"]
					: players[socket.id]["x"];
			players[socket.id]["z"] = -8;
		} else if (move == "ArrowRight") {
			players[socket.id]["x"] =
				players[socket.id]["x"] < 970
					? players[socket.id]["x"] + players[socket.id]["speed"]
					: players[socket.id]["x"];
			players[socket.id]["z"] = 8;
		} else if (move == " ") {
			players[socket.id]["bullets"][0].push(
				new Bullet(
					players[socket.id]["x"] - 2,
					players[socket.id]["y"] - 20
				)
			);
			players[socket.id]["bullets"][1].push(
				new Bullet(
					players[socket.id]["x"] + 18,
					players[socket.id]["y"] - 20
				)
			);
		}

		io.emit("displayPlayers", { players });
	});

	socket.on("keyUp", () => {
		players[socket.id]["z"] = 0;
		io.emit("displayPlayers", { players });
	});

	socket.on("disconnect", function () {
		delete players[socket.id];
		io.emit("activePlayers", { players });
	});

	function moveBullets() {
		for (let i = 0; i < players[socket.id].bullets.length; i++) {
			for (let j = 0; j < players[socket.id].bullets[i].length; j++) {
				// Move bullet
				players[socket.id].bullets[i][j].y -= 2;

				// Bullet disappear
				if (players[socket.id].bullets[i][j].y < 1) {
					players[socket.id].bullets[i].shift();
				}
			}
		}

		io.emit("displayBullets", { players });
	}

	function moveEnemies() {
		io.emit("moveEnemies", { enemies });

		for (let i = 0; i < enemies.length; i++) {
			// Move Enemies
			if (enemies[i].type == "heavy") {
				enemies[i].y += 1;
			} else if (enemies[i].type == "light") {
				enemies[i].y += 3;
			} else if (enemies[i].type == "drone") {
				enemies[i].y += 4;
				if (enemies[i].x < players[socket.id]["x"]) {
					enemies[i].x += 2;
				} else {
					enemies[i].x -= 2;
				}
			}

			if (enemies[i].life <= 0) {
				// Refill life of enemies' lives depending on enemy type

				let explosionSound;
				if (enemies[i].type == "heavy") {
					explosions.push({
						x: enemies[i].x,
						y: enemies[i].y,
						type: "heavy_explode",
					});
					explosionSound = "/sounds/Explode1.mp3";
					players[socket.id].score += 25;
					enemies[i].life = heavyLife;
				} else if (enemies[i].type == "light") {
					explosions.push({
						x: enemies[i].x,
						y: enemies[i].y,
						type: "light_explode",
					});
					explosionSound = "/sounds/Explode2.mp3";
					players[socket.id].score += 10;
					enemies[i].life = lightLife;
				} else if (enemies[i].type == "drone") {
					explosions.push({
						x: enemies[i].x,
						y: enemies[i].y,
						type: "drone_explode",
					});
					explosionSound = "/sounds/Explode3.mp3";
					players[socket.id].score += 5;
					enemies[i].life = droneLife;
				}

				io.emit("explosionSound", { explosionSound, players });

				//Move exploded enemy to the top
				enemies[i].y = -300;
				enemies[i].x = Math.floor(Math.random() * 930) + 25;
			}

			// MOVE ENEMIES BACK TO THE TOP WHEN REACHED THE BOTTOM
			if (enemies[i].y > 530) {
				enemies[i].y = 0;
				enemies[i].x = Math.floor(Math.random() * 930) + 25;
			}
		}
	}

	function detectCollision() {
		//BOSS-BULLET COLLISION
		// for(let i = 0; i < players[socket.id].bullets.length; i++) {
		//     for(let j = 0; j < players[socket.id].bullets[i].length; j++) {
		//         // if(Math.abs(boss.x - players[socket.id].bullets[i][j].x) < 80 && Math.abs(boss.y - players[socket.id].bullets[i][j].y) <= 35) {
		//         //     bossExplosions.push({x: players[socket.id].bullets[i][j].x, y: players[socket.id].bullets[i][j].y - 10, type: 'light_explode'});
		//         //     new Audio("/sounds/Explode2.mp3").play();
		//         //     players[socket.id].bullets[i].shift();
		//         // }

		//     }
		// }

		for (let k = 0; k < enemies.length; k++) {
			// ENEMY-BULLET COLLISION
			for (let i = 0; i < players[socket.id].bullets.length; i++) {
				for (let j = 0; j < players[socket.id].bullets[i].length; j++) {
					if (
						Math.abs(
							enemies[k].x - players[socket.id].bullets[i][j].x
						) < 30 &&
						Math.abs(
							enemies[k].y - players[socket.id].bullets[i][j].y
						) < 20
					) {
						players[socket.id].bullets[i].shift();
						enemies[k].life -= players[socket.id].damage;
					}
				}
			}

			if (
				Math.abs(enemies[k].x - players[socket.id].x) < 40 &&
				Math.abs(enemies[k].y - players[socket.id].y) < 15
			) {
				//Add item to explosions array then play sound
				enemies[k].life -= 30000;
				io.emit("explosionSound", {
					explosionSound: "/sounds/Explode3.mp3",
				});
				io.emit("playerHit", { name: players[socket.id].name });
				//Subtract 50 scores
				players[socket.id]["score"] =
					players[socket.id]["score"] >= 50
						? players[socket.id]["score"] - 50
						: 0;
			}
		}
	}

	function explosionActivity() {
		io.emit("explosions", { explosions });
		for (let i = 0; i < explosions.length; i++) {
			explosions[i].y += 3;

			//Remove if enemy explosion reaches the bottom
			if (explosions[i].y > 530) {
				explosions.shift();
			}
		}
	}
}); // IO CONNECTION

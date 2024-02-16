const path = require("path");
const express = require("express");
const app = express();
const port = 8000;

const Boss = require("./classes/boss");
const Bullet = require("./classes/bullet");
const Enemy = require("./classes/enemy");
const Explosion = require("./classes/explosion");
const Player = require("./classes/player");

app.use(express.static(path.join(__dirname, "static")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => res.render("index"));

const server = app.listen(port, () =>
	console.log(`Listening on port ${port}...`)
);

const io = require("socket.io")(server);

const boss = new Boss();
const bossExplosions = [];

const enemies = [
	new Enemy(550, -1000, "drone"),
	new Enemy(66, -1000, "drone"),
	new Enemy(20, 10, "drone"),
	new Enemy(656, -1000, "drone"),
	new Enemy(450, -1000, "light"),
	new Enemy(790, -1000, "light"),
	new Enemy(656, -1000, "light"),
	new Enemy(50, 100, "light"),
	new Enemy(100, 10, "light"),
	new Enemy(914, -1000, "heavy"),
	new Enemy(850, -1000, "heavy"),
	new Enemy(50, -1000, "heavy"),
];

const explosions = [];
const players = {};
let gameloop;

const screenTopBorderline = 20;
const screenBottomBorderline = 500;
const screenLeftBorderline = 20;
const screenRightBorderline = 970;

io.on("connection", function (socket) {
	socket.on("disconnect", () => {
		delete players[socket.id];
		io.emit("createPlayers", players);
	});

	socket.on("joinGame", function ({ name }) {
		socket.id = name;
		players[socket.id] = new Player(name);

		io.emit("createPlayers", players);
		// socket.emit responds only to the user that triggered the listener
		socket.emit("createEnemies", enemies);

		setInterval(() => {
			moveBullets();
			detectCollision();
		}, 5);

		gameloop = setInterval(() => {
			moveEnemies();
			explosionsMovement();
		}, 40);
	});

	socket.on("controlPlayer", ({ move }) => {
		const player = players[socket.id];

		const playerIsMovingUp = move == "ArrowUp";
		const playerIsMovingDown = move == "ArrowDown";
		const playerIsMovingLeft = move == "ArrowLeft";
		const playerIsMovingRight = move == "ArrowRight";
		const playerIsFiring = move == " " || move == "click";

		const playerCanMoveUp = player.y > screenTopBorderline;
		const playerCanMoveDown = player.y < screenBottomBorderline;
		const playerCanMoveLeft = player.x > screenLeftBorderline;
		const playerCanMoveRight = player.x < screenRightBorderline;

		const tiltLeftAngle = -8;
		const tiltRightAngle = 8;

		if (playerIsMovingUp && playerCanMoveUp) {
			player.y -= player.speed;
		} else if (playerIsMovingDown && playerCanMoveDown) {
			player.y += player.speed;
		} else if (playerIsMovingLeft && playerCanMoveLeft) {
			player.x -= player.speed;
			player.z = tiltLeftAngle;
		} else if (playerIsMovingRight && playerCanMoveRight) {
			player.x += player.speed;
			player.z = tiltRightAngle;
		} else if (playerIsFiring) {
			player.leftBullets.push(new Bullet(player.x - 2, player.y - 20));
			player.rightBullets.push(new Bullet(player.x + 18, player.y - 20));
		}

		players[socket.id] = player;
		io.emit("movePlayers", players);
	});

	socket.on("keyUp", () => {
		players[socket.id]["z"] = 0;
		io.emit("movePlayers", players);
	});

	function moveBullets() {
		const playerLeftBullets = players[socket.id].leftBullets;
		const playerRightBullets = players[socket.id].rightBullets;
		const bulletSpeed = 2;

		for (let i = 0; i < playerLeftBullets.length; i++) {
			playerLeftBullets[i].y -= bulletSpeed;

			const leftBulletGoesAboveTopScreen = playerLeftBullets[i].y < 1;
			if (leftBulletGoesAboveTopScreen) {
				playerLeftBullets.shift();
			}
		}

		for (let i = 0; i < playerRightBullets.length; i++) {
			playerRightBullets[i].y -= bulletSpeed;

			const rightBulletGoesAboveTopScreen = playerRightBullets[i].y < 1;
			if (rightBulletGoesAboveTopScreen) {
				playerRightBullets.shift();
			}
		}

		players[socket.id].leftBullets = playerLeftBullets;
		players[socket.id].rightBullets = playerRightBullets;
		io.emit("displayBullets", { playerLeftBullets, playerRightBullets });
	}

	function moveEnemies() {
		const player = players[socket.id];

		for (let i = 0; i < enemies.length; i++) {
			const enemyShip = enemies[i];

			enemyShip.y += enemyShip.speed;

			if (enemyShip.type == "drone") {
				if (enemyShip.x < player.x) {
					enemyShip.x += 2;
				}

				if (enemyShip.x > player.x) {
					enemyShip.x -= 2;
				}
			}

			const enemyShipHasDied = enemyShip.health <= 0;
			const enemyGoesBelowBottomScreen =
				enemyShip.y > screenBottomBorderline + 30;
			const enemyShipWillResetLocation =
				enemyShipHasDied || enemyGoesBelowBottomScreen;

			if (enemyShipHasDied) {
				explosions.push(
					new Explosion(
						enemyShip.x,
						enemyShip.y,
						`${enemyShip.type}_explode`
					)
				);
				player.score += enemyShip.score;
				enemyShip.heal();

				io.emit("explosionSound", {
					explosionSoundType: enemyShip.type,
					players,
				});

				setTimeout(() => explosions.shift(), 1000);
			}

			if (enemyShipWillResetLocation) {
				const insideHorizontalScreenPosition =
					Math.floor(Math.random() * (screenRightBorderline - 40)) +
					(screenLeftBorderline + 5);

				enemyShip.y = screenTopBorderline - 200;
				enemyShip.x = insideHorizontalScreenPosition;
			}

			const playerAndEnemyCollided =
				Math.abs(enemyShip.x - player.x) < 40 &&
				Math.abs(enemyShip.y - player.y) < 15;

			if (playerAndEnemyCollided) {
				enemyShip.health = 0;
				io.emit("blinkPlayerWhenHit", player.name);

				player.life--;
			}

			players[socket.id] = player;
			enemies[i] = enemyShip;
		}
		io.emit("moveEnemies", enemies);
	}

	function detectCollision() {
		const player = players[socket.id];
		// BULLET-TO-BOSS COLLISION
		// for(let i = 0; i < players[socket.id].bullets.length; i++) {
		//     for(let j = 0; j < players[socket.id].bullets[i].length; j++) {
		//         // if(Math.abs(boss.x - players[socket.id].bullets[i][j].x) < 80 && Math.abs(boss.y - players[socket.id].bullets[i][j].y) <= 35) {
		//         //     bossExplosions.push({x: players[socket.id].bullets[i][j].x, y: players[socket.id].bullets[i][j].y - 10, type: 'light_explode'});
		//         //     new Audio("/sounds/Explode2.mp3").play();
		//         //     players[socket.id].bullets[i].shift();
		//         // }

		//     }
		// }

		// BULLET-TO-ENEMY COLLISION
		for (let idx = 0; idx < enemies.length; idx++) {
			const enemy = enemies[idx];

			const { leftBullets, rightBullets, damage } = player;
			const distanceToCollidehorizontally = 30;
			const distanceToCollideVertically = 20;

			for (let i = 0; i < leftBullets.length; i++) {
				const collidedHorizontally =
					Math.abs(enemy.x - leftBullets[i].x) <
					distanceToCollidehorizontally;
				const collidedVertically =
					Math.abs(enemy.y - leftBullets[i].y) <
					distanceToCollideVertically;

				const enemyAndLeftBulletCollided =
					collidedHorizontally && collidedVertically;

				if (enemyAndLeftBulletCollided) {
					player.leftBullets.splice(i, 1);
					enemy.health -= damage;
				}
			}

			for (let i = 0; i < rightBullets.length; i++) {
				const collidedHorizontally =
					Math.abs(enemy.x - rightBullets[i].x) <
					distanceToCollidehorizontally;
				const collidedVertically =
					Math.abs(enemy.y - rightBullets[i].y) <
					distanceToCollideVertically;

				const enemyAndRightBulletCollided =
					collidedHorizontally && collidedVertically;

				if (enemyAndRightBulletCollided) {
					player.rightBullets.splice(i, 1);
					enemy.health -= damage;
				}
			}
		}
	}

	function explosionsMovement() {
		for (let i = 0; i < explosions.length; i++) {
			explosions[i].y += 3;

			const explosionGoesBelowBottomScreen =
				explosions[i].y > screenBottomBorderline + 30;
			if (explosionGoesBelowBottomScreen) {
				explosions.shift();
			}
		}
		io.emit("createExplosions", explosions);
	}
}); // IO CONNECTION

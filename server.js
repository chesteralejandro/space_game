const path = require("path");
const express = require("express");
const app = express();
const port = 8000;

const Boss = require("./classes/boss");
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

let gameloop;
const players = {};
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

const screenTopBorderline = 20;
const screenBottomBorderline = 500;
const screenLeftBorderline = 20;
const screenRightBorderline = 970;
const distanceToCollidehorizontally = 30;
const distanceToCollideVertically = 20;

io.on("connection", function (socket) {
	console.log("CONNECTED TO SOCKET...");

	socket.on("disconnect", () => {
		delete players[socket.id];
		io.emit("createPlayers", players);
	});

	socket.on("joinGame", function ({ name }) {
		socket.id = name;
		players[socket.id] = new Player(name);

		io.emit("createPlayers", players);
		/* socket.emit responds only to
		the user that triggered the listener */
		socket.emit("createEnemies", enemies);

		setInterval(() => {
			moveBullets();
			detectCollision();
		}, 5);

		gameloop = setInterval(() => {
			moveEnemies();
			simulateExplosions();
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

		if (playerIsMovingUp && playerCanMoveUp) {
			player.moveUp();
		} else if (playerIsMovingDown && playerCanMoveDown) {
			player.moveDown();
		} else if (playerIsMovingLeft && playerCanMoveLeft) {
			player.moveLeft();
		} else if (playerIsMovingRight && playerCanMoveRight) {
			player.moveRight();
		} else if (playerIsFiring) {
			player.fire();
		}

		io.emit("movePlayers", players);
	});

	socket.on("keyUp", () => {
		players[socket.id].tiltForward();
		io.emit("movePlayers", players);
	});

	function moveBullets() {
		const player = players[socket.id];
		const playerLeftBullets = player.leftBullets;
		const playerRightBullets = player.rightBullets;

		for (let i = 0; i < playerLeftBullets.length; i++) {
			playerLeftBullets[i].y -= player.bulletSpeed;

			const leftBulletGoesAboveTopScreen = playerLeftBullets[i].y < 1;
			if (leftBulletGoesAboveTopScreen) {
				playerLeftBullets.shift();
			}
		}

		for (let i = 0; i < playerRightBullets.length; i++) {
			playerRightBullets[i].y -= player.bulletSpeed;

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

			enemyShip.moveDown();

			if (enemyShip.type == "drone") {
				const playerIsOnRight = enemyShip.x < player.x;
				const playerIsOnLeft = enemyShip.x > player.x;

				if (playerIsOnRight) enemyShip.moveRight();
				if (playerIsOnLeft) enemyShip.moveLeft();
			}

			const enemyShipHasDied = enemyShip.health <= 0;
			const enemyGoesBelowBottomScreen =
				enemyShip.y > screenBottomBorderline + 30;

			if (enemyShipHasDied) {
				explosions.push(
					new Explosion(
						enemyShip.x,
						enemyShip.y,
						`${enemyShip.type}_explode`
					)
				);

				setTimeout(() => explosions.shift(), 1000);

				io.emit("explosionSound", {
					explosionSoundType: enemyShip.type,
					players,
				});

				enemyShip.heal();
			}

			const enemyShipWillResetLocation =
				enemyShipHasDied || enemyGoesBelowBottomScreen;

			if (enemyShipWillResetLocation) {
				const allowedHorizontalScreenPosition =
					Math.floor(Math.random() * (screenRightBorderline - 40)) +
					(screenLeftBorderline + 5);
				const verticalPosition = screenTopBorderline - 200;

				enemyShip.backToBase(
					allowedHorizontalScreenPosition,
					verticalPosition
				);
			}
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

		for (let idx = 0; idx < enemies.length; idx++) {
			const enemyShip = enemies[idx];
			const { leftBullets, rightBullets, damage } = player;

			// LEFT-BULLET-TO-ENEMY-COLLISION
			for (let i = 0; i < leftBullets.length; i++) {
				const collidedHorizontally =
					Math.abs(enemyShip.x - leftBullets[i].x) <
					distanceToCollidehorizontally;
				const collidedVertically =
					Math.abs(enemyShip.y - leftBullets[i].y) <
					distanceToCollideVertically;

				const enemyShipAndLeftBulletCollided =
					collidedHorizontally && collidedVertically;

				if (enemyShipAndLeftBulletCollided) {
					player.leftBullets.splice(i, 1);
					const reward = enemyShip.takeHit(damage);
					player.addScore(reward);
				}
			}

			// RIGHT-BULLET-TO-ENEMY-COLLISION
			for (let i = 0; i < rightBullets.length; i++) {
				const collidedHorizontally =
					Math.abs(enemyShip.x - rightBullets[i].x) <
					distanceToCollidehorizontally;
				const collidedVertically =
					Math.abs(enemyShip.y - rightBullets[i].y) <
					distanceToCollideVertically;

				const enemyShipAndRightBulletCollided =
					collidedHorizontally && collidedVertically;

				if (enemyShipAndRightBulletCollided) {
					player.rightBullets.splice(i, 1);
					const reward = enemyShip.takeHit(damage);
					player.addScore(reward);
				}
			}

			// PLAYER-TO-ENEMY-COLLISION
			const playerAndEnemyCollided =
				Math.abs(enemyShip.x - player.x) < 40 &&
				Math.abs(enemyShip.y - player.y) < 15;

			if (playerAndEnemyCollided) {
				io.emit("blinkPlayerWhenHit", player.name);
				enemyShip.destroy();
				player.minusLife();
			}
		}
	}

	function simulateExplosions() {
		const explosionSpeed = 3;
		for (let i = 0; i < explosions.length; i++) {
			explosions[i].y += explosionSpeed;

			const explosionGoesBelowBottomScreen =
				explosions[i].y > screenBottomBorderline + 30;
			if (explosionGoesBelowBottomScreen) {
				explosions.shift();
			}
		}

		io.emit("createExplosions", explosions);
	}
}); // IO CONNECTION

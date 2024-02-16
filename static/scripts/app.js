window.addEventListener("load", function (e) {
	const name = this.prompt("Enter player name");

	if (name == "" || name == null) {
		location.reload();
	}

	//Play background music.
	// new Audio("/sounds/Gradius.mp3").play();
	const playersContainer = document.querySelector("#players");
	const scoresContainer = document.querySelector("#scores");
	const enemiesContainer = document.querySelector("#enemies");
	const bossFigure = document.getElementById("boss");

	const socket = io();

	socket.emit("joinGame", { name });

	socket.on("createPlayers", (players) => {
		let playerFigures = "";
		let playerScores = "";

		for (let playerID in players) {
			const { x, y, z, name, score } = players[playerID];

			playerFigures += `<div id="${name}" class="hero booster" style="top: ${y}px; left: ${x}px; transform: scale(1.6) rotateZ(${z}deg)">
                                    <p>${name}</p>
                              </div>`;

			playerScores += `<div id="${name}" class="score"><p>${name}</p>${score}</div>`;
		}

		playersContainer.innerHTML = playerFigures;
		scoresContainer.innerHTML = playerScores;
	});

	socket.on("movePlayers", (players) => {
		for (let playerID in players) {
			const { x, y, z, name } = players[playerID];

			const player = document.querySelector(`div#${name}.hero`);

			player.setAttribute(
				"style",
				`top: ${y}px; left: ${x}px; transform: scale(1.6) rotateZ(${z}deg)`
			);
		}
	});

	socket.on("createEnemies", (enemies) => {
		const music = new Audio("/sounds/Gradius.mp3");
		music.play();

		let enemyFigures = "";
		for (let i = 0; i < enemies.length; i++) {
			const { x, y, type } = enemies[i];
			enemyFigures += `<div id="enemy_${i}" class='${type}_enemy' style='top: ${y}px; left: ${x}px;'></div>`;
		}
		enemiesContainer.innerHTML = enemyFigures;
	});

	socket.on("moveEnemies", (enemies) => {
		for (let i = 0; i < enemies.length; i++) {
			const enemyFigure = document.querySelector(`#enemy_${i}`);
			const { x, y } = enemies[i];

			enemyFigure.setAttribute("style", `top: ${y}px; left: ${x}px;`);
		}
	});

	socket.on("displayBullets", ({ playerLeftBullets, playerRightBullets }) => {
		let bulletFigures = "";

		for (let i = 0; i < playerLeftBullets.length; i++) {
			const { x, y } = playerLeftBullets[i];
			bulletFigures += `<div class="bullet" style="top: ${y}px; left: ${x}px;"></div>`;
		}

		for (let i = 0; i < playerRightBullets.length; i++) {
			const { x, y } = playerRightBullets[i];
			bulletFigures += `<div class="bullet" style="top: ${y}px; left: ${x}px;"></div>`;
		}

		document.getElementById("bullets").innerHTML = bulletFigures;
	});

	socket.on("blinkPlayerWhenHit", (name) => {
		const twoSecondsToStopBlinking = 2000;
		const playerShip = document.querySelector(`#${name}.hero`);

		playerShip.classList.add("blink");

		setTimeout(removePlayerBlinkingAnimation, twoSecondsToStopBlinking);

		function removePlayerBlinkingAnimation() {
			playerShip.classList.remove("blink");
		}
	});

	socket.on("explosionSound", ({ explosionSoundType, players }) => {
		const explode = new Audio();
		explode.src = `/sounds/${explosionSoundType}_explode.mp3`;
		explode.play();

		for (let playerID in players) {
			const { name, score } = players[playerID];
			document.querySelector(
				`#${name}.score`
			).innerHTML = `<p>${name}</p>${score}`;
		}
	});

	socket.on("createExplosions", (explosions) => {
		let output = "";
		for (let i = 0; i < explosions.length; i++) {
			const { x, y, type } = explosions[i];
			output += `<div class='${type}' style='left: ${x}px; top: ${y}px'></div>`;
		}
		document.getElementById("explode").innerHTML = output;
	});

	// function gameloop() {
	//     displayHero();
	//     displayBullets();
	//     displayEnemies();
	//     displayExplosion();
	//     displayBoss();
	//     detectCollision();
	//     moveEnemies()
	//     document.getElementById('score').innerText = hero.score;
	// }
	// setInterval(gameloop, 50);

	//======================== Boss Fight =================//

	// function displayBoss() {
	//     bossFigure.style['transition'] = "all 150ms ease";
	//     bossFigure.style['top'] = boss.y + "px";
	//     bossFigure.style['left'] = boss.x + "px";
	// }

	// setTimeout(function() {
	//     function moveBoss() {
	//         boss.y += boss.speed;
	//         if(boss.y >= 100) {
	//             boss.y = 100;
	//             if(boss.isGoingRight == true) {
	//                 boss.x += boss.speed;
	//             } else {
	//                 boss.x -= boss.speed;
	//             }

	//             if(boss.x >= 970) {
	//                 boss.isGoingRight = false;
	//             } else if(boss.x <= 20) {
	//                 boss.isGoingRight = true;
	//             }
	//         }
	//     }
	//     setInterval(moveBoss, 50);
	//     // Play boss music
	//     new Audio("/sounds/Boss.mp3").play();
	//     // Add more enemies
	//     enemies.push(
	//         {x: 550, y: -500, type: "drone", life: droneLife},
	//         {x: 550, y: -500, type: "drone", life: droneLife},
	//         {x: 66, y: -500, type: "drone", life: droneLife},
	//         {x: 20, y: -500, type: "drone", life: droneLife},
	//         {x: 656, y: -500, type: "drone", life: droneLife},
	//         {x: 450, y: -500, type: "light", life: lightLife},
	//         {x: 790, y: 500, type: "light", life: lightLife},
	//         {x: 656, y: -50, type: "heavy", life: heaveyLife},
	//         {x: 50, y: -50, type: "heavy", life: heaveyLife},
	//         {x: 100, y: -50, type: "heavy", life: heaveyLife},
	//     )
	// }, 180000);

	//=====================================================//

	// function displayExplosion() {
	//     //Enemies explosion
	//     var output = "";
	//     for(var i = 0; i < explosions.length; i++) {
	//         output += `<div class='${explosions[i].type}' style='left: ${explosions[i].x}px; top: ${explosions[i].y += 3}px'></div>`;
	//         //Remove if enemy explosion reaches the bottom
	//         if(explosions[i].y > 530) {
	//             explosions.shift();
	//         }
	//     }
	//     document.getElementById('explode').innerHTML = output;

	//     //Boss explosion
	//     var output2 = "";
	//     for(var j = 0; j < bossExplosions.length; j++) {
	//         output2 += `<div class='${bossExplosions[j].type}' style='left: ${bossExplosions[j].x}px; top: ${bossExplosions[j].y++}px'></div>`;
	//         if(bossExplosions[i].y > 530) {
	//             bossExplosions.shift();
	//         }
	//     }
	//     document.getElementById('boss_explode').innerHTML = output2;
	// }
	//================ Remove explosions ==================//
	//Enemies
	// setInterval(function(){
	//     explosions.shift();
	// }, 700)
	// //Boss
	// setInterval(function(){
	//     bossExplosions.shift();
	// }, 150)
	//================================= Controls ==========================================//

	document.onkeydown = function (event) {
		socket.emit("controlPlayer", { move: event.key });
	};

	document.onclick = function (event) {
		socket.emit("controlPlayer", { move: event.type });
	};

	document.onkeyup = function () {
		socket.emit("keyUp");
	};
});

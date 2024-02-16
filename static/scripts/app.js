window.addEventListener('load', function(e) {
    const name = this.prompt('Enter player name');
    let playerObj;

    if(name == '' || name == null) {
        location.reload();
    }

    //Play background music.
    // new Audio("/sounds/Gradius.mp3").play();
    const playersFrame = document.querySelector('div#players');
    const scoresFrame = document.querySelector('div#scores');
    var bossFigure = document.getElementById('boss');

    const socket = io();

    socket.emit('newPlayer', { name });

    socket.on('activePlayers', ({ players }) => {
        let playersFigure = '';
        let playersScore = '';

        for(let playerID of Object.keys(players)) {
            const player = players[playerID];

            playersFigure += `<div id="${player.name}" class="hero booster" style="top: ${player.y}px; left: ${player.x}px; transform: scale(1.6) rotateZ(${player.z}deg)">
                                    <p>${player.name}</p>
                              </div>`;

            playersScore += `<div id="${player.name}" class="score"><p>${player.name}</p>${player.score}</div>`;
        }

        playersFrame.innerHTML = playersFigure;
        scoresFrame.innerHTML = playersScore;
    });

    socket.on('displayPlayers', ({ players }) => {
        
        for(let playerID of Object.keys(players)) {
            const player = players[playerID];
            document.querySelector(`div#${player.name}.hero`).setAttribute('style', `top: ${player.y}px; left: ${player.x}px; transform: scale(1.6) rotateZ(${player.z}deg)`);
        }
    })

    socket.on('moveEnemies', ({ enemies }) => {
        
        for(let i = 0; i < enemies.length; i++) {
            document.querySelector(`div#enemy${i}`).setAttribute('style', `top: ${enemies[i].y}px; left: ${enemies[i].x}px;`);
        }
    });

    socket.on('createEnemies', ({ enemies }) => {
        let output = '';
        for(let i = 0; i < enemies.length; i++) {
            if(enemies[i].type == 'heavy'){
                output += `<div id="enemy${i}" class='heavy_enemy' style='top: ${enemies[i].y}px; left: ${enemies[i].x}px;'></div>`;
            } else if(enemies[i].type == 'light'){
                output += `<div id="enemy${i}" class='light_enemy' style='top: ${enemies[i].y}px; left: ${enemies[i].x}px;'></div>`;
            } else if(enemies[i].type == 'drone'){
                output += `<div id="enemy${i}" class='drone_enemy' style='top: ${enemies[i].y}px; left: ${enemies[i].x}px;'></div>`;
            }

            document.getElementById('enemies').innerHTML = output;
        }
    });

    socket.on('displayBullets', ({ players }) => {
        let bullets = "";
        for(let playerID of Object.keys(players)) {
            const player = players[playerID];
            for(let i = 0; i < player.bullets.length; i++) {
                for(let j = 0; j < player.bullets[i].length; j++) {

                    bullets += `<div class="bullet" style="top: ${player.bullets[i][j].y}px; left: ${player.bullets[i][j].x}px;"></div>`;
                }
            }
        }
        document.getElementById('bullets').innerHTML = bullets;
    });

    socket.on('playerHit', ({ name }) => {
        //Add blink animation to hero for 1 second
        document.querySelector(`div#${name}.hero`).classList.add('blink');
        setTimeout(() => document.querySelector(`div#${name}.hero`).classList.remove('blink'), 2000);
    });

    socket.on('explosionSound', ({ explosionSound, players }) => {
        const explode = new Audio();
        explode.src = explosionSound;
        explode.play();

        for(let playerID of Object.keys(players)) {
            const player = players[playerID];
            document.querySelector(`div#${player.name}.score`).innerHTML = `<p>${player.name}</p>${player.score}`;
        }
    });

    socket.on('explosions', ({ explosions }) => {
        var output = "";
        for(var i = 0; i < explosions.length; i++) {
            output += `<div class='${explosions[i].type}' style='left: ${explosions[i].x}px; top: ${explosions[i].y}px'></div>`;
        }
        document.getElementById('explode').innerHTML = output;
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
    
    document.onkeydown = function(event) {
        socket.emit('controls', { move: event.key});
        // new Audio("/sounds/Gradius.mp3").play();
    }
    
    document.onkeyup = function() {
        socket.emit('keyUp');
    }
    
    document.onclick = function () {
        socket.emit('controls', { move: ' '});
    }
});

const frogImg = document.getElementById("frog-img");
let frogDirection = 'up'; // pode ser 'up', 'down', 'left', 'right'
const carImg = document.getElementById("car-img");
const logImg = document.getElementById("log-img");

const TILE_SIZE = 50;
const ROWS_ON_SCREEN = 12;
const canvasWidth = 800;
const canvasHeight = TILE_SIZE * ROWS_ON_SCREEN;

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
canvas.width = canvasWidth;
canvas.height = canvasHeight;

const nicknameInput = document.getElementById("nickname");
const startButton = document.getElementById("start-button");
const entryScreen = document.getElementById("entry-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const finalScore = document.getElementById("final-score");
const restartButton = document.getElementById("restart-button");
const scoreDisplay = document.getElementById("score-display");
const scoreboardList = document.getElementById("scoreboard");

let currentScore = 0;
let playerNickname = "";
let gameWorld = [];
let player = { x: 7, y: 0, onLog: false, logSpeed: 0 };
let obstacles = [];
let isGameOver = false;
let gameStarted = false;

nicknameInput.addEventListener("input", () => {
  startButton.disabled = nicknameInput.value.trim() === "";
});

startButton.addEventListener("click", () => {
  playerNickname = nicknameInput.value.trim();
  entryScreen.style.display = "none";
  canvas.style.display = "block";
  scoreDisplay.style.display = "block";
  startGame();
});

restartButton.addEventListener("click", () => {
  gameOverScreen.style.display = "none";
  entryScreen.style.display = "block";
  loadScoresFromAPI();  // Atualiza scoreboard após reiniciar
});

function saveScoreToAPI() {
  fetch('http://localhost:3000/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      datascore: new Date().toISOString().slice(0, 19).replace('T', ' '), // formato MySQL datetime
      nickname: playerNickname,
      score: currentScore,
      game: "Sapo das Streets"
    })
  })
  .then(res => {
    if (!res.ok) throw new Error("Erro ao salvar score");
    return res.json();
  })
  .catch(err => console.error(err));
}

function loadScoresFromAPI() {
  fetch('http://localhost:3000/api/scores/bygame/Sapo das Streets')
    .then(res => {
      if (!res.ok) throw new Error("Erro ao buscar scores");
      return res.json();
    })
    .then(data => {
      // Ordena do maior para o menor e pega top 10
      data.sort((a, b) => b.score - a.score);
      const top = data.slice(0, 100);

      scoreboardList.innerHTML = "";
      top.forEach((entry, index) => {
        const li = document.createElement("li");

        const posBox = document.createElement("span");
        posBox.textContent = (index + 1);
        posBox.style.display = "inline-block";
        posBox.style.width = "30px";
        posBox.style.textAlign = "center";
        posBox.style.marginRight = "10px";
        posBox.style.borderRadius = "4px";
        posBox.style.fontWeight = "bold";
        posBox.style.color = "#fff";

        // Define cor dourada, prateada e bronzeada pros top 3
        if (index === 0) {
          posBox.style.backgroundColor = "#FFD700"; // dourado
        } else if (index === 1) {
          posBox.style.backgroundColor = "#C0C0C0"; // prata
        } else if (index === 2) {
          posBox.style.backgroundColor = "#CD7F32"; // bronze
        } else {
          posBox.style.backgroundColor = "#000"; // cor padrão
        }

        const nickBox = document.createElement("span");
        nickBox.textContent = entry.nickname;
        nickBox.style.display = "inline-block";
        nickBox.style.minWidth = "100px";
        nickBox.style.textAlign = "left";
        nickBox.style.color = "#000";

        const scoreBox = document.createElement("span");
        scoreBox.textContent = entry.score;
        scoreBox.style.display = "inline-block";
        scoreBox.style.width = "50px";
        scoreBox.style.textAlign = "right";
        scoreBox.style.backgroundColor = "#fff";
        scoreBox.style.color = "#000";
        scoreBox.style.marginRight = "10px";
        scoreBox.style.borderRadius = "4px";
        scoreBox.style.fontWeight = "bold";
        scoreBox.style.fontSize = "18px";

        li.appendChild(posBox);
        li.appendChild(nickBox);
        li.appendChild(scoreBox);

        scoreboardList.appendChild(li);
      });
    })
    .catch(err => {
      console.error("Erro ao buscar scoreboard:", err);
    });
}

const backgroundMusic = document.getElementById('background-music');
const volumeControl = document.getElementById("volume-control");

function setVolume(volume) {
  const jumpSound = document.getElementById("jump-sound");
  const deathSound = document.getElementById("death-sound");
  const backgroundMusic = document.getElementById("background-music");

  if (jumpSound) jumpSound.volume = volume;
  if (deathSound) deathSound.volume = volume;
  if (backgroundMusic) backgroundMusic.volume = volume;
}

// Inicializa o volume com o valor do slider
setVolume(volumeControl.value);

// Atualiza o volume quando o slider muda
volumeControl.addEventListener("input", (e) => {
  setVolume(e.target.value);
});

function playJumpSound() {
  const jumpSound = document.getElementById("jump-sound");
  if (jumpSound) {
    jumpSound.currentTime = 0;
    jumpSound.play().catch(() => {});
  }
}

function playDeathSound() {
  const deathSounds = document.getElementById("death-sound");
  if (deathSounds) {
    deathSounds.currentTime = 0;
    deathSounds.play().catch(() => {});
  }
}

function generateWorld() {
  gameWorld = [];
  for (let i = 0; i < 100; i++) {
    const type = i === 0 ? 'grass' : randomTileType();
    const direction = Math.random() < 0.5 ? 1 : -1;
    gameWorld.push({ type, direction });
  }
}

function randomTileType() {
  const r = Math.random();
  if (r < 0.3) return 'road';
  if (r < 0.6) return 'river';
  return 'grass';
}

function spawnObstacles() {
  
  obstacles = [];
  const basecount = 2;

  gameWorld.forEach((row, index) => {
    if (row.type === 'road' || row.type === 'river') {
      for (let i = 0; i < basecount; i++) {
        const offset = Math.random() * canvasWidth;
        const baseSpeed = row.type === 'road' ? 2 : 1;
        const randomSpeed = baseSpeed + Math.random(); // velocidade aleatória
        const speed = row.direction * randomSpeed;

        obstacles.push({
          type: row.type === 'road' ? 'car' : 'log',
          row: index,
          x: offset,
          speed,
          width: row.type === 'road' ? TILE_SIZE * 1.5 : TILE_SIZE * 2
        });
      }
    }
  });
}


function handleInput(e) {
  if (!gameStarted || isGameOver) return;
  e.preventDefault(); // previne o scroll indesejado com setas
  const key = e.key.toLowerCase();
  const maxY = gameWorld.length - 1;

  if (key === 'arrowup' || key === 'w') {
    player.y++;
    frogDirection = 'up';
  }
  if ((key === 'arrowdown' || key === 's') && player.y < maxY) {
    if (player.y > 0) player.y--;   
    frogDirection = 'down';
  }


  const maxX = canvasWidth / TILE_SIZE - 1;

  if (player.onLog) {
    if (key === 'arrowleft' || key === 'a') {
      player.x = Math.max(0, player.x - 1);
      frogDirection = 'left';
    }
    if (key === 'arrowright' || key === 'd') {
      player.x = Math.min(maxX, player.x + 1);
      frogDirection = 'right';
    }
  } else {
    if ((key === 'arrowleft' || key === 'a') && player.x > 0) {
      player.x--;
      frogDirection = 'left';
    }
    if ((key === 'arrowright' || key === 'd') && player.x < maxX) {
      player.x++;
      frogDirection = 'right';
    }
  }

  playJumpSound();

  currentScore = Math.max(currentScore, player.y);
}

function drawGame() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  for (let y = 0; y < ROWS_ON_SCREEN; y++) {
    const rowIndex = player.y - Math.floor(ROWS_ON_SCREEN / 2) + y;
    const row = gameWorld[rowIndex];
    if (!row) continue;

    const yPos = canvasHeight - (y + 1) * TILE_SIZE;

    // Fundo do tile
    if (row.type === 'grass') ctx.fillStyle = '#88cc88';
    else if (row.type === 'road') ctx.fillStyle = '#555';
    else if (row.type === 'river') ctx.fillStyle = '#66bbff';
    ctx.fillRect(0, yPos, canvasWidth, TILE_SIZE);

    // Obstáculos (carros e troncos)
    obstacles.forEach(obj => {
      if (obj.row === rowIndex) {
        const img = obj.type === 'car' ? carImg : logImg;
        const imgHeight = TILE_SIZE - 10;
        const yOffset = yPos + (TILE_SIZE - imgHeight) / 2;
        const width = obj.width;

        ctx.save();
        if (obj.speed < 0) {
          // Inverter imagem horizontalmente
          ctx.translate(obj.x + width, yOffset);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0, width, imgHeight);
        } else {
          ctx.translate(obj.x, yOffset);
          ctx.drawImage(img, 0, 0, width, imgHeight);
        }
        ctx.restore();
      }
    });
  }

  // Desenhar o sapo
  const centerRow = Math.floor(ROWS_ON_SCREEN / 2);
  const frogY = canvasHeight - (centerRow + 1) * TILE_SIZE;
  const frogX = player.x * TILE_SIZE;

  const frogSize = 40; // visualmente menor que o tile
  const frogDrawX = frogX + (TILE_SIZE - frogSize) / 2;
  const frogDrawY = frogY + (TILE_SIZE - frogSize) / 2;

  ctx.save();
  ctx.translate(frogDrawX + frogSize / 2, frogDrawY + frogSize / 2);

  // Rotação conforme direção
  switch (frogDirection) {
    case 'left':
      ctx.rotate(-Math.PI / 2);
      break;
    case 'right':
      ctx.rotate(Math.PI / 2);
      break;
    case 'down':
      ctx.rotate(Math.PI);
      break;
    // 'up' = sem rotação
  }

  ctx.drawImage(frogImg, -frogSize / 2, -frogSize / 2, frogSize, frogSize);
  ctx.restore();

  scoreDisplay.textContent = `Score: ${currentScore}`;
}

function gameLoop() { 
  if (isGameOver) return;

  player.onLog = false;
  player.logSpeed = 0;

  obstacles.forEach(obj => {
    obj.x += obj.speed;

    const buffer = 50;
    if (obj.speed > 0 && obj.x > canvasWidth + buffer) {
      obj.x = -obj.width - buffer;
    } else if (obj.speed < 0 && obj.x < -obj.width - buffer) {
      obj.x = canvasWidth + buffer;
    }
  });

  // Espacamento entre objetos colididos
  const BUFFER_VISUAL = 5;

  // Sincroniza velocidades se colidirem (troncos e carros)
  for (let i = 0; i < obstacles.length; i++) {
    for (let j = i + 1; j < obstacles.length; j++) {
      const obj1 = obstacles[i];
      const obj2 = obstacles[j];

      if (obj1.row === obj2.row && obj1.type === obj2.type) {
        const colidem = (
          obj1.x < obj2.x + obj2.width &&
          obj1.x + obj1.width > obj2.x
        );

        if (colidem) {
          const speed1 = Math.abs(obj1.speed);
          const speed2 = Math.abs(obj2.speed);

          // O mais lento assume a velocidade do mais rápido
          if (speed1 < speed2) {
            obj1.speed = obj2.speed;

            // Aplicar buffer apenas no obj1 (o mais lento que herdou)
            const overlap = (obj1.x + obj1.width) - obj2.x;
            if (overlap > 0) {
              const dir = Math.sign(obj1.speed);
              obj1.x -= dir * (overlap + BUFFER_VISUAL);
            }

          } else if (speed2 < speed1) {
            obj2.speed = obj1.speed;

            // Aplicar buffer apenas no obj2 (o mais lento que herdou)
            const overlap = (obj2.x + obj2.width) - obj1.x;
            if (overlap > 0) {
              const dir = Math.sign(obj2.speed);
              obj2.x -= dir * (overlap + BUFFER_VISUAL);
            }
          }
        }
      }
    }
  }

  const playerPx = player.x * TILE_SIZE;
  const playerRow = player.y;
  const row = gameWorld[playerRow];
  const relevantObs = obstacles.filter(o => o.row === playerRow);

  if (row) {
    if (row.type === 'road') {
      relevantObs.forEach(car => {
        if (playerPx < car.x + car.width && playerPx + TILE_SIZE > car.x) {
          triggerGameOver();
        }
      });
    }

    if (row.type === 'river') {
      const log = relevantObs.find(log =>
        playerPx < log.x + log.width && playerPx + TILE_SIZE > log.x
      );

      if (log) {
        player.onLog = true;
        player.logSpeed = log.speed;
      } else {
        triggerGameOver();
      }
    }
  }

  if (player.onLog) {
    player.x += player.logSpeed / TILE_SIZE;

    if (player.x < 0 || player.x >= canvasWidth / TILE_SIZE) {
      triggerGameOver();
    }
  }

  drawGame();
  requestAnimationFrame(gameLoop);
}


function triggerGameOver() {
  isGameOver = true;
  playDeathSound();
  setTimeout(endGame, 500);
}

function endGame() {
  gameStarted = false;
  canvas.style.display = "none";
  scoreDisplay.style.display = "none";
  finalScore.textContent = currentScore;
  gameOverScreen.style.display = "block";

  // Salvar score na API
  saveScoreToAPI();

  // Atualizar scoreboard pegando do backend
  loadScoresFromAPI();
}

function startGame() {
  generateWorld();
  spawnObstacles();
  currentScore = 0;
  isGameOver = false;
  gameStarted = true;
  player = { x: 7, y: 0, onLog: false, logSpeed: 0 };
  drawGame();
  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", handleInput);

window.addEventListener('click', () => {
  const backgroundMusic = document.getElementById("background-music");
  if (backgroundMusic && backgroundMusic.paused) {
    backgroundMusic.volume = volumeControl.value;
    backgroundMusic.loop = true;
    backgroundMusic.play().catch((err) => {
      console.warn("Não foi possível reproduzir a música automaticamente:", err);
    });
  }
}, { once: true });

// Carrega scoreboard da API ao carregar a página (entrada)
loadScoresFromAPI();
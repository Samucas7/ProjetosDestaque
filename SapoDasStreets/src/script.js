// ===========================
// Constantes e configurações gerais
// ===========================

const TAMANHO_BLOCO = 50; // Tamanho de cada bloco (em pixels)
const LINHAS_VISIVEIS = 12; // Quantidade de linhas visíveis na tela
const LARGURA_CANVAS = 800; // Largura da área do jogo
const ALTURA_CANVAS = TAMANHO_BLOCO * LINHAS_VISIVEIS; // Altura com base nas linhas visíveis

// Inicializa o canvas e contexto de desenho
const canvas = document.getElementById("game-canvas");
const contexto = canvas.getContext("2d");
canvas.width = LARGURA_CANVAS;
canvas.height = ALTURA_CANVAS;

// ===========================
// Elementos do DOM
// ===========================

// Seleciona elementos HTML usados no jogo
const entrada = document.getElementById("nickname");
const botaoIniciar = document.getElementById("start-button");
const telaEntrada = document.getElementById("entry-screen");
const telaFim = document.getElementById("game-over-screen");
const pontuacaoFinal = document.getElementById("final-score");
const botaoReiniciar = document.getElementById("restart-button");
const displayPontuacao = document.getElementById("score-display");
const listaScoreboard = document.getElementById("scoreboard");

// ===========================
// Variáveis globais
// ===========================

let pontuacaoAtual = 0; // Pontuação do jogador
let apelidoJogador = ""; // Apelido inserido
let mundo = []; // Mapa com as linhas do jogo (relva, estrada, rio)
let galinha = { x: 7, y: 0 }; // Posição da galinha no grid
let cameraY = 0; // Câmera para centralizar a galinha na tela
let obstaculos = []; // Lista de todos os carros e troncos
let jogoEncerrado = false; // Estado do jogo

// Carrega as imagens (sprites)
const imagemGalinha = new Image();
imagemGalinha.src = "sprites/galinha.png";
const imagemCarro = new Image();
imagemCarro.src = "sprites/carro.png";
const imagemTronco = new Image();
imagemTronco.src = "sprites/tronco.png";

// Habilita botão de iniciar apenas quando um apelido for inserido
entrada.addEventListener("input", () => {
  botaoIniciar.disabled = entrada.value.trim() === "";
});

// Inicia o jogo ao clicar no botão iniciar
botaoIniciar.addEventListener("click", () => {
  apelidoJogador = entrada.value.trim();
  telaEntrada.style.display = "none";
  canvas.style.display = "block";
  displayPontuacao.style.display = "block";
  iniciarJogo();
});

// Volta à tela de entrada ao clicar em reiniciar
botaoReiniciar.addEventListener("click", () => {
  telaFim.style.display = "none";
  telaEntrada.style.display = "block";
  atualizarScoreboard();
});

// Atualiza o placar com os 20 melhores jogadores
function atualizarScoreboard() {
  const pontuacoes = JSON.parse(localStorage.getItem("scoreboard") || "[]");
  pontuacoes.sort((a, b) => b.score - a.score);
  const top20 = pontuacoes.slice(0, 20);
  listaScoreboard.innerHTML = "";
  top20.forEach(jogador => {
    const item = document.createElement("li");
    item.textContent = `${jogador.nickname}: ${jogador.score}`;
    listaScoreboard.appendChild(item);
  });
}

// Gera o mapa do jogo com tipos de linha aleatórios
function gerarMundo() {
  mundo = [];
  for (let i = 0; i < 100; i++) {
    const tipo = i === 0 ? 'relva' : tipoAleatorio();
    const direcao = Math.random() < 0.5 ? 1 : -1; // Aleatoriza direção de movimento
    mundo.push({ tipo, direcao });
  }
}

// Define o tipo da linha (relva, estrada, rio) com base em probabilidade
function tipoAleatorio() {
  const r = Math.random();
  if (r < 0.3) return 'estrada';
  if (r < 0.6) return 'rio';
  return 'relva';
}

// Gera carros e troncos de forma aleatória com velocidades variadas
function gerarObstaculos() {
  obstaculos = [];
  mundo.forEach((linha, indice) => {
    if (linha.tipo === 'estrada' || linha.tipo === 'rio') {
      let velocidadeBase = linha.tipo === 'estrada' ? 2 : 0.5 + Math.random();
      const velocidade = linha.direcao * velocidadeBase;
      for (let i = 0; i < 3; i++) {
        const deslocamento = Math.random() * LARGURA_CANVAS;
        obstaculos.push({
          tipo: linha.tipo === 'estrada' ? 'carro' : 'tronco',
          linha: indice,
          x: deslocamento,
          velocidade,
          largura: linha.tipo === 'estrada' ? TAMANHO_BLOCO * 1.5 : TAMANHO_BLOCO * 2
        });
      }
    }
  });
}

// Movimento controlado (1 passo por tecla)
document.addEventListener("keydown", lidarComTecla);
function lidarComTecla(e) {
  if (jogoEncerrado) return;
  const tecla = e.key.toLowerCase();
  if (tecla === 'arrowup' || tecla === 'w') galinha.y--; // Sobe uma linha
  if ((tecla === 'arrowdown' || tecla === 's') && galinha.y < mundo.length - 1) galinha.y++;
  if ((tecla === 'arrowleft' || tecla === 'a') && galinha.x > 0) galinha.x--;
  if ((tecla === 'arrowright' || tecla === 'd') && galinha.x < LARGURA_CANVAS / TAMANHO_BLOCO - 1) galinha.x++;
  pontuacaoAtual = Math.max(pontuacaoAtual, mundo.length - galinha.y); // Atualiza pontuação
  playFlapSound();
}

// Som ao mover a galinha
const somFlap = new Audio("sons/flap.mp3");
somFlap.volume = 0.5;
function playFlapSound() {
  somFlap.currentTime = 0;
  somFlap.play();
}

// Desenha todo o jogo
function desenharJogo() {
  contexto.clearRect(0, 0, LARGURA_CANVAS, ALTURA_CANVAS);
  cameraY = galinha.y * TAMANHO_BLOCO - ALTURA_CANVAS / 2; // Centraliza a galinha verticalmente

  for (let y = 0; y < LINHAS_VISIVEIS; y++) {
    const linhaIndex = galinha.y - Math.floor(LINHAS_VISIVEIS / 2) + y;
    const linha = mundo[linhaIndex];
    if (!linha) continue;

    const yPos = y * TAMANHO_BLOCO;
    // Cor de fundo por tipo de linha
    if (linha.tipo === 'relva') contexto.fillStyle = '#88cc88';
    else if (linha.tipo === 'estrada') contexto.fillStyle = '#555';
    else if (linha.tipo === 'rio') contexto.fillStyle = '#66bbff';
    contexto.fillRect(0, yPos, LARGURA_CANVAS, TAMANHO_BLOCO);

    // Desenha os obstáculos na linha
    obstaculos.forEach(obj => {
      if (obj.linha === linhaIndex) {
        if (obj.tipo === 'carro') {
          contexto.drawImage(imagemCarro, obj.x, yPos + 5, obj.largura, TAMANHO_BLOCO - 10);
        } else {
          contexto.drawImage(imagemTronco, obj.x, yPos + 10, obj.largura, TAMANHO_BLOCO - 20);
        }
      }
    });
  }

  // Desenha a galinha no centro da tela
  const galinhaY = Math.floor(LINHAS_VISIVEIS / 2) * TAMANHO_BLOCO;
  const galinhaX = galinha.x * TAMANHO_BLOCO;
  contexto.drawImage(imagemGalinha, galinhaX, galinhaY, TAMANHO_BLOCO, TAMANHO_BLOCO);

  // Atualiza a pontuação visível na tela
  displayPontuacao.textContent = `Score: ${pontuacaoAtual}`;
}

// Ciclo principal do jogo (animação)
function cicloDeJogo() {
  if (jogoEncerrado) return;

  // Atualiza posição dos obstáculos com base na velocidade
  obstaculos.forEach(obj => {
    obj.x += obj.velocidade;
    if (obj.x > LARGURA_CANVAS + 200) obj.x = -200; // Loop para o outro lado
    if (obj.x < -200) obj.x = LARGURA_CANVAS + 200;
  });

  // Verifica colisão
  const posX = galinha.x * TAMANHO_BLOCO;
  const linhaAtual = galinha.y;
  const tipo = mundo[linhaAtual];
  const obsRelevantes = obstaculos.filter(o => o.linha === linhaAtual);

  if (tipo.tipo === 'estrada') {
    obsRelevantes.forEach(carro => {
      if (posX < carro.x + carro.largura && posX + TAMANHO_BLOCO > carro.x) {
        encerrarJogo();
      }
    });
  }

  if (tipo.tipo === 'rio') {
    const emTronco = obsRelevantes.some(tronco =>
      posX < tronco.x + tronco.largura && posX + TAMANHO_BLOCO > tronco.x
    );
    if (!emTronco) encerrarJogo();
  }

  desenharJogo();
  requestAnimationFrame(cicloDeJogo); // Chama o próximo frame
}

// Finaliza o jogo e salva a pontuação
function encerrarJogo() {
  jogoEncerrado = true;
  setTimeout(() => {
    canvas.style.display = "none";
    displayPontuacao.style.display = "none";
    pontuacaoFinal.textContent = pontuacaoAtual;
    telaFim.style.display = "block";

    const pontuacoes = JSON.parse(localStorage.getItem("scoreboard") || "[]");
    pontuacoes.push({ nickname: apelidoJogador, score: pontuacaoAtual });
    localStorage.setItem("scoreboard", JSON.stringify(pontuacoes));
  }, 500);
}

// Inicializa variáveis e inicia o ciclo de jogo
function iniciarJogo() {
  gerarMundo();
  gerarObstaculos();
  pontuacaoAtual = 0;
  jogoEncerrado = false;
  galinha = { x: 7, y: mundo.length - 1 }; // Começa na base do mapa
  desenharJogo();
  requestAnimationFrame(cicloDeJogo);
}

// Exibe o placar ao carregar a página
atualizarScoreboard();

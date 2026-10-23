// ======================================
// DIREITA VS ESQUERDA 3.0
// SISTEMA PRINCIPAL DO JOGO
// ======================================

// ELEMENTOS HTML

const arena = document.querySelector("#arena");
const mensagem = document.querySelector("#mensagem");
const relogio = document.querySelector("#tempo");
const roundLabel = document.querySelector("#round");

const teclas = new Set();

// CONFIGURAÇÕES

const DURACAO_ROUND = 60;
const GRAVIDADE = 1550;
const FORCA_PULO = 620;
const VELOCIDADE = 280;

let tempo = DURACAO_ROUND;
let round = 1;
let jogoAtivo = true;
let intervalo = false;

let ultimoFrame = performance.now();
let timerRound = null;

// ======================================
// JOGADORES
// ======================================

const jogadores = [
    {
        elemento: document.querySelector(".lutador1"),
        barra: document.querySelector("#vida1"),
        placar: document.querySelector("#vitorias1"),

        numero: 1,
        vida: 100,
        vitorias: 0,

        x: 100,
        y: 0,

        velocidadeY: 0,
        direcao: 1,

        defesa: false,
        atacando: false,

        proximoAtaque: 0,
        timerAnimacao: null,
        animacaoId: 0
    },

    {
        elemento: document.querySelector(".lutador2"),
        barra: document.querySelector("#vida2"),
        placar: document.querySelector("#vitorias2"),

        numero: 2,
        vida: 100,
        vitorias: 0,

        x: 650,
        y: 0,

        velocidadeY: 0,
        direcao: -1,

        defesa: false,
        atacando: false,

        proximoAtaque: 0,
        timerAnimacao: null,
        animacaoId: 0
    }
];

// ======================================
// SISTEMA DE SPRITES
// ======================================

function trocarSprite(jogador, pose) {

    const imagem = jogador.elemento;

    const numero = jogador.numero;

    const caminho = `sprites/jogador${numero}/${pose}.png`;

    const imagemOriginal = `lutador${numero}.png`;

    if (imagem.dataset.pose === pose) return;

    imagem.dataset.pose = pose;

    imagem.onerror = function() {
        imagem.onerror = null;
        imagem.src = imagemOriginal;
    };

    imagem.src = caminho;
}

// ======================================
// ANIMAÇÕES DE ATAQUE
// ======================================

function animarGolpe(jogador, tipo, duracao) {

    clearTimeout(jogador.timerAnimacao);

    jogador.animacaoId++;

    const id = jogador.animacaoId;

    jogador.atacando = true;

    trocarSprite(jogador, tipo);

    jogador.elemento.classList.add("atacando");

    jogador.timerAnimacao = setTimeout(() => {

        if (id !== jogador.animacaoId) return;

        jogador.atacando = false;

        jogador.elemento.classList.remove("atacando");

        atualizarPose(jogador);

    }, duracao);
}

// ======================================
// ATUALIZAR POSE
// ======================================

function atualizarPose(jogador) {

    if (jogador.atacando) return;

    if (jogador.defesa) {
        trocarSprite(jogador, "defesa");
    } else {
        trocarSprite(jogador, "parado");
    }
}

// ======================================
// BARRA DE VIDA
// ======================================

function atualizarVida(jogador) {

    jogador.barra.style.width = jogador.vida + "%";

    if (jogador.vida > 60) {

        jogador.barra.style.background = "#00dd44";

    } else if (jogador.vida > 30) {

        jogador.barra.style.background = "yellow";

    } else {

        jogador.barra.style.background = "red";
    }
}

// ======================================
// SISTEMA DE ATAQUES
// ======================================

function atacar(numero, tipo) {

    if (!jogoAtivo || intervalo) return;

    const atacante = jogadores[numero];
    const defensor = jogadores[1 - numero];

    const agora = performance.now();

    if (agora < atacante.proximoAtaque) return;
    if (atacante.defesa) return;

    let dano = 0;
    let alcance = 0;
    let espera = 0;

    // TIPOS DE GOLPES

    switch (tipo) {

        case "soco":
            dano = 10;
            alcance = 130;
            espera = 400;
            break;

        case "chute":
            dano = 15;
            alcance = 170;
            espera = 650;
            break;

        case "soco-forte":
            dano = 20;
            alcance = 145;
            espera = 900;
            break;

        case "chute-especial":
            dano = 25;
            alcance = 190;
            espera = 1200;
            break;

        default:
            return;
    }

    atacante.proximoAtaque = agora + espera;

    // EXECUTAR ANIMAÇÃO

    animarGolpe(atacante, tipo, espera * 0.65);

    // POSIÇÃO DOS LUTADORES

    const centroAtacante =
        atacante.x + atacante.elemento.offsetWidth / 2;

    const centroDefensor =
        defensor.x + defensor.elemento.offsetWidth / 2;

    const distancia = Math.abs(
        centroAtacante - centroDefensor
    );

    const diferencaAltura = Math.abs(
        atacante.y - defensor.y
    );

    // VERIFICAR DIREÇÃO DO ATAQUE

    const naFrente =
        (centroDefensor - centroAtacante) *
        atacante.direcao > 0;

    // VERIFICAR SE ACERTOU

    if (
        distancia <= alcance &&
        diferencaAltura < 90 &&
        naFrente
    ) {

        // DEFESA REDUZ O DANO

        if (defensor.defesa) {
            dano = Math.ceil(dano * 0.2);
        }

        defensor.vida = Math.max(
            0,
            defensor.vida - dano
        );

        atualizarVida(defensor);

        // EFEITO VISUAL DE DANO

        defensor.elemento.classList.remove("recebeu-dano");

        void defensor.elemento.offsetWidth;

        defensor.elemento.classList.add("recebeu-dano");

        setTimeout(() => {
            defensor.elemento.classList.remove("recebeu-dano");
        }, 200);

        // VERIFICAR NOCAUTE

        if (defensor.vida <= 0) {
            finalizarRound(numero);
        }
    }
}

// ======================================
// SISTEMA DE ROUNDS
// ======================================

function finalizarRound(vencedor) {

    if (!jogoAtivo || intervalo) return;

    intervalo = true;

    teclas.clear();

    if (vencedor !== null) {

        jogadores[vencedor].vitorias++;

        jogadores[vencedor].placar.textContent =
            "Rounds: " + jogadores[vencedor].vitorias;
    }

    // VERIFICAR VENCEDOR FINAL

    if (
        vencedor !== null &&
        jogadores[vencedor].vitorias >= 2
    ) {

        jogoAtivo = false;

        mensagem.textContent =
            `🏆 JOGADOR ${vencedor + 1} VENCEU!`;

        return;
    }

    if (vencedor === null) {

        mensagem.textContent = "EMPATE!";

    } else {

        mensagem.textContent =
            `JOGADOR ${vencedor + 1} VENCEU O ROUND!`;
    }

    // PRÓXIMO ROUND

    timerRound = setTimeout(() => {

        if (!jogoAtivo) return;

        round++;

        iniciarRound();

    }, 2500);
}

// ======================================
// INICIAR ROUND
// ======================================

function iniciarRound() {

    intervalo = false;

    tempo = DURACAO_ROUND;

    relogio.textContent = tempo;

    mensagem.textContent = "";

    roundLabel.textContent = `ROUND ${round}`;

    teclas.clear();

    jogadores.forEach((jogador, indice) => {

        clearTimeout(jogador.timerAnimacao);

        jogador.animacaoId++;

        jogador.vida = 100;

        jogador.y = 0;
        jogador.velocidadeY = 0;

        jogador.defesa = false;
        jogador.atacando = false;

        jogador.proximoAtaque = 0;

        jogador.elemento.classList.remove(
            "atacando",
            "defendendo",
            "recebeu-dano"
        );

        if (indice === 0) {

            jogador.x = arena.clientWidth * 0.12;
            jogador.direcao = 1;

        } else {

            jogador.x = arena.clientWidth * 0.75;
            jogador.direcao = -1;
        }

        jogador.x = Math.max(
            0,
            Math.min(
                arena.clientWidth - jogador.elemento.offsetWidth,
                jogador.x
            )
        );

        jogador.elemento.style.left = jogador.x + "px";
        jogador.elemento.style.bottom = "0px";

        jogador.elemento.style.transform =
            `scaleX(${jogador.direcao})`;

        jogador.elemento.dataset.pose = "";

        trocarSprite(jogador, "parado");

        atualizarVida(jogador);
    });
}

// ======================================
// CONTROLES DO TECLADO
// ======================================

document.addEventListener("keydown", (evento) => {

    const tecla = evento.key.toLowerCase();

    if (
        tecla.startsWith("arrow") ||
        ["w", "a", "s", "d"].includes(tecla)
    ) {
        evento.preventDefault();
    }

    if (!jogoAtivo || intervalo) return;

    // EVITAR REPETIÇÃO AUTOMÁTICA

    if (!teclas.has(tecla)) {

        // JOGADOR 1

        if (tecla === "f") {
            atacar(0, "soco");
        }

        if (tecla === "g") {
            atacar(0, "chute");
        }

        if (tecla === "h") {
            atacar(0, "soco-forte");
        }

        if (tecla === "j") {
            atacar(0, "chute-especial");
        }

        // JOGADOR 2

        if (tecla === "k") {
            atacar(1, "soco");
        }

        if (tecla === "l") {
            atacar(1, "chute");
        }

        if (tecla === "o") {
            atacar(1, "soco-forte");
        }

        if (tecla === "p") {
            atacar(1, "chute-especial");
        }
    }

    teclas.add(tecla);
});

// SOLTAR TECLAS

document.addEventListener("keyup", (evento) => {

    teclas.delete(evento.key.toLowerCase());

});

// EVITAR TECLAS PRESAS

window.addEventListener("blur", () => {
    teclas.clear();
});

// ======================================
// MOVIMENTAÇÃO
// ======================================

function movimentar(
    jogador,
    esquerda,
    direita,
    pulo,
    defesa,
    dt
) {

    // DEFESA

    jogador.defesa =
        teclas.has(defesa) &&
        jogador.y === 0 &&
        !jogador.atacando;

    // MOVIMENTAÇÃO HORIZONTAL

    if (!jogador.defesa) {

        if (teclas.has(esquerda)) {

            jogador.x -= VELOCIDADE * dt;

            jogador.direcao = -1;
        }

        if (teclas.has(direita)) {

            jogador.x += VELOCIDADE * dt;

            jogador.direcao = 1;
        }
    }

    // PULO

    if (
        teclas.has(pulo) &&
        jogador.y === 0 &&
        !jogador.defesa
    ) {

        jogador.velocidadeY = FORCA_PULO;
    }

    // GRAVIDADE

    jogador.y += jogador.velocidadeY * dt;

    jogador.velocidadeY -= GRAVIDADE * dt;

    // CHÃO

    if (jogador.y < 0) {

        jogador.y = 0;

        jogador.velocidadeY = 0;
    }

    // LIMITES DA ARENA

    const largura = jogador.elemento.offsetWidth;

    jogador.x = Math.max(
        0,
        Math.min(
            arena.clientWidth - largura,
            jogador.x
        )
    );

    // ATUALIZAR POSIÇÃO

    jogador.elemento.style.left = jogador.x + "px";

    jogador.elemento.style.bottom = jogador.y + "px";

    jogador.elemento.style.transform =
        `scaleX(${jogador.direcao})`;

    // EFEITO DE DEFESA

    jogador.elemento.classList.toggle(
        "defendendo",
        jogador.defesa
    );

    atualizarPose(jogador);
}

// ======================================
// LOOP PRINCIPAL
// ======================================

function atualizarJogo(agora) {

    const dt = Math.min(
        (agora - ultimoFrame) / 1000,
        0.04
    );

    ultimoFrame = agora;

    if (jogoAtivo && !intervalo) {

        tempo -= dt;

        if (tempo <= 0) {

            tempo = 0;

            // VENCEDOR POR VIDA RESTANTE

            if (jogadores[0].vida > jogadores[1].vida) {

                finalizarRound(0);

            } else if (jogadores[1].vida > jogadores[0].vida) {

                finalizarRound(1);

            } else {

                finalizarRound(null);
            }
        }

        relogio.textContent = Math.ceil(tempo);

        if (!intervalo) {

            // JOGADOR 1

            movimentar(
                jogadores[0],
                "a",
                "d",
                "w",
                "s",
                dt
            );

            // JOGADOR 2

            movimentar(
                jogadores[1],
                "arrowleft",
                "arrowright",
                "arrowup",
                "arrowdown",
                dt
            );
        }
    }

    requestAnimationFrame(atualizarJogo);
}

// ======================================
// REINICIAR JOGO
// ======================================

function reiniciarJogo() {

    clearTimeout(timerRound);

    jogoAtivo = true;
    intervalo = false;

    round = 1;

    jogadores.forEach((jogador) => {

        jogador.vitorias = 0;

        jogador.placar.textContent = "Rounds: 0";
    });

    iniciarRound();
}

// ======================================
// INICIALIZAÇÃO
// ======================================

iniciarRound();

requestAnimationFrame(atualizarJogo);
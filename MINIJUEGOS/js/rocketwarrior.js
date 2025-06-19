// Lienzo
let tablero;
let anchoTablero = 800;
let altoTablero = 450;
let contexto;

// Cohete
let anchoCohete = 85; // Relación anchura/altura
let altoCohete = 40;
let posXCohete = anchoTablero / 8;
let posYCohete = altoTablero / 2;
let imgCohete;

let cohete = {
    x: posXCohete,
    y: posYCohete,
    ancho: anchoCohete,
    alto: altoCohete
}

// Barreras
let tuberiaArray = [];
let anchoTuberia = 45; // Relación anchura/altura
let altoTuberia = 320;
let posXInicialTuberia = anchoTablero;
let posYInicialTuberia = 0;

let imgTuberiaSuperior;
let imgTuberiaInferior;

// Física
let velocidadX = -2; // Velocidad de movimiento de las barreras hacia la izquierda
let velocidadY = 0; // Velocidad del salto del cohete
let gravedad = 0.08; // Gravedad

let finJuego = false;
let puntuacion = 0;

window.onload = function () {
    tablero = document.getElementById("tablero");
    tablero.height = altoTablero;
    tablero.width = anchoTablero;
    contexto = tablero.getContext("2d"); // Utilizado para dibujar en el tablero

    // Cargar imágenes
    imgCohete = new Image();
    imgCohete.src = "../img/rocket.png";
    imgCohete.onload = function () {
        contexto.drawImage(imgCohete, cohete.x, cohete.y, cohete.ancho, cohete.alto);
    }

    imgTuberiaSuperior = new Image();
    imgTuberiaSuperior.src = "../img/toppipe.png";

    imgTuberiaInferior = new Image();
    imgTuberiaInferior.src = "../img/bottompipe.png";

    requestAnimationFrame(actualizar);
    setInterval(colocarTuberias, 1500); // Cada 1.5 segundos
    document.addEventListener("keydown", moverCohete);
}

function actualizar() {
    requestAnimationFrame(actualizar);
    if (finJuego) {
        return;
    }
    contexto.clearRect(0, 0, tablero.width, tablero.height);

    // Cohete
    velocidadY += gravedad;
    cohete.y = Math.max(cohete.y + velocidadY, 0); // Aplicar gravedad a la posición actual del cohete, limitando que no pase la parte superior del lienzo
    contexto.drawImage(imgCohete, cohete.x, cohete.y, cohete.ancho, cohete.alto);

    if (cohete.y > tablero.height) {
        finJuego = true;
    }

    // Barreras
    for (let i = 0; i < tuberiaArray.length; i++) {
        let tuberia = tuberiaArray[i];
        tuberia.x += velocidadX;
        contexto.drawImage(tuberia.img, tuberia.x, tuberia.y, tuberia.ancho, tuberia.alto);

        if (!tuberia.pasada && cohete.x > tuberia.x + tuberia.ancho) {
            puntuacion += 0.5; // 0.5 porque hay 2 tubos, así que 0.5 * 2 = 1, 1 por cada conjunto de tubos
            tuberia.pasada = true;
        }

        if (detectarColision(cohete, tuberia)) {
            finJuego = true;
        }
    }

    // Limpiar barreras
    while (tuberiaArray.length > 0 && tuberiaArray[0].x < -anchoTuberia) {
        tuberiaArray.shift(); // Elimina el primer elemento del array
    }

    // Puntuación
    contexto.fillStyle = "white";
    contexto.font = "45px sans-serif";
    contexto.fillText(puntuacion, 5, 45);

    if (finJuego) {
        contexto.fillText("GAME OVER", 5, 90);
    }
}

function colocarTuberias() {
    if (finJuego) {
        return;
    }

    let posYAleatoriaTuberia = posYInicialTuberia - altoTuberia / 4 - Math.random() * (altoTuberia / 2);
    let espacioApertura = tablero.height / 3;

    let tuberiaSuperior = {
        img: imgTuberiaSuperior,
        x: posXInicialTuberia,
        y: posYAleatoriaTuberia,
        ancho: anchoTuberia,
        alto: altoTuberia,
        pasada: false
    }
    tuberiaArray.push(tuberiaSuperior);

    let tuberiaInferior = {
        img: imgTuberiaInferior,
        x: posXInicialTuberia,
        y: posYAleatoriaTuberia + altoTuberia + espacioApertura,
        ancho: anchoTuberia,
        alto: altoTuberia,
        pasada: false
    }
    tuberiaArray.push(tuberiaInferior);
}

function moverCohete(e) {
    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") {
        // Saltar
        velocidadY = -2;

        // Reiniciar juego
        if (finJuego) {
            cohete.y = posYCohete;
            tuberiaArray = [];
            puntuacion = 0;
            finJuego = false;
        }
    }
}

function detectarColision(a, b) {
    return a.x < b.x + b.ancho &&   // La esquina superior izquierda de a no alcanza la esquina superior derecha de b
        a.x + a.ancho > b.x &&   // La esquina superior derecha de a pasa la esquina superior izquierda de b
        a.y < b.y + b.alto &&  // La esquina superior izquierda de a no alcanza la esquina inferior izquierda de b
        a.y + a.alto > b.y;    // La esquina inferior izquierda de a pasa la esquina superior izquierda de b
}

// Cargar el recurso CSS del tablero
// tablero
let tileSize = 44;
let rows = 14;
let columns = 16;

let board;
let boardWidth = tileSize * columns; // 32 * 16
let boardHeight = tileSize * rows; // 32 * 16
let context;

// Nave
let shipWidth = 208;  // 5.5 cm ≈ 208 px
let shipHeight = 113; // 3 cm ≈ 113 px
let shipX = boardWidth / 2 - shipWidth / 2; // Centrado horizontal
let shipY = boardHeight - shipHeight;      // Pegado al borde inferior

let nave = {
    x: shipX,
    y: shipY,
    width: shipWidth,
    height: shipHeight
}

let imagenNave;
let velocidadNaveX = tileSize; // velocidad de movimiento de la nave

// Alienígenas
let alienArray = [];
let alienWidth = tileSize * 2;
let alienHeight = tileSize;
let alienX = tileSize;
let alienY = tileSize;
let imagenAlienigena;

let alienFilas = 2;
let alienColumnas = 3;
let contadorAlien = 0; // número de alienígenas a derrotar
let velocidadAlienX = 1; // velocidad de movimiento de los alienígenas

// Balas
let balas = [];
let velocidadBalaY = -10; // velocidad de movimiento de la bala

let puntaje = 0;
let finJuego = false;

window.onload = function () {
    board = document.getElementById("tablero");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d"); // utilizado para dibujar en el tablero

    // Cargar imágenes
    imagenNave = new Image();
    imagenNave.src = "../img/ship.png";
    imagenNave.onload = function () {
        context.drawImage(imagenNave, nave.x, nave.y, nave.width, nave.height);
    }

    imagenAlienigena = new Image();
    imagenAlienigena.src = "../img/alien-magenta.png";
    crearAlienigenas();

    requestAnimationFrame(actualizar);
    document.addEventListener("keydown", moverNave);
    document.addEventListener("keyup", disparar);
}

function actualizar() {
    requestAnimationFrame(actualizar);

    if (finJuego) {
        return;
    }

    context.clearRect(0, 0, board.width, board.height);

    // Nave
    context.drawImage(imagenNave, nave.x, nave.y, nave.width, nave.height);

    // Alienígenas
    for (let i = 0; i < alienArray.length; i++) {
        let alien = alienArray[i];
        if (alien.vivo) {
            alien.x += velocidadAlienX;

            // Si el alienígena toca los bordes
            if (alien.x + alien.width >= board.width || alien.x <= 0) {
                velocidadAlienX *= -1;
                alien.x += velocidadAlienX * 2;

                // Mover todos los alienígenas una fila hacia abajo
                for (let j = 0; j < alienArray.length; j++) {
                    alienArray[j].y += alienHeight;
                }
            }
            context.drawImage(imagenAlienigena, alien.x, alien.y, alien.width, alien.height);

            if (alien.y >= nave.y) {
                finJuego = true;
            }
        }
    }

    // Balas
    for (let i = 0; i < balas.length; i++) {
        let bala = balas[i];
        bala.y += velocidadBalaY;
        context.fillStyle = "white";
        context.fillRect(bala.x, bala.y, bala.width, bala.height);

        // Colisión de balas con alienígenas
        for (let j = 0; j < alienArray.length; j++) {
            let alien = alienArray[j];
            if (!bala.usada && alien.vivo && detectarColision(bala, alien)) {
                bala.usada = true;
                alien.vivo = false;
                contadorAlien--;
                puntaje += 100;
            }
        }
    }

    // Limpiar balas
    while (balas.length > 0 && (balas[0].usada || balas[0].y < 0)) {
        balas.shift(); // Elimina el primer elemento del arreglo
    }

    // Siguiente nivel
    if (contadorAlien == 0) {
        // Incrementar el número de alienígenas en columnas y filas en 1
        puntaje += alienColumnas * alienFilas * 100; // Puntos de bonificación :)
        alienColumnas = Math.min(alienColumnas + 1, columns / 2 - 2); // Límite en 6
        alienFilas = Math.min(alienFilas + 1, rows - 4);  // Límite en 12
        if (velocidadAlienX > 0) {
            velocidadAlienX += 0.2; // Aumentar la velocidad de movimiento de los alienígenas hacia la derecha
        } else {
            velocidadAlienX -= 0.2; // Aumentar la velocidad de movimiento de los alienígenas hacia la izquierda
        }
        alienArray = [];
        balas = [];
        crearAlienigenas();
    }

    // Puntaje
    context.fillStyle = "white";
    context.font = "16px courier";
    context.fillText(puntaje, 5, 20);
}

function moverNave(e) {
    if (finJuego) {
        return;
    }

    if (e.code == "ArrowLeft" && nave.x - velocidadNaveX >= 0) {
        nave.x -= velocidadNaveX; // Mover a la izquierda una baldosa
    } else if (e.code == "ArrowRight" && nave.x + velocidadNaveX + nave.width <= board.width) {
        nave.x += velocidadNaveX; // Mover a la derecha una baldosa
    }
}

function crearAlienigenas() {
    for (let c = 0; c < alienColumnas; c++) {
        for (let r = 0; r < alienFilas; r++) {
            let alien = {
                img: imagenAlienigena,
                x: alienX + c * alienWidth,
                y: alienY + r * alienHeight,
                width: alienWidth,
                height: alienHeight,
                vivo: true
            }
            alienArray.push(alien);
        }
    }
    contadorAlien = alienArray.length;
}

function disparar(e) {
    if (finJuego) {
        return;
    }

    if (e.code == "Space") {
        // Disparar
        let bala = {
            x: nave.x + nave.width * 15 / 32,
            y: nave.y,
            width: tileSize / 8,
            height: tileSize / 2,
            usada: false
        }
        balas.push(bala);
    }
}

function detectarColision(a, b) {
    return a.x < b.x + b.width &&   // La esquina superior izquierda de a no alcanza la esquina superior derecha de b
        a.x + a.width > b.x &&   // La esquina superior derecha de a pasa la esquina superior izquierda de b
        a.y < b.y + b.height &&  // La esquina superior izquierda de a no alcanza la esquina inferior izquierda de b
        a.y + a.height > b.y;    // La esquina inferior izquierda de a pasa la esquina superior izquierda de b
}

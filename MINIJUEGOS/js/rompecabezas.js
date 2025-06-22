var filas = 5;
var columnas = 5;

var currTile; // Imagen actualmente seleccionada
var otherTile; // Otra imagen para intercambiar

var turnos = 0;

window.onload = function () {
    // Inicializar el tablero de 5x5
    for (let r = 0; r < filas; r++) {
        for (let c = 0; c < columnas; c++) {
            //<img>
            let casilla = document.createElement("img");
            casilla.src = "../img/rc/blank.jpg";

            // FUNCIONALIDAD DE ARRASTRE
            casilla.addEventListener("dragstart", dragStart); // Iniciar arrastre
            casilla.addEventListener("dragover", dragOver);   // Arrastrar sobre
            casilla.addEventListener("dragenter", dragEnter); // Entrar en una zona de destino
            casilla.addEventListener("dragleave", dragLeave); // Salir de una zona de destino
            casilla.addEventListener("drop", dragDrop);       // Soltar
            casilla.addEventListener("dragend", dragEnd);     // Fin del arrastre

            document.getElementById("tablero").append(casilla);
        }

        document.addEventListener("keydown", function(e) {
        if (e.code == "KeyH") {
            window.top.location.href = "../prueba.html";
            }
        });
    }

    // Piezas
    let piezas = [];
    for (let i = 1; i <= filas * columnas; i++) {
        piezas.push(i.toString()); // Añadir "1" a "25" al array (nombres de imágenes del rompecabezas)
    }
    piezas.reverse();
    for (let i = 0; i < piezas.length; i++) {
        let j = Math.floor(Math.random() * piezas.length);

        // Intercambio
        let tmp = piezas[i];
        piezas[i] = piezas[j];
        piezas[j] = tmp;
    }

    for (let i = 0; i < piezas.length; i++) {
        let casilla = document.createElement("img");
        casilla.src = "../img/rc/" + piezas[i] + ".jpg";

        // FUNCIONALIDAD DE ARRASTRE
        casilla.addEventListener("dragstart", dragStart); // Iniciar arrastre
        casilla.addEventListener("dragover", dragOver);   // Arrastrar sobre
        casilla.addEventListener("dragenter", dragEnter); // Entrar en una zona de destino
        casilla.addEventListener("dragleave", dragLeave); // Salir de una zona de destino
        casilla.addEventListener("drop", dragDrop);       // Soltar
        casilla.addEventListener("dragend", dragEnd);     // Fin del arrastre

        document.getElementById("piezas").append(casilla);
    }
}


// ARRASRE DE PIEZAS
function dragStart() {
    currTile = this; // 'this' hace referencia a la imagen actualmente seleccionada
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
}

function dragLeave() {

}

function dragDrop() {
    otherTile = this; // 'this' hace referencia a la otra imagen para intercambiar
}

function dragEnd() {
    
    if (currTile.src.includes("blank")) {
        return;
    }
    let currImg = currTile.src;
    let otherImg = otherTile.src;
    currTile.src = otherImg;
    otherTile.src = currImg;

    turnos += 1;
    document.getElementById("turnos").innerText = turnos;
}
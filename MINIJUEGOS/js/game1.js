// Thor's Lightning Maze Game
class ThorGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 40;
        this.mapWidth = 20;
        this.mapHeight = 15;
        
        // Estado del juego
        this.level = 1;
        this.lives = 3;
        this.score = 0;
        this.gameRunning = true;
        
        // Jugador
        this.player = {
            x: 1,
            y: 1,
            direction: 'down'
        };
        
        // Posición de la meta (esquina derecha)
        this.goal = {
            x: this.mapWidth - 2,
            y: 1
        };
        
        // objetos del juego
        this.enemies = [];
        this.lightnings = [];
        this.explosions = [];
        this.map = [];
        
        // Animación
        this.animFrame = 0;
        this.lastTime = 0;
        
        // Manejo de entradas
        this.keys = {};
        this.lastKeyTime = 0;
        
        this.initGame();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    initGame() {
        this.generateMap();
        this.spawnEnemies();
        this.updateUI();
    }
    
    generateMap() {
        // Inicializar mapa con paredes
        this.map = [];
        for (let y = 0; y < this.mapHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                // Borde de las paredes
                if (x === 0 || x === this.mapWidth - 1 || y === 0 || y === this.mapHeight - 1) {
                    this.map[y][x] = 'wall';
                }
                // Paredes internas fijas (patron de cuadricula)
                else if (x % 2 === 0 && y % 2 === 0) {
                    this.map[y][x] = 'wall';
                }
                else {
                    this.map[y][x] = 'empty';
                }
            }
        }
        
        // Añade paredes destructivas de manera random
        for (let y = 1; y < this.mapHeight - 1; y++) {
            for (let x = 1; x < this.mapWidth - 1; x++) {
                if (this.map[y][x] === 'empty') {
                    // No coloques paredes cerca del inicio o la meta del jugador.
                    if ((Math.abs(x - 1) <= 1 && Math.abs(y - 1) <= 1) ||
                        (Math.abs(x - this.goal.x) <= 1 && Math.abs(y - this.goal.y) <= 1)) {
                        continue;
                    }
                    
                    // Posibilidad aleatoria de colocar un muro destructible
                    if (Math.random() < 0.3) {
                        this.map[y][x] = 'destructible';
                    }
                }
            }
        }
        
        // Asegúrese de que el inicio del jugador y la portería estén vacíos
        this.map[1][1] = 'empty';
        this.map[this.goal.y][this.goal.x] = 'empty';
    }
    
    spawnEnemies() {
        this.enemies = [];
        const numEnemies = Math.min(3 + this.level, 8);
        
        for (let i = 0; i < numEnemies; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (this.mapWidth - 2)) + 1;
                y = Math.floor(Math.random() * (this.mapHeight - 2)) + 1;
            } while (
                this.map[y][x] !== 'empty' ||
                (Math.abs(x - 1) <= 2 && Math.abs(y - 1) <= 2) || // NNo muy cerca al jugador
                (x === this.goal.x && y === this.goal.y) // No en la meta
            );
            
            this.enemies.push({
                x: x,
                y: y,
                direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)],
                moveTimer: 0,
                speed: 120 - (this.level * 5) // Los enemigos van mas rapido cada nivel
            });
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Manejar la colocación de los rayos
            if (e.code === 'Space' && this.gameRunning) {
                e.preventDefault();
                this.placeLightning();
            }
            
            // Manejar Restart
            if (e.key.toLowerCase() === 'r') {
                this.restart();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    placeLightning() {
        // Comprueba si ya hay un rayo en la posición del jugador
        const existingLightning = this.lightnings.find(l => l.x === this.player.x && l.y === this.player.y);
        if (existingLightning) return;
        
        // Limitar el número de rayos activos
        if (this.lightnings.length >= 3) return;
        
        this.lightnings.push({
            x: this.player.x,
            y: this.player.y,
            timer: 160, // 2 seconds at 60fps
            exploded: false
        });
    }
    
    update(deltaTime) {
        if (!this.gameRunning) return;
        
        this.animFrame += deltaTime * 0.01;
        
        // Actualizar Jugador
        this.updatePlayer(deltaTime);
        
        // Actualizar enemigos 
        this.updateEnemies(deltaTime);
        
        // Actualizar rayos
        this.updateLightnings();
        
        // Actualizar explosiones
        this.updateExplosions();
        
        // Comprobar colisiones
        this.checkCollisions();
        
        // Verificar condición ganadora
        if (this.player.x === this.goal.x && this.player.y === this.goal.y) {
            this.nextLevel();
        }
    }
    
    updatePlayer(deltaTime) {
        const currentTime = Date.now();
        if (currentTime - this.lastKeyTime < 150) return; // Evitar movimientos demasiado rápidos
        
        let newX = this.player.x;
        let newY = this.player.y;
        
        if (this.keys['w'] || this.keys['arrowup']) {
            newY--;
            this.player.direction = 'up';
        } else if (this.keys['s'] || this.keys['arrowdown']) {
            newY++;
            this.player.direction = 'down';
        } else if (this.keys['a'] || this.keys['arrowleft']) {
            newX--;
            this.player.direction = 'left';
        } else if (this.keys['d'] || this.keys['arrowright']) {
            newX++;
            this.player.direction = 'right';
        } else {
            return; // Sin movimiento
        }
        
        // Comprobar límites y colisiones
        if (this.canMoveTo(newX, newY)) {
            this.player.x = newX;
            this.player.y = newY;
            this.lastKeyTime = currentTime;
        }
    }
    
    updateEnemies(deltaTime) {
        this.enemies.forEach(enemy => {
            enemy.moveTimer -= deltaTime;
            
            if (enemy.moveTimer <= 0) {
                enemy.moveTimer = enemy.speed;
                
                // Intenta moverte en la dirección actual
                let newX = enemy.x;
                let newY = enemy.y;
                
                switch (enemy.direction) {
                    case 'up': newY--; break;
                    case 'down': newY++; break;
                    case 'left': newX--; break;
                    case 'right': newX++; break;
                }
                
                // Si no puedes moverte, elige una nueva dirección aleatoria
                if (!this.canMoveTo(newX, newY)) {
                    const directions = ['up', 'down', 'left', 'right'];
                    enemy.direction = directions[Math.floor(Math.random() * directions.length)];
                } else {
                    enemy.x = newX;
                    enemy.y = newY;
                }
            }
        });
    }
    
    updateLightnings() {
        for (let i = this.lightnings.length - 1; i >= 0; i--) {
            const lightning = this.lightnings[i];
            lightning.timer--;
            
            if (lightning.timer <= 0 && !lightning.exploded) {
                this.explodeLightning(lightning);
                lightning.exploded = true;
            }
            
            if (lightning.exploded && lightning.timer <= -30) {
                this.lightnings.splice(i, 1);
            }
        }
    }
    
    explodeLightning(lightning) {
        const explosionPositions = [
            {x: lightning.x, y: lightning.y}, // Centro
            {x: lightning.x - 1, y: lightning.y}, // Izquierda
            {x: lightning.x + 1, y: lightning.y}, // Derecha 
            {x: lightning.x, y: lightning.y - 1}, // Arriba
            {x: lightning.x, y: lightning.y + 1}  // Abajo
        ];
        
        explosionPositions.forEach(pos => {
            if (pos.x >= 0 && pos.x < this.mapWidth && pos.y >= 0 && pos.y < this.mapHeight) {
                // Destruir paredes destructibles
                if (this.map[pos.y][pos.x] === 'destructible') {
                    this.map[pos.y][pos.x] = 'empty';
                    this.score += 10;
                }
                
                // Crear efecto de explosión
                this.explosions.push({
                    x: pos.x,
                    y: pos.y,
                    timer: 20,
                    canDamage: this.map[pos.y][pos.x] !== 'wall'
                });
            }
        });
        
        this.updateUI();
    }
    
    updateExplosions() {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].timer--;
            if (this.explosions[i].timer <= 0) {
                this.explosions.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        // Comprobar la colisión jugador-enemigo
        this.enemies.forEach(enemy => {
            if (enemy.x === this.player.x && enemy.y === this.player.y) {
                this.playerHit();
            }
        });
        
        // verifica el daño de explosión
        this.explosions.forEach(explosion => {
            if (explosion.canDamage && explosion.timer > 10) {
                // Daño de jugador
                if (explosion.x === this.player.x && explosion.y === this.player.y) {
                    this.playerHit();
                }
                
                // Daño a enemigos
                for (let i = this.enemies.length - 1; i >= 0; i--) {
                    if (this.enemies[i].x === explosion.x && this.enemies[i].y === explosion.y) {
                        this.enemies.splice(i, 1);
                        this.score += 50;
                        this.updateUI();
                    }
                }
            }
        });
    }
    
    playerHit() {
        this.lives--;
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset posición del jugador
            this.player.x = 1;
            this.player.y = 1;
        }
    }
    
    canMoveTo(x, y) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
            return false;
        }
        return this.map[y][x] === 'empty';
    }
    
    nextLevel() {
        this.level++;
        this.score += 100 * this.level;
        this.player.x = 1;
        this.player.y = 1;
        this.lightnings = [];
        this.explosions = [];
        
        this.generateMap();
        this.spawnEnemies();
        this.updateUI();
    }
    
    gameOver() {
        this.gameRunning = false;
        alert(`¡Juego Terminado! Puntuación final: ${this.score}\nPresiona R para reiniciar`);
    }
    
    restart() {
        this.level = 1;
        this.lives = 3;
        this.score = 0;
        this.gameRunning = true;
        this.player.x = 1;
        this.player.y = 1;
        this.lightnings = [];
        this.explosions = [];
        this.enemies = [];
        
        this.initGame();
    }
    
    updateUI() {
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
        document.getElementById('score').textContent = this.score;
    }
    
    render() {
        // Limpiar pantalla
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibuja mapa
        this.drawMap();
        
        // Establece meta
        this.drawGoal();
        
        // Establece luces
        this.drawLightnings();
        
        // Dibuja expolsiones
        this.drawExplosions();
        
        // dibuja enemigos
        this.drawEnemies();
        
        // Dibuja jugador
        this.drawPlayer();
    }
    
    drawMap() {
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const pixelX = x * this.tileSize;
                const pixelY = y * this.tileSize;
                
                if (this.map[y][x] === 'wall') {
                    this.drawWall(pixelX, pixelY);
                } else if (this.map[y][x] === 'destructible') {
                    this.drawDestructibleWall(pixelX, pixelY);
                }
            }
        }
    }
    
    drawWall(x, y) {
        // Dibuja pared solida (gris)
        this.ctx.fillStyle = '#666666';
        this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
        
        // Añade algunos detalles de pixeles
        this.ctx.fillStyle = '#888888';
        this.ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
        
        this.ctx.fillStyle = '#444444';
        this.ctx.fillRect(x + 4, y + 4, this.tileSize - 8, this.tileSize - 8);
    }
    
    drawDestructibleWall(x, y) {
        // Dibuja paredes destructibles (marron)
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
        
        // Añade textura de madera
        this.ctx.fillStyle = '#A0522D';
        this.ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
        
        // Añade algunas lineas para que parezca de madera
        this.ctx.fillStyle = '#654321';
        for (let i = 0; i < 3; i++) {
            this.ctx.fillRect(x + 5, y + 8 + i * 8, this.tileSize - 10, 2);
        }
    }
    
    drawPlayer() {
        const x = this.player.x * this.tileSize;
        const y = this.player.y * this.tileSize;
        
        // Dibuja Thor (pixel art simplifado)
        // cuerpo (capa roja)
        this.ctx.fillStyle = '#DC143C';
        this.ctx.fillRect(x + 8, y + 16, 24, 20);
        
        // Armadura (plateado)
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(x + 12, y + 12, 16, 16);
        
        // cabeza (color de piel)
        this.ctx.fillStyle = '#FFDBAC';
        this.ctx.fillRect(x + 14, y + 4, 12, 12);
        
        // cabello (rubio)
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 12, y + 2, 16, 8);
        
        // martillo (sosteniendo)
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x + 32, y + 18, 6, 2);
        
        // martillo (cabeza)
        this.ctx.fillStyle = '#696969';
        this.ctx.fillRect(x + 34, y + 14, 8, 10);
        
        // ojos
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x + 16, y + 8, 2, 2);
        this.ctx.fillRect(x + 22, y + 8, 2, 2);
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            const x = enemy.x * this.tileSize;
            const y = enemy.y * this.tileSize;
            
            // Dibuja enemigo(creatura simple tipo orco)
            // cuerpo (verde oscuro)
            this.ctx.fillStyle = '#2F4F2F';
            this.ctx.fillRect(x + 10, y + 20, 20, 16);
            
            // cabeza (verde)
            this.ctx.fillStyle = '#32CD32';
            this.ctx.fillRect(x + 12, y + 8, 16, 16);
            
            // ojos (rojos)
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(x + 16, y + 12, 2, 2);
            this.ctx.fillRect(x + 22, y + 12, 2, 2);
            
            // colmillos
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(x + 14, y + 18, 2, 4);
            this.ctx.fillRect(x + 24, y + 18, 2, 4);
        });
    }
    
    drawGoal() {
        const x = this.goal.x * this.tileSize;
        const y = this.goal.y * this.tileSize;
        
        // dibuja Asgard (casa dorada)
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 4, y + 16, 32, 20);
        
        // techo
        this.ctx.fillStyle = '#FFA500';
        this.ctx.fillRect(x + 2, y + 8, 36, 12);
        
        // puerta
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x + 16, y + 24, 8, 12);
        
        // Brillo alrededor
        const sparkleOffset = Math.sin(this.animFrame) * 2;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x - 2 + sparkleOffset, y + 4, 2, 2);
        this.ctx.fillRect(x + 38 - sparkleOffset, y + 12, 2, 2);
        this.ctx.fillRect(x + 20, y - 2 + sparkleOffset, 2, 2);
    }
    
    drawLightnings() {
        this.lightnings.forEach(lightning => {
            const x = lightning.x * this.tileSize;
            const y = lightning.y * this.tileSize;
            
            // Rayo (animado)
            const flash = Math.sin(this.animFrame * 0.5) > 0;
            this.ctx.fillStyle = flash ? '#FFFF00' : '#87CEEB';
            
            // Dibuja la forma del rayo
            this.ctx.fillRect(x + 16, y + 4, 8, 32);
            this.ctx.fillRect(x + 8, y + 12, 24, 16);
            this.ctx.fillRect(x + 12, y + 8, 16, 24);
            
            // Agrega efecto de rayo
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            this.ctx.fillRect(x + 4, y + 4, 32, 32);
        });
    }
    
    drawExplosions() {
        this.explosions.forEach(explosion => {
            const x = explosion.x * this.tileSize;
            const y = explosion.y * this.tileSize;
            
            // Efecto de explosión
            const intensity = explosion.timer / 20;
            this.ctx.fillStyle = `rgba(255, ${Math.floor(165 * intensity)}, 0, ${intensity})`;
            this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
            
            // Explosión interna
            this.ctx.fillStyle = `rgba(255, 255, 0, ${intensity})`;
            this.ctx.fillRect(x + 8, y + 8, this.tileSize - 16, this.tileSize - 16);
        });
    }
    
    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Iniciar el juego cuando la pagina carga
window.addEventListener('load', () => {
    new ThorGame();
});
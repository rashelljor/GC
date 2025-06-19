class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.muteButton = null; 
    }

    preload() {
        this.load.image('menuBg', 'assets/mymenuSha.png');
        this.load.image('playBtn', 'assets/playBtn.png');
        this.load.image('soundBtn', 'assets/soundBtn.png');
        this.load.image('musicBtn', 'assets/musicBtn.png');
        this.load.image('settingsBtn', 'assets/settingsBtn.png');
        this.load.image('titleSha', 'assets/titleSha.png');
        this.load.image('maintitle', 'assets/maintitle.png');
    }

    create() {
        this.add.image(640, 360, 'menuBg').setDisplaySize(1200, 720);
        this.add.image(640, 100, 'maintitle').setScale(0.15);
        this.add.image(640, 200, 'titleSha').setScale(0.15);
        this.add.image(1190, 240, 'soundBtn').setScale(0.15);
        this.add.image(1190, 145, 'musicBtn').setScale(0.15);
        this.add.image(1190, 50, 'settingsBtn').setScale(0.15);

        const playBtn = this.add.image(230, 630, 'playBtn').setDepth(11).setScale(0.15).setInteractive();
    playBtn.on('pointerdown', () => {
        this.scene.start('GameScene');
    });
        
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    preload() { preload.call(this); }
    create() { create.call(this); }
    update() { update.call(this); }
}

//const Phaser = require("phaser");

let score = 0;
let gameOver = false;
let scoreText;

const config = {
    type: Phaser.AUTO,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [MenuScene, GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
    },
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('ground2', 'assets/block.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('monster1', 'assets/monster1.png', { frameWidth: 373, frameHeight: 322 });
    this.load.spritesheet('monster2', 'assets/monster2.png', { frameWidth: 339, frameHeight: 295 });
    this.load.image('gameover', 'assets/gameover.png');
    this.load.image('restartBtn', 'assets/restart.png');
    this.load.image('homeBtn', 'assets/home.png');
    this.load.image('portal', 'assets/portal.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
}

function create() {
    score = 0;
    gameOver = false;

    // Fondo
    this.add.image(640, 360, 'sky').setDisplaySize(1280, 720);

    // Plataformas estáticas
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(640, 760, 'ground').setScale(0.88).refreshBody();
    this.platforms.create(120, 450, 'ground').setScale(0.26).refreshBody();
    this.platforms.create(1180, 220, 'ground').setScale(0.26).refreshBody();

    // Jugador
    this.player = this.physics.add.sprite(100, 560, 'dude').setScale(1.1);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.4);

    // Animaciones jugador
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
    });
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    // Animaciones monstruos
    this.anims.create({
        key: 'monsterWalk',
        frames: this.anims.generateFrameNumbers('monster1', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'monsterWalk2',
        frames: this.anims.generateFrameNumbers('monster2', { start: 0, end: 2 }),
        frameRate: 10,
        repeat: -1
    });

    // Colisiones jugador-plataformas
    this.physics.add.collider(this.player, this.platforms);

    // Cursores
    this.cursors = this.input.keyboard.createCursorKeys();

    // Estrellas
    this.stars = this.physics.add.group({
        key: 'star',
        repeat: 17,
        setXY: { x: 25, y: 0, stepX: 70 }
    });
    this.stars.children.iterate(child => {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.9));
        child.setCollideWorldBounds(true);
        child.setDragX(1000);
        child.setBounce(0.3);
    });
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.overlap(this.player, this.stars, collectStar, null, this);

    // Texto de puntuación
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });

    // Bombas
    this.bombs = this.physics.add.group();
    this.physics.add.collider(this.bombs, this.platforms);
    this.physics.add.collider(this.player, this.bombs, hitBomb, null, this);

    // Plataformas móviles
    this.movingPlatforms = [];

    // Plataforma móvil 1
    this.movingPlatform1 = this.physics.add.image(400, 250, 'ground').setScale(0.26);
    this.movingPlatform1.setImmovable(true);
    this.movingPlatform1.body.allowGravity = false;
    this.movingPlatform1.setVelocityX(5);
    this.physics.add.collider(this.player, this.movingPlatform1);
    this.physics.add.collider(this.stars, this.movingPlatform1);
    this.physics.add.collider(this.bombs, this.movingPlatform1);
    this.movingPlatforms.push(this.movingPlatform1);

    this.platformTween1 = this.tweens.add({
        targets: this.movingPlatform1,
        x: this.movingPlatform1.x + 50,
        ease: 'Linear',
        duration: 3000,
        yoyo: true,
        repeat: -1
    });

    // Plataforma móvil 2
    this.movingPlatform2 = this.physics.add.image(950, 520, 'ground').setScale(0.26);
    this.movingPlatform2.setImmovable(true);
    this.movingPlatform2.body.allowGravity = false;
    this.movingPlatform2.setVelocityX(50);
    this.physics.add.collider(this.player, this.movingPlatform2);
    this.physics.add.collider(this.stars, this.movingPlatform2);
    this.physics.add.collider(this.bombs, this.movingPlatform2);
    this.movingPlatforms.push(this.movingPlatform2);

    this.platformTween2 = this.tweens.add({
        targets: this.movingPlatform2,
        x: this.movingPlatform2.x - 350,
        ease: 'Linear',
        duration: 3000,
        yoyo: true,
        repeat: -1
    });

    // Bloque móvil vertical
    this.movingBlock = this.physics.add.image(880, 120, 'ground2').setScale(0.08);
    this.movingBlock.setImmovable(true);
    this.movingBlock.body.allowGravity = false;
    this.movingBlock.setVelocityY(30);
    this.physics.add.collider(this.player, this.movingBlock);
    this.physics.add.collider(this.stars, this.movingBlock);
    this.physics.add.collider(this.bombs, this.movingBlock);
    this.movingPlatforms.push(this.movingBlock);

    this.platformTween3 = this.tweens.add({
        targets: this.movingBlock,
        y: this.movingBlock.y + 300,
        ease: 'Linear',
        duration: 3000,
        yoyo: true,
        repeat: -1
    });

    this.physics.add.collider(this.player, this.movingBlock);
    this.physics.add.collider(this.player, this.movingBlock, function(player, block) {
    // Solo impulsa si el jugador viene cayendo
    if (player.body.velocity.y > 0) {
        player.setVelocityY(-400); // Ajusta la fuerza del salto aquí
    }
    }, null, this);

    // Inicialización de monstruos y portales
    this.monster1 = null;
    this.monster2 = null;
    this.monsterTween = null;
    this.monsterTween2 = null;
    this.portal1 = null;
    this.portal2 = null;
    this.canTeleport = true;
}

function update() {
    if (gameOver) return;

    // Movimiento jugador
    if (this.cursors.left.isDown) {
        this.player.setVelocityX(-160);
        this.player.anims.play('left', true);
    } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(160);
        this.player.anims.play('right', true);
    } else {
        this.player.setVelocityX(0);
        this.player.anims.play('turn');
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
        this.player.setVelocityY(-330);
    }
    
}

function collectStar(player, star) {
    //Esta función se ejecuta cuando el jugador recoge una estrella.
    star.disableBody(true, true);
    //Con esta línea de código le estamos indicando a Phaser que desactive la estrella recogida, lo que significa que ya no será visible ni interactuable en el juego.
    score += 10;
    scoreText.setText('Score: ' + score);
    //Con esta línea de código le estamos indicando a Phaser que actualice el texto del puntaje en la pantalla. El puntaje se incrementa en 10 cada vez que se recoge una estrella.

    if (score === 20 && !this.monster1) {
        this.monster1 = this.physics.add.sprite(12, 390, 'monster1').setScale(0.2);
        this.monster1.setImmovable(true);
        this.monster1.body.allowGravity = false;

        this.monster1.anims.play('monsterWalk', true);

        this.monsterTween = this.tweens.add({
            targets: this.monster1,
            x: this.monster1.x + 280,
            ease: 'Linear',
            duration: 3000,
            yoyo: true,
            repeat: -1,
            onYoyo: () => {
             // Cambia la dirección (voltea el sprite)
                this.monster1.flipX = !this.monster1.flipX;
            },
            onRepeat: () => {
                // Cambia la dirección (voltea el sprite)
                this.monster1.flipX = !this.monster1.flipX;
            }
        });

        // Colisiones
        this.physics.add.collider(this.monster1, this.platforms);
        this.physics.add.collider(this.player, this.monster1, hitMonster, null, this);
    }

    if (score === 30 && !this.monster2) {
        this.monster2 = this.physics.add.sprite(1280, 605, 'monster2').setScale(0.28);
        this.monster2.setImmovable(true);
        this.monster2.body.allowGravity = false;

        this.monster2.anims.play('monsterWalk2', true);

        this.monsterTween2 = this.tweens.add({
            targets: this.monster2,
            x: this.monster2.x - 1280,
            ease: 'Linear',
            duration: 8000,
            yoyo: true,
            repeat: -1,
            onYoyo: () => {
             // Cambia la dirección (voltea el sprite)
                this.monster2.flipX = !this.monster2.flipX;
            },
            onRepeat: () => {
                // Cambia la dirección (voltea el sprite)
                this.monster2.flipX = !this.monster2.flipX;
            }
        });

        // Colisiones
        this.physics.add.collider(this.monster2, this.platforms);
        this.physics.add.collider(this.player, this.monster2, hitMonster, null, this);
        this.physics.add.collider(this.stars, this.platforms, function(star, platform) {
            star.setBounceY(0);
            star.setVelocity(0, 0);
            star.body.allowGravity = false;
            star.body.immovable = true;
        }, null, this);
    }

    if (this.stars.countActive(true) === 0) {
        this.stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
            //Con esta línea de código le estamos indicando a Phaser que vuelva a activar todas las estrellas del grupo. Esto significa que las estrellas volverán a ser visibles e interactuables en el juego.
  
        });

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = this.bombs.create(x, -350, 'bomb').setScale(0.02).refreshBody();
        //Con esta línea de código le estamos indicando a Phaser que cree una bomba en una posición aleatoria en el eje X, dependiendo de la posición del jugador. Si el jugador está en la mitad izquierda de la pantalla (x < 400), la bomba aparecerá en la mitad derecha (entre 400 y 800). Si el jugador está en la mitad derecha, la bomba aparecerá en la mitad izquierda (entre 0 y 400).
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        //Con estas líneas de código le estamos indicando a Phaser que la bomba tendrá un rebote completo (1) y que no podrá salir del mundo del juego.
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);

    }

    if (score === 40 && !this.portal1 && !this.portal2) {
    spawnPortals(this);
}


}

function showGameOverScreen(scene) {
    const overlay = scene.add.rectangle(1280 / 2, 720 / 2, 1280, 720, 0x000000, 0.5).setDepth(10);
    const gameOverImage = scene.add.image(1280/2, 720/2, 'gameover').setDepth(11).setScale(0.8);
    const scoreLabel = scene.add.text(1280/2, 610, `Your Score: ${score}`, {
        fontSize: '32px',
        fill: '#fff'
    }).setOrigin(0.5).setDepth(11);

    const restartBtn = scene.add.image(250, 400, 'restartBtn').setDepth(11).setScale(0.15).setInteractive();
    restartBtn.on('pointerdown', () => {
        scene.scene.restart();
    });

    const homeBtn = scene.add.image(1030, 400, 'homeBtn').setDepth(11).setScale(0.15).setInteractive();
    homeBtn.on('pointerdown', () => {
        scene.scene.start('MenuScene');
    });
}

function spawnPortals(scene) {
    scene.portal1 = scene.physics.add.sprite(750, 150, 'portal').setScale(0.09);
    scene.portal2 = scene.physics.add.sprite(50, 300, 'portal').setScale(0.09);

    scene.portal1.body.allowGravity = false;
    scene.portal2.body.allowGravity = false;
    scene.portal1.setImmovable(true);
    scene.portal2.setImmovable(true);

    scene.canTeleport = true;

    scene.physics.add.overlap(scene.player, scene.portal1, () => {
        if (scene.canTeleport) {
            teleportAndChangeDude(scene, scene.portal2);
            scene.canTeleport = false;
            scene.time.delayedCall(500, () => { scene.canTeleport = true; });
        }
    }, null, scene);

    scene.physics.add.overlap(scene.player, scene.portal2, () => {
        if (scene.canTeleport) {
            teleportAndChangeDude(scene, scene.portal1);
            scene.canTeleport = false;
            scene.time.delayedCall(500, () => { scene.canTeleport = true; });
        }
    }, null, scene);
}

function teleportAndChangeDude(scene, destinationPortal) {
    scene.player.x = destinationPortal.x;
    scene.player.y = destinationPortal.y - 30;
}

function hitBomb(player, bomb) {
    this.physics.pause();
    this.player.setTint(0xff0000);
    this.player.anims.play('turn');
    gameOver = true;

    // Detener tweens de plataformas móviles
    if (this.platformTween1) this.platformTween1.stop();
    if (this.platformTween2) this.platformTween2.stop();
    if (this.platformTween3) this.platformTween3.stop();
    if (this.monsterTween) this.monsterTween.stop();
    if (this.monsterTween2) this.monsterTween2.stop();

    showGameOverScreen(this);
}

function hitMonster(player, monster) {
    this.physics.pause();
    this.player.setTint(0xff0000);
    this.player.anims.play('turn');
    gameOver = true;

    if (this.platformTween1) this.platformTween1.stop();
    if (this.platformTween2) this.platformTween2.stop();
    if (this.platformTween3) this.platformTween3.stop();
    if (this.monsterTween) this.monsterTween.stop();
    if (this.monsterTween2) this.monsterTween2.stop();

    showGameOverScreen(this);
}
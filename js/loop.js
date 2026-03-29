'use strict';

const Game = {

    canvas: null,
    context: null,

    run() {
        if (!this.state.started) {
            this.start();
        }
        if (!this.state.paused) {
            this.think(() => {
                this.render(this.state);
            });
        } else {
            this.render(this.state);
        }
    },

    start: function () {
        this.canvas = document.getElementById('space');
        this.context = this.canvas.getContext('2d');
        this.state.started = true;
        this.state.stateCanvas = new StateCanvas(this.canvas);
        this.state.phase = 'stage_select';
        this.state.backgroundThings = BackgroundThings.create(250, this.state.stateCanvas, 'particle', 'star');
        this.fillRenderCache();
    },

    beginGame: function () {
        Sound.init();
        this.state.phase = 'stage_select';
        this.state.stage = 0;
        this.state.score = 0;
        this.state.playerHealth = 100;
        this.state.frameCount = 0;
        this.state.stageMessageTimer = 0;
        this.state.lastPlayerShotAt = 0;
        this.state.lastPlayerHitAt = 0;
        this.state.stageAdvanceScore = 0;
        this.state.hyperspace = false;
        this.state.collisions = 0;
        this.state.playerLives = 3;
        this.state.lifeLostTimer = 0;
        this.state.stageCompleteTimer = 0;
        this.state.selectedMenuIndex = 0;
        this.state.lastRevealedSecret = '';
        this.state.lastRevealedStageName = '';
        this.state.collectedSecrets = {};
        this.state.transitionStars = null;
        this.state.entities.missiles = {};
        this.state.entities.enemyMissiles = {};
        this.state.entities.enemies = {};
        this.state.entities.powerups = {};
        this.state.entities.floatingNumbers = {};
        this.state.entities.explosionParticles = {};
        this.state.entities.player = new Player(this.state.stateCanvas);
        this.state.backgroundThings = BackgroundThings.create(
            250,
            this.state.stateCanvas,
            'particle',
            'star'
        );
        this.ensureStageSelectSelection();
    },

    begin_game: function () {
        return this.beginGame();
    },

    damagePlayer: function (amount) {
        const now = Date.now();
        if (now - this.state.lastPlayerHitAt < this.config.playerHitCooldownMs) {
            return;
        }
        this.state.lastPlayerHitAt = now;
        this.state.playerHealth = Math.max(0, this.state.playerHealth - amount);
        Sound.player_hit();
        if (this.state.playerHealth <= 0) {
            this.state.playerLives--;
            if (this.state.playerLives <= 0) {
                this.returnToStageSelectAfterDefeat();
            } else {
                this.restartStage();
            }
        }
    },

    damage_player: function (amount) {
        return this.damagePlayer(amount);
    },

    returnToStageSelectAfterDefeat() {
        this.state.score = 0;
        this.state.stageAdvanceScore = 0;
        this.state.playerHealth = 100;
        this.state.playerLives = 3;
        this.state.lifeLostTimer = 0;
        this.state.lastPlayerHitAt = 0;
        this.state.lastPlayerShotAt = 0;
        this.state.hyperspace = false;
        this.state.collisions = 0;
        this.state.transitionStars = null;
        this.state.stageMessageTimer = 0;
        this.state.stageCompleteTimer = 0;
        this.state.phase = 'stage_select';
        this.state.entities.missiles = {};
        this.state.entities.enemyMissiles = {};
        this.state.entities.enemies = {};
        this.state.entities.powerups = {};
        this.state.entities.floatingNumbers = {};
        this.state.entities.explosionParticles = {};
        this.state.entities.player = new Player(this.state.stateCanvas);
        this.state.backgroundThings = BackgroundThings.create(250, this.state.stateCanvas, 'particle', 'star');
        this.ensureStageSelectSelection();
        Sound.game_over();
    },

    return_to_stage_select_after_defeat() {
        return this.returnToStageSelectAfterDefeat();
    },

    restartStage() {
        this.state.playerHealth = 100;
        this.state.lastPlayerHitAt = 0;
        this.state.lastPlayerShotAt = 0;
        this.state.entities.enemies = {};
        this.state.entities.enemyMissiles = {};
        this.state.entities.missiles = {};
        this.state.entities.powerups = {};
        this.state.entities.player = new Player(this.state.stateCanvas);
        this.state.phase = 'life_lost';
        this.state.lifeLostTimer = 160;
    },

    restart_stage() {
        return this.restartStage();
    },

    advanceStageScoreNeeded() {
        return this.state.stageAdvanceScore;
    },

    advance_stage_score_needed() {
        return this.advanceStageScoreNeeded();
    },

    startSelectedStage() {
        Sound.init();
        const cfg = this.config;
        const sc = this.state.stateCanvas;
        this.ensureStageSelectSelection();
        const options = this.getMenuOptions();
        const selected = options[this.state.selectedMenuIndex];
        if (!selected) return;
        if (selected.locked) return;

        if (selected.type === 'discover') {
            this.state.transitionStars = BackgroundThings.create(280, sc, 'particle', 'star');
            this.state.phase = 'victory';
            Sound.stage_up();
            return;
        }

        if (selected.type !== 'stage') return;

        const stage_cfg = cfg.stages[selected.stageIndex];
        if (!stage_cfg) return;

        this.state.stage = selected.stageIndex;
        this.state.phase = 'stage_transition';
        this.state.stageMessageTimer = 220;
        this.state.stageAdvanceScore = this.state.score + stage_cfg.pointsToAdvance;
        this.state.playerHealth = 100;
        this.state.playerLives = 3;
        this.state.lifeLostTimer = 0;
        this.state.lastPlayerHitAt = 0;
        this.state.lastPlayerShotAt = 0;
        this.state.collisions = 0;
        this.state.hyperspace = false;
        this.state.transitionStars = BackgroundThings.create(280, sc, 'particle', 'star');
        this.state.entities.missiles = {};
        this.state.entities.enemyMissiles = {};
        this.state.entities.enemies = {};
        this.state.entities.powerups = {};
        this.state.entities.floatingNumbers = {};
        this.state.entities.explosionParticles = {};
        this.state.entities.player = new Player(sc);
        this.state.backgroundThings = BackgroundThings.create(
            stage_cfg.backgroundThingCount,
            sc,
            stage_cfg.backgroundThingType,
            stage_cfg.backgroundThingKind
        );
    },

    start_selected_stage() {
        return this.startSelectedStage();
    },

    complete_stage() {
        const stage_cfg = this.config.stages[this.state.stage];
        if (!stage_cfg) return;

        this.state.collectedSecrets[this.state.stage] = true;
        this.state.lastRevealedSecret = stage_cfg.secret || '';
        this.state.lastRevealedStageName = stage_cfg.name;
        this.state.phase = 'stage_complete';
        this.state.stageCompleteTimer = 220;
        this.state.transitionStars = BackgroundThings.create(280, this.state.stateCanvas, 'particle', 'star');
        this.state.entities.enemies = {};
        this.state.entities.enemyMissiles = {};
        this.state.entities.missiles = {};
        this.state.entities.powerups = {};
        this.state.entities.floatingNumbers = {};
        this.state.entities.explosionParticles = {};
        Sound.stage_up();
    },

    all_secrets_collected() {
        for (let i = 0; i < this.config.stages.length; i++) {
            if (!this.state.collectedSecrets[i]) return false;
        }
        return this.config.stages.length > 0;
    },

    getMenuOptions() {
        const options = [];
        const total_slots = 7;
        for (let i = 0; i < total_slots; i++) {
            const stage_cfg = this.config.stages[i];
            if (stage_cfg) {
                const secret_collected = !!this.state.collectedSecrets[i];
                options.push({
                    type: 'stage',
                    stageIndex: i,
                    label: secret_collected ? stage_cfg.secret : stage_cfg.name,
                    locked: secret_collected
                });
            } else {
                options.push({
                    type: 'locked',
                    stageIndex: i,
                    label: 'STAGE ' + (i + 1) + ': ???',
                    locked: true
                });
            }
        }
        if (this.all_secrets_collected()) {
            options.push({
                type: 'discover',
                label: 'DISCOVER THE SECRET OF THE UNIVERSE',
                locked: false
            });
        }
        return options;
    },

    get_menu_options() {
        return this.getMenuOptions();
    },

    ensureStageSelectSelection() {
        const options = this.getMenuOptions();
        if (!options.length) {
            this.state.selectedMenuIndex = 0;
            return;
        }

        if (this.state.selectedMenuIndex >= options.length) {
            this.state.selectedMenuIndex = 0;
        }

        if (!options[this.state.selectedMenuIndex].locked) {
            return;
        }

        for (let i = 0; i < options.length; i++) {
            if (!options[i].locked) {
                this.state.selectedMenuIndex = i;
                return;
            }
        }
    },

    ensure_stage_select_selection() {
        return this.ensureStageSelectSelection();
    },

    moveStageSelect(direction) {
        this.ensureStageSelectSelection();
        const options = this.getMenuOptions();
        if (!options.length) return;

        let next = this.state.selectedMenuIndex;
        const maxSteps = options.length;

        for (let steps = 0; steps < maxSteps; steps++) {
            next = (next + direction + options.length) % options.length;
            if (!options[next].locked) {
                this.state.selectedMenuIndex = next;
                return;
            }
        }
    },

    move_stage_select(direction) {
        return this.moveStageSelect(direction);
    },

    render(state) {
        if (window.GameRenderingModules && window.GameRenderingModules.renderGameplay) {
            window.GameRenderingModules.renderGameplay.call(this, state);
            return;
        }

        const ctx = this.context;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    think(cb) {
        if (window.GameEngineModules && window.GameEngineModules.think) {
            window.GameEngineModules.think.call(this, cb);
            return;
        }

        cb();
    },

    eq: [],

    config: {
        starSpeeds: [0.5, 1, 2, 4],
        playerFireCooldownMs: 110,
        playerMissileDamage: 20,
        playerHitCooldownMs: 360,
        collisionColour: '#ffffff',
        starColoursHyperspace: ['#000077', '#37FDFC', '#ffffff', '#ffffff'],
        startrailLength: 5,
        playertrailColoursHyperspace: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
        floatingNumberSpeed: 1,
        billSrc: 'img/trumpet.png',
        miaowSrc: 'img/miaow.png',
        fishSrc: 'img/fish.png',
        triangleSrc: 'img/triangle.png',
        spoonSrc: 'img/spoon.png',
        healthSrc: 'img/health.png',
        cloudSrc: 'img/cloud.png',
        scoreColour: '#ffffff',
        stages: []
    },

    render_cache: {
      player_img: null,
      enemy_img: null,
      fish_img: null,
            triangle_img: null,
            spoon_img: null,
            health_img: null,
            cloud_img: null,
    },

    fillRenderCache: function () {

        this.render_cache.player_img = new Image();
        this.render_cache.player_img.src = this.config.billSrc;
        this.render_cache.enemy_img = new Image();
        this.render_cache.enemy_img.src = this.config.miaowSrc;
        this.render_cache.fish_img = new Image();
        this.render_cache.fish_img.src = this.config.fishSrc;
        this.render_cache.triangle_img = new Image();
        this.render_cache.triangle_img.src = this.config.triangleSrc;
        this.render_cache.spoon_img = new Image();
        this.render_cache.spoon_img.src = this.config.spoonSrc;
        this.render_cache.health_img = new Image();
        this.render_cache.health_img.src = this.config.healthSrc;
        this.render_cache.cloud_img = new Image();
        this.render_cache.cloud_img.src = this.config.cloudSrc;
    },

    fill_render_cache: function () {
        return this.fillRenderCache();
    },

    state: {
        started: false,
        paused: false,
        hyperspace: false,
        phase: 'stage_select',
        stage: 0,
        stageAdvanceScore: 300,
        stageMessageTimer: 0,
        stageCompleteTimer: 0,
        lastPlayerShotAt: 0,
        lastPlayerHitAt: 0,
        playerHealth: 100,
        playerLives: 3,
        lifeLostTimer: 0,
        frameCount: 0,

        score: 0,
        game_message: '',
        collisions: 0,
        transitionStars: null,
        selectedMenuIndex: 0,
        lastRevealedSecret: '',
        lastRevealedStageName: '',
        collectedSecrets: {},

        entities: {
            player: null,
            missiles: {},
            enemyMissiles: {},
            enemies: {},
            powerups: {},
            floatingNumbers: {},
            explosionParticles: {}
        },
        backgroundThings: null,
        stateCanvas: null
    },
    
    pause: function () {
        this.state.paused ? this.state.paused = false : this.state.paused = true;
    },

    createEnemyMaybe() {
        const stage_cfg = this.config.stages[this.state.stage];
        if (!stage_cfg) return false;

        const spawn_rate = stage_cfg.enemySpawnRate || 0;
        if (Math.random() >= spawn_rate) return false;

        const min_speed = stage_cfg.enemySpeedMin || 1;
        const speed_range = stage_cfg.enemySpeedRange || 0;
        const speed = min_speed + Math.floor(Math.random() * (speed_range + 1));

        return new Enemy(
            this.state.stateCanvas.max_x,
            Math.floor(Math.random() * this.state.stateCanvas.max_y),
            speed,
            stage_cfg.enemyType || 'miaow',
            stage_cfg.enemyPointsKill || 5,
            stage_cfg.enemyPointsDamage || 1,
            stage_cfg.enemyMaxHealth || 100,
            stage_cfg.enemyTrackingChance || 0.1,
            !!stage_cfg.enemyShowHealthBar,
            stage_cfg.enemyFireRate || 0.02,
            stage_cfg.enemyMissileDamage || 10,
            stage_cfg.enemyCollisionDamage || 25
        );
    },

    create_enemy_maybe() {
        return this.createEnemyMaybe();
    },

    create_powerup_maybe() {
        return Math.random() < 0.002;
    },

    createPowerupMaybe() {
        return this.create_powerup_maybe();
    },

    collide: function (a, b) {
        return !(
            a.pos_y() + a.height  < b.pos_y() ||
            a.pos_y() > b.pos_y() + b.height  ||
            a.pos_x() + a.width   < b.pos_x() ||
            a.pos_x() > b.pos_x() + b.width
        );
    },

    out_of_bounds: function (entity) {

        if (typeof entity.pos_y == "function" && typeof entity.pos_x == "function") {
            return (
                entity.pos_y() - entity.height <= 0                             ||
                entity.pos_y() + entity.height >= this.state.stateCanvas.max_y  ||
                entity.pos_x() - entity.width  <= 0                             ||
                entity.pos_x() + entity.width  >= this.state.stateCanvas.max_x
            );
        } else {
            return (
                entity.pos_y - entity.height <= 0                             ||
                entity.pos_y + entity.height >= this.state.stateCanvas.max_y  ||
                entity.pos_x - entity.width  <= 0                             ||
                entity.pos_x + entity.width  >= this.state.stateCanvas.max_x
            );
        }
    },

    outOfBounds(entity) {
        return this.out_of_bounds(entity);
    },

    hex_to_rgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    hexToRgb(hex) {
        return this.hex_to_rgb(hex);
    }
}

class StateCanvas {
    constructor(canvas) {
        this.max_y = canvas.height;
        this.max_x = canvas.width;
        this.score_x = this.max_x - 60;
        this.score_y = this.max_y - 20;
    }
}

class BackgroundThings {
    static create(max, stateCanvas, type, kind) {
        let max_things = max || 250;
        const t = type || 'particle';
        const k = kind || 'star';
        const things = [];

        while (max_things-- > 0) {
            const speed = Math.floor(Math.random() * 4);
            // Clouds: larger at back (low speed), smaller at front (high speed)
            const size = t === 'image' ? (52 - speed * 12 + Math.floor(Math.random() * 14)) : (speed + 1);
            things.push({
                pos_x: Math.floor(Math.random() * stateCanvas.max_x),
                pos_y: Math.floor(Math.random() * stateCanvas.max_y),
                speed,
                size,
                type: t,
                kind: k
            });
        }

        // Sort so far/slow (low speed) items render first, close/fast (high speed) on top
        if (k === 'cloud') things.sort((a, b) => a.speed - b.speed);

        return things;
    }
}

class FloatingNumber {
    constructor(start_x, start_y, speed, number) {
        this._x = start_x;
        this._y = start_y;
        this.width = 10;
        this.height = 10;
        this.id = Date.now() + Math.floor(Math.random() * 1000);
        this.number = number;
        this.speed = speed;
    }

    pos_x() {
        return this._x;
    }

    pos_y() {
        return this._y;
    }

    move() {
        this._y -= Game.config.floatingNumberSpeed;
        return this._y;
    }
}

function Explosion(start_x, start_y, speed, number) {
    const particles = {};

    while (number--) {
        const new_particle = new ExplosionParticle(start_x, start_y, speed, Math.random() * Math.PI * 2);
        particles[Date.now() + number + Math.floor(Math.random() * 1000)] = new_particle;
    }

    return particles;
}

class ExplosionParticle {
    constructor(start_x, start_y, speed, angle) {
        this._x = start_x;
        this._y = start_y;
        this.width = 1;
        this.height = 1;
        this.speed = speed;
        this.angle = angle;
    }

    pos_x() {
        return Math.floor(this._x);
    }

    pos_y() {
        return Math.floor(this._y);
    }

    move() {
        this._x += this.speed * Math.cos(this.angle);
        this._y += this.speed * Math.sin(this.angle);
        return {
            width: this.width,
            height: this.height,
            pos_x: Math.floor(this._x),
            pos_y: Math.floor(this._y)
        };
    }
}

class Enemy {
    constructor(start_x, start_y, speed, type, pointsKill, pointsDamage, maxHealth, trackingChance, showHealthBar, fireRate, missileDamage, collisionDamage) {
        this._x = start_x;
        this._y = start_y;
        this.speed = speed;
        this.type = type || 'miaow';
        this.pointsKill = pointsKill || 5;
        this.pointsDamage = pointsDamage || 1;
        this.width = 20;
        this.height = 20;
        this.id = Date.now() + Math.floor(Math.random() * 1000);
        this.maxHealth = maxHealth || 100;
        this.health = this.maxHealth;
        this.trackingChance = trackingChance || 0.1;
        this.showHealthBar = !!showHealthBar;
        this.fireRate = fireRate || 0.02;
        this.missileDamage = missileDamage || 10;
        this.collisionDamage = collisionDamage || 25;
        this.lastMove = 0;
        this.direction = 0;
        this.yVelocity = 0;
        this.currentSpeed = this.speed;
    }

    pos_x() {
        return this._x;
    }

    pos_y() {
        return this._y;
    }

    move(player_y) {
        if (this.type === 'spoon') {
            const targetY = typeof player_y === 'number' ? player_y : this._y;
            const deltaY = targetY - this._y;
            const yAccel = Math.sign(deltaY) * 0.45;
            this.yVelocity += yAccel;
            this.yVelocity *= 0.82;
            this.yVelocity = Math.max(-3.4, Math.min(3.4, this.yVelocity));
            this._y += this.yVelocity;

            const alignedForDash = Math.abs(deltaY) < 14;
            if (alignedForDash) {
                this.currentSpeed = Math.min(this.speed * 4.6, this.currentSpeed + 0.42);
            } else {
                this.currentSpeed = Math.max(this.speed, this.currentSpeed - 0.22);
            }

            this._x -= this.currentSpeed;
            return this._x;
        }

        if (this.type !== 'miaow') {
            this._x -= this.speed;
            if (typeof player_y === 'number') {
                const delta = player_y - this._y;
                const trackingForce = this.type === 'triangle' ? 0.36 : 0.3;
                const maxVerticalSpeed = this.type === 'triangle' ? 2.8 : 2.2;
                const steering = Math.sign(delta) * trackingForce;
                this.yVelocity += steering;
                this.yVelocity *= 0.86;
                this.yVelocity = Math.max(-maxVerticalSpeed, Math.min(maxVerticalSpeed, this.yVelocity));
                this._y += this.yVelocity;
            }
            return this._x;
        }

        this._x -= this.speed;

        if (typeof player_y === 'number' && Math.random() < this.trackingChance) {
            const delta = player_y - this._y;
            const step = Math.sign(delta) * Math.min(3, Math.abs(delta));
            this._y += step;
            this.lastMove = step;
            return this._x;
        }

        let decision = Math.random();
        if (decision < 0.33) {
            this.direction = -1;
        } else if (decision < 0.66) {
            this.direction = 0;
        } else {
            this.direction = 1;
        }

        decision = Math.random();
        if (decision > 0.1) {
            this._y += this.lastMove;
        } else if (decision < 0.05) {
            this._y += this.direction * 3;
            this.lastMove = this.direction * 3;
        } else {
            this._y += this.direction;
            this._y += this.lastMove;
        }

        return this._x;
    }

    damage(dmg, death_cb, injured_cb) {
        this.health -= dmg;
        if (this.health <= 0) {
            death_cb();
        } else {
            injured_cb();
        }
    }

    fire() {
        if (this.type === 'spoon' || this.fireRate <= 0) {
            return false;
        }
        if (Math.random() < this.fireRate) {
            return new Missile(this._x + this.width, this._y + this.height / 2, -16, this.missileDamage);
        }
        return false;
    }
}

class Player {
    constructor(stateCanvas) {
        this.stateCanvas = stateCanvas;
        this._x = 20;
        this._y = stateCanvas.max_y / 2;
        this.height = 30;
        this.width = 50;
    }

    pos_x() {
        return this._x;
    }

    pos_y() {
        return this._y;
    }

    move_x(offset_x) {
        if ((this._x + offset_x) >= this.stateCanvas.max_x - this.width) return false;
        if ((this._x + offset_x) <= 0) return false;
        this._x += offset_x;
        return true;
    }

    move_y(offset_y) {
        if ((this._y + offset_y) >= this.stateCanvas.max_y - this.height) return false;
        if ((this._y + offset_y) <= 0) return false;
        this._y += offset_y;
        return true;
    }

    fire(damage) {
        return new Missile(this._x + this.width, this._y + this.height / 2, 10, damage || 20);
    }
}

class Missile {
    constructor(start_x, start_y, speed, damage) {
        this._x = start_x;
        this._y = start_y;
        this.speed = speed;
        this.damage = damage || 10;
        this.width = 5;
        this.height = 5;
        this.id = Date.now() + Math.floor(Math.random() * 1000);
    }

    pos_x() {
        return this._x;
    }

    pos_y() {
        return this._y;
    }

    move() {
        this._x += this.speed;
        return this._x;
    }
}

class HealthPowerup {
    constructor(start_x, start_y) {
        this._x = start_x;
        this._y = start_y;
        this.width = 20;
        this.height = 20;
        this.speed = 2;
        this.id = Date.now() + Math.floor(Math.random() * 1000);
    }

    pos_x() {
        return this._x;
    }

    pos_y() {
        return this._y;
    }

    move() {
        this._x -= this.speed;
        return this._x;
    }
}


// FM Synthesis sound engine
const Sound = {
    ctx: null,

    init() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.log('Web Audio API not supported');
                return;
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    _fm(carrierFreq, modFreq, modIndex, duration, gain) {
        if (!this.ctx) return;
        const actx = this.ctx;
        const now = actx.currentTime;
        const mod = actx.createOscillator();
        const modG = actx.createGain();
        const car = actx.createOscillator();
        const outG = actx.createGain();

        mod.frequency.value = modFreq;
        modG.gain.value = modIndex * modFreq;
        car.frequency.value = carrierFreq;
        car.type = 'sine';

        mod.connect(modG);
        modG.connect(car.frequency);
        car.connect(outG);
        outG.connect(actx.destination);

        outG.gain.setValueAtTime(gain || 0.25, now);
        outG.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        car.start(now); mod.start(now);
        car.stop(now + duration); mod.stop(now + duration);
    },

    shoot() {
        // Short high-pitched zap
        this._fm(1200, 300, 1.5, 0.08, 0.18);
    },

    hit() {
        // Mid thud
        this._fm(280, 140, 4, 0.12, 0.2);
    },

    explosion() {
        // Low boom with heavy modulation
        this._fm(90, 45, 12, 0.45, 0.3);
    },

    player_hit() {
        // Harsh buzzy impact
        this._fm(160, 80, 8, 0.25, 0.28);
    },

    stage_up() {
        // Ascending arpeggio
        [330, 440, 550, 660, 880].forEach((freq, idx) => {
            setTimeout(() => { this._fm(freq, freq * 0.5, 1, 0.18, 0.22); }, idx * 90);
        });
    },

    game_over() {
        // Descending dirge
        [440, 330, 220, 165, 110].forEach((freq, idx) => {
            setTimeout(() => { this._fm(freq, freq * 0.25, 3, 0.38, 0.25); }, idx * 200);
        });
    }
};


//inputistas
const Key = {
  _pressed: {},

  LEFT: 65, //a
  UP: 87,   //w
  RIGHT: 68,//d
  DOWN: 83, //s
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40,
  SHOOT:32, //space
    PAUSE:80, //p
  
    isDown(keyCode) {
    return this._pressed[keyCode];
  },
  
    onKeydown(ev) {
        this._pressed[ev.which] = Date.now();
  },
  
    onKeyup(ev) {
    delete this._pressed[ev.which];
  }
};

document.addEventListener('keyup', (ev) => {
    Key.onKeyup(ev);
});

document.addEventListener('keydown', (ev) => {
    Key.onKeydown(ev);
    Sound.init();

    if (!ev.repeat) {
        if (Game.state.phase === 'stage_select') {
            if (ev.which === Key.UP || ev.which === Key.ARROW_UP) {
                Game.moveStageSelect(-1);
            }
            if (ev.which === Key.DOWN || ev.which === Key.ARROW_DOWN) {
                Game.moveStageSelect(1);
            }
            if (ev.which === Key.SHOOT || ev.which === 13) {
                Game.startSelectedStage();
            }
        }

        if (ev.which === Key.PAUSE && Game.state.phase === 'playing') {
            Game.pause();
        }
    }

    if (Game.state.phase === 'gameover' || Game.state.phase === 'victory') {
        Game.beginGame();
    }
});


window.GameEngineModules = window.GameEngineModules || {};

window.GameEngineModules.think = function think(cb) {
    const state = this.state;
    const entities = state.entities;
    const sc = state.stateCanvas;
    const cfg = this.config;
    const backgroundThings = state.backgroundThings;
    const missiles = entities.missiles;
    const enemyMissiles = entities.enemyMissiles;
    const powerups = entities.powerups;
    const floatingNumbers = entities.floatingNumbers;
    const explosionParticles = entities.explosionParticles;
    const enemies = entities.enemies;
    const player = entities.player;

    state.frameCount++;
    state.collisions = 0;

    const speedMultiplier = state.hyperspace ? 3 : 1;

    if (backgroundThings) {
        for (const thing of backgroundThings) {
            if (thing.type === 'shape' && thing.kind === 'bubble') {
                thing.pos_x -= cfg.starSpeeds[thing.speed] * 0.5;
                thing.pos_y -= 0.3;
                if (thing.pos_x <= 0 || thing.pos_y <= 0) {
                    thing.pos_x = sc.max_x;
                    thing.pos_y = Math.floor(Math.random() * sc.max_y);
                }
                continue;
            }

            if (thing.type === 'image' && thing.kind === 'cloud') {
                thing.pos_x -= cfg.starSpeeds[thing.speed] * 0.25;
                if (thing.pos_x <= -200) {
                    thing.pos_x = sc.max_x + Math.floor(Math.random() * 200);
                    thing.pos_y = Math.floor(Math.random() * Math.max(1, sc.max_y - 140));
                }
                continue;
            }

            thing.pos_x -= cfg.starSpeeds[thing.speed] * speedMultiplier;
            if (thing.pos_x <= 0) {
                thing.pos_x = sc.max_x;
                thing.pos_y = Math.floor(Math.random() * sc.max_y);
            }
        }
    }

    if (state.phase === 'stage_transition') {
        state.stageMessageTimer--;
        if (state.transitionStars) {
            for (const star of state.transitionStars) {
                star.pos_x -= cfg.starSpeeds[star.speed] * 3;
                if (star.pos_x <= 0) {
                    star.pos_x = sc.max_x;
                    star.pos_y = Math.floor(Math.random() * sc.max_y);
                }
            }
        }
        if (state.stageMessageTimer <= 0) {
            state.phase = 'playing';
            state.transitionStars = null;
        }
        cb();
        return;
    }

    if (state.phase === 'stage_complete') {
        state.stageCompleteTimer--;
        if (state.transitionStars) {
            for (const star of state.transitionStars) {
                star.pos_x -= cfg.starSpeeds[star.speed] * 3;
                if (star.pos_x <= 0) {
                    star.pos_x = sc.max_x;
                    star.pos_y = Math.floor(Math.random() * sc.max_y);
                }
            }
        }
        if (state.stageCompleteTimer <= 0) {
            state.phase = 'stage_select';
            state.transitionStars = null;
            state.backgroundThings = BackgroundThings.create(250, sc, 'particle', 'star');
            this.ensureStageSelectSelection();
        }
        cb();
        return;
    }

    if (state.phase === 'life_lost') {
        state.lifeLostTimer--;
        if (state.lifeLostTimer <= 0) {
            state.phase = 'playing';
        }
        cb();
        return;
    }

    if (state.phase === 'victory') {
        if (state.transitionStars) {
            for (const star of state.transitionStars) {
                star.pos_x -= cfg.starSpeeds[star.speed] * 3;
                if (star.pos_x <= 0) {
                    star.pos_x = sc.max_x;
                    star.pos_y = Math.floor(Math.random() * sc.max_y);
                }
            }
        }
        cb();
        return;
    }

    if (state.phase !== 'playing') {
        cb();
        return;
    }

    if (Key.isDown(Key.UP) || Key.isDown(Key.ARROW_UP)) player.move_y(-2);
    if (Key.isDown(Key.DOWN) || Key.isDown(Key.ARROW_DOWN)) player.move_y(2);
    if (Key.isDown(Key.LEFT) || Key.isDown(Key.ARROW_LEFT)) player.move_x(-4);

    if (Key.isDown(Key.RIGHT) || Key.isDown(Key.ARROW_RIGHT)) {
        player.move_x(2);
        state.hyperspace = true;
    } else {
        state.hyperspace = false;
    }

    const launchTime = Key.isDown(Key.SHOOT);
    if (launchTime && (Date.now() - state.lastPlayerShotAt >= cfg.playerFireCooldownMs)) {
        missiles[Date.now()] = player.fire(cfg.playerMissileDamage);
        state.lastPlayerShotAt = Date.now();
        Sound.shoot();
    }

    const newEnemy = this.createEnemyMaybe();
    if (newEnemy) {
        enemies[newEnemy.id] = newEnemy;
    }

    if (this.createPowerupMaybe()) {
        const powerup = new HealthPowerup(sc.max_x, Math.floor(Math.random() * sc.max_y));
        powerups[powerup.id] = powerup;
    }

    for (const missileId in missiles) {
        const missile = missiles[missileId];
        if (missile && missile.move() >= sc.max_x) {
            delete missiles[missileId];
        }
    }

    for (const numberId in floatingNumbers) {
        const number = floatingNumbers[numberId];
        if (number && number.move() <= 0) {
            delete floatingNumbers[numberId];
        }
    }

    for (const powerupId in powerups) {
        const currentPowerup = powerups[powerupId];
        if (!currentPowerup) continue;

        if (currentPowerup.move() <= 0) {
            delete powerups[powerupId];
            continue;
        }

        for (const missileId in missiles) {
            const playerMissile = missiles[missileId];
            if (!playerMissile || !powerups[powerupId]) continue;
            if (!this.collide(playerMissile, powerups[powerupId])) continue;

            delete missiles[missileId];
            state.playerHealth = Math.min(100, state.playerHealth + 20);
            Sound.stage_up();
            const newNumber = new FloatingNumber(powerups[powerupId].pos_x(), powerups[powerupId].pos_y(), 1, '+20');
            floatingNumbers[newNumber.id] = newNumber;
            delete powerups[powerupId];
        }
    }

    for (const enemyMissileId in enemyMissiles) {
        const enemyMissile = enemyMissiles[enemyMissileId];
        if (!enemyMissile) continue;

        if (this.collide(enemyMissile, player)) {
            const hitDamage = enemyMissile.damage || 10;
            delete enemyMissiles[enemyMissileId];
            state.collisions++;
            this.damagePlayer(hitDamage);
            continue;
        }

        if (enemyMissile.move() <= 0) {
            delete enemyMissiles[enemyMissileId];
        }
    }

    for (const particleId in explosionParticles) {
        const particle = explosionParticles[particleId];
        if (particle && this.outOfBounds(particle.move())) {
            delete explosionParticles[particleId];
        }
    }

    for (const enemyId in enemies) {
        const currentEnemy = enemies[enemyId];
        if (!currentEnemy) continue;

        if (currentEnemy.move(player.pos_y()) <= 0) {
            delete enemies[enemyId];
            continue;
        }

        if (this.collide(player, currentEnemy)) {
            const collisionDamage = currentEnemy.collisionDamage || 25;
            delete enemies[enemyId];
            state.collisions++;
            this.damagePlayer(collisionDamage);
            continue;
        }

        const newMissile = currentEnemy.fire();
        if (newMissile) {
            enemyMissiles[newMissile.id] = newMissile;
        }

        for (const missileId in missiles) {
            const playerMissile = missiles[missileId];
            if (!enemies[enemyId] || !playerMissile) continue;
            if (!this.collide(playerMissile, enemies[enemyId])) continue;

            const missileDamage = playerMissile.damage || 20;
            delete missiles[missileId];

            enemies[enemyId].damage(
                missileDamage,
                () => {
                    Sound.explosion();
                    state.score += enemies[enemyId].pointsKill;
                    const number = new FloatingNumber(enemies[enemyId].pos_x(), enemies[enemyId].pos_y(), 1, enemies[enemyId].pointsKill);
                    floatingNumbers[number.id] = number;
                    const newExplosionParticles = new Explosion(enemies[enemyId].pos_x(), enemies[enemyId].pos_y(), 5, 25);
                    for (const particleId in newExplosionParticles) {
                        explosionParticles[particleId] = newExplosionParticles[particleId];
                    }
                    delete enemies[enemyId];
                },
                () => {
                    Sound.hit();
                    state.score += enemies[enemyId].pointsDamage;
                    const number = new FloatingNumber(enemies[enemyId].pos_x(), enemies[enemyId].pos_y(), 1, enemies[enemyId].pointsDamage);
                    floatingNumbers[number.id] = number;
                }
            );
        }
    }

    if (state.phase === 'playing' && state.stageAdvanceScore > 0 && state.score >= state.stageAdvanceScore) {
        this.complete_stage();
    }

    cb();
};

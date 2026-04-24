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
    const playerDeathParticles = entities.playerDeathParticles;
    const stageEndExplosionParticles = entities.stageEndExplosionParticles;
    const rainbowBlasts = entities.rainbowBlasts;
    const enemies = entities.enemies;
    const player = entities.player;

    state.frameCount++;
    state.collisions = 0;

    let difficultyRatio = 0;
    if (state.stageAdvanceScore > 0) {
        difficultyRatio = state.score / state.stageAdvanceScore;
    }
    const speedMultiplier = (state.hyperspace ? 3 : 1) + difficultyRatio;

    const applyEnemyDamage = (enemyId, damageAmount, giveScore = true) => {
        if (!enemies[enemyId]) return;

        enemies[enemyId].damage(
            damageAmount,
            () => {
                if (!enemies[enemyId]) return;
                Sound.explosion();
                if (giveScore) {
                    state.score += enemies[enemyId].pointsKill;
                    const number = new FloatingNumber(enemies[enemyId].pos_x(), enemies[enemyId].pos_y(), 1, enemies[enemyId].pointsKill);
                    floatingNumbers[number.id] = number;
                }
                const newExplosionParticles = new Explosion(enemies[enemyId].pos_x(), enemies[enemyId].pos_y(), 5, 25);
                for (const particleId in newExplosionParticles) {
                    explosionParticles[particleId] = newExplosionParticles[particleId];
                }
                delete enemies[enemyId];
            },
            () => {
                if (!enemies[enemyId]) return;
                Sound.hit();
                if (giveScore) {
                    state.score += enemies[enemyId].pointsDamage;
                    const number = new FloatingNumber(enemies[enemyId].pos_x(), enemies[enemyId].pos_y(), 1, enemies[enemyId].pointsDamage);
                    floatingNumbers[number.id] = number;
                }
            }
        );
    };

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
        for (const particleId in stageEndExplosionParticles) {
            const particle = stageEndExplosionParticles[particleId];
            if (!particle) continue;
            particle.move();
            if (particle.life <= 0 || this.outOfBounds(particle)) {
                delete stageEndExplosionParticles[particleId];
            }
        }
        if (state.stageCompleteTimer <= 0) {
            state.entities.stageEndExplosionParticles = {};
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

    if (state.phase === 'player_death') {
        state.playerDeathTimer--;

        for (const numberId in floatingNumbers) {
            const number = floatingNumbers[numberId];
            if (number && number.move() <= 0) {
                delete floatingNumbers[numberId];
            }
        }

        for (const particleId in explosionParticles) {
            const particle = explosionParticles[particleId];
            if (particle && this.outOfBounds(particle.move())) {
                delete explosionParticles[particleId];
            }
        }

        if (state.playerDeathFlashTimer > 0) {
            state.playerDeathFlashTimer--;
        } else if (!Object.keys(playerDeathParticles).length && player) {
            const burst = PlayerDeathBurst(
                player.pos_x() + player.width / 2,
                player.pos_y() + player.height / 2,
                1800,
                cfg.playerMissileDamage
            );
            for (const particleId in burst) {
                playerDeathParticles[particleId] = burst[particleId];
            }
            Sound.explosion();
        }

        for (const enemyId in enemies) {
            const currentEnemy = enemies[enemyId];
            if (!currentEnemy) continue;

            if (currentEnemy.move(player ? player.pos_y() : undefined) <= 0) {
                delete enemies[enemyId];
            }
        }

        for (const particleId in playerDeathParticles) {
            const deathParticle = playerDeathParticles[particleId];
            if (!deathParticle) continue;

            deathParticle.move();
            if (deathParticle.life <= 0 || this.outOfBounds(deathParticle)) {
                delete playerDeathParticles[particleId];
                continue;
            }

            for (const enemyId in enemies) {
                if (!enemies[enemyId] || !playerDeathParticles[particleId]) continue;
                if (!this.collide(playerDeathParticles[particleId], enemies[enemyId])) continue;

                const deathParticleDamage = playerDeathParticles[particleId].damage || cfg.playerMissileDamage;
                delete playerDeathParticles[particleId];
                applyEnemyDamage(enemyId, deathParticleDamage, false);
                break;
            }
        }

        if (state.playerDeathTimer <= 0) {
            state.entities.playerDeathParticles = {};
            if (state.deathReturnsToMenu) {
                this.returnToStageSelectAfterDefeat();
            } else {
                this.restartStage(false);
            }
        }

        cb();
        return;
    }

    if (state.phase !== 'playing') {
        cb();
        return;
    }

    let up = Key.isDown(Key.UP) || Key.isDown(Key.ARROW_UP);
    let down = Key.isDown(Key.DOWN) || Key.isDown(Key.ARROW_DOWN);
    let left = Key.isDown(Key.LEFT) || Key.isDown(Key.ARROW_LEFT);
    let right = Key.isDown(Key.RIGHT) || Key.isDown(Key.ARROW_RIGHT);
    let shoot = Key.isDown(Key.SHOOT);

    let rainbow = false;
    if (state.autoplay) {
        shoot = true;
        let targetY = sc.max_y / 2;
        let targetSet = false;
        
        for (const id in enemyMissiles) {
            const m = enemyMissiles[id];
            if (m.pos_x() > player.pos_x() && m.pos_x() - player.pos_x() < 180) {
                if (Math.abs((m.pos_y() + m.height/2) - (player.pos_y() + player.height/2)) < 35) {
                    targetY = player.pos_y() + player.height/2 + (m.pos_y() > player.pos_y() ? -50 : 50);
                    targetSet = true;
                    break;
                }
            }
        }
        
        if (!targetSet && state.playerHealth < 60) {
            let safeToGetPowerup = true;
            for (const id in enemies) {
                if (enemies[id].pos_x() < player.pos_x() + 100 && enemies[id].pos_x() > player.pos_x() - 50) {
                    safeToGetPowerup = false; break;
                }
            }
            if (safeToGetPowerup) {
                for (const id in powerups) {
                    const p = powerups[id];
                    if (p.pos_x() > player.pos_x()) {
                        targetY = p.pos_y() + p.height / 2;
                        targetSet = true;
                        break;
                    }
                }
            }
        }
        
        if (!targetSet) {
            let closestDist = Infinity;
            for (const id in enemies) {
                const e = enemies[id];
                if (e.pos_x() > player.pos_x() && e.pos_x() - player.pos_x() < closestDist) {
                    closestDist = e.pos_x() - player.pos_x();
                    targetY = e.pos_y() + e.height / 2;
                }
            }
        }
        
        if (Object.keys(enemies).length > 12 || Object.keys(enemyMissiles).length > 6) {
            if (state.rainbowBlastsAvailable > 0) {
                rainbow = true;
            }
        }

        const playerCenterY = player.pos_y() + player.height / 2;
        up = false;
        down = false;
        left = false;
        right = false;

        targetY = Math.max(20, Math.min(sc.max_y - 20, targetY));

        if (targetY < playerCenterY - 5) {
            up = true;
        } else if (targetY > playerCenterY + 5) {
            down = true;
        }
        
        if (state.frameCount % 10 === 0) {
            console.log(JSON.stringify({
                event: 'AUTOPLAY_STATE',
                frame: state.frameCount,
                player: { x: Math.round(player.pos_x()), y: Math.round(player.pos_y()), hp: state.playerHealth },
                enemies: Object.keys(enemies).length,
                missiles: Object.keys(enemyMissiles).length,
                action: { up, down, shoot, rainbow }
            }));
        }
    }

    if (rainbow && typeof this.activateRainbowBlast === 'function') {
        this.activateRainbowBlast();
    }

    if (up) player.move_y(-2);
    if (down) player.move_y(2);
    if (left) player.move_x(-4);

    if (right) {
        player.move_x(2);
        state.hyperspace = true;
    } else {
        state.hyperspace = false;
    }

    if (shoot && (Date.now() - state.lastPlayerShotAt >= cfg.playerFireCooldownMs)) {
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

    if (this.createRainbowPowerupMaybe()) {
        const powerup = new RainbowPowerup(sc.max_x, Math.floor(Math.random() * sc.max_y));
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

    for (const blastId in rainbowBlasts) {
        const blast = rainbowBlasts[blastId];
        if (!blast) continue;

        if (blast.expand() > blast.maxRadius) {
            delete rainbowBlasts[blastId];
            continue;
        }

        for (const enemyId in enemies) {
            const enemy = enemies[enemyId];
            if (!enemy || blast.hitEnemyIds[enemyId]) continue;

            const enemyCenterX = enemy.pos_x() + enemy.width / 2;
            const enemyCenterY = enemy.pos_y() + enemy.height / 2;
            const distance = Math.sqrt(
                (enemyCenterX - blast.x) * (enemyCenterX - blast.x) +
                (enemyCenterY - blast.y) * (enemyCenterY - blast.y)
            );

            const innerRadius = blast.radius - blast.thickness;
            const outerRadius = blast.radius + blast.thickness;
            if (distance < innerRadius || distance > outerRadius) {
                continue;
            }

            blast.hitEnemyIds[enemyId] = true;
            applyEnemyDamage(enemyId, blast.damage || 200);
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
            const collectedPowerup = powerups[powerupId];
            if (!collectedPowerup) {
                continue;
            }

            if (collectedPowerup.type === 'rainbow') {
                state.rainbowBlastsAvailable = Math.min(3, state.rainbowBlastsAvailable + 1);
                Sound.stage_up();
            } else {
                state.playerHealth = Math.min(100, state.playerHealth + 20);
                Sound.stage_up();
            }

            const floatingText = collectedPowerup.type === 'rainbow' ? '+RAINBOW' : '+20';
            const newNumber = new FloatingNumber(collectedPowerup.pos_x(), collectedPowerup.pos_y(), 1, floatingText);
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
            applyEnemyDamage(enemyId, missileDamage);
        }
    }

    if (state.phase === 'playing' && state.stageAdvanceScore > 0 && state.score >= state.stageAdvanceScore) {
        this.complete_stage();
    }

    cb();
};

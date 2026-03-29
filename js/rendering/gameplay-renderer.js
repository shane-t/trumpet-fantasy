window.GameRenderingModules = window.GameRenderingModules || {};

window.GameRenderingModules.renderGameplay = function (state) {
    const ctx = this.context;
    const sc = state.stateCanvas;
    const player = state.entities.player;
    const stageCfg = this.config.stages[state.stage] || this.config.stages[this.config.stages.length - 1];

    if (!stageCfg || !player) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        return;
    }

    const particleColours = state.hyperspace ? this.config.starColoursHyperspace : stageCfg.particleColours;
    const bgTopColour = stageCfg.bgColour || stageCfg.bgColor || '#000000';
    const bgBottomColour = stageCfg.bgColourBottom || stageCfg.bgColorBottom || bgTopColour;
    const enemyMissileColour = stageCfg.enemyMissileColour || stageCfg.enemyMissileColor || '#ff33cc';
    const bgRgb = this.hexToRgb(bgTopColour);
    const bgLuminance = bgRgb ? ((bgRgb.r * 0.2126) + (bgRgb.g * 0.7152) + (bgRgb.b * 0.0722)) : 0;
    const bulletMainColour = bgLuminance > 150 ? '#101010' : '#f8f8f8';
    const bulletAccentColour = bgLuminance > 150 ? '#000000' : '#ffff66';

    const bgGradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    bgGradient.addColorStop(0, bgTopColour);
    bgGradient.addColorStop(1, bgBottomColour);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const backgroundThings = state.backgroundThings || [];
    for (const thing of backgroundThings) {
        if (thing.type === 'shape' && thing.kind === 'bubble') {
            ctx.beginPath();
            ctx.arc(thing.pos_x, thing.pos_y, thing.size, 0, Math.PI * 2);
            ctx.strokeStyle = stageCfg.particleColours[thing.speed];
            ctx.lineWidth = 0.6;
            ctx.stroke();
            continue;
        }

        if (thing.type === 'image' && thing.kind === 'cloud') {
            const cloudAlphas = [0.28, 0.48, 0.7, 1.0];
            ctx.globalAlpha = cloudAlphas[thing.speed];
            ctx.drawImage(this.render_cache.cloud_img, thing.pos_x, thing.pos_y, thing.size * 4, thing.size * 2);
            ctx.globalAlpha = 1.0;
            continue;
        }

        ctx.fillStyle = particleColours[thing.speed];
        ctx.fillRect(thing.pos_x, thing.pos_y, 1, 1);
        const rgb = this.hexToRgb(particleColours[thing.speed]);
        if (rgb) {
            ctx.fillStyle = `rgb(${Math.max(0, rgb.r - 30)},${Math.max(0, rgb.g - 30)},${Math.max(0, rgb.b - 30)})`;
        }
        const trailLength = thing.speed * (state.hyperspace ? 3 : 1);
        ctx.fillRect(thing.pos_x, thing.pos_y, trailLength, 1);
    }

    ctx.drawImage(this.render_cache.player_img, player.pos_x(), player.pos_y());

    for (const missileId in state.entities.missiles) {
        const missile = state.entities.missiles[missileId];
        if (!missile) continue;

        ctx.fillStyle = bulletMainColour;
        const missileStar = [
            [missile.pos_x() + 1, missile.pos_y() + 1],
            [missile.pos_x() + 1, missile.pos_y() - 1],
            [missile.pos_x(), missile.pos_y()],
            [missile.pos_x() + 2, missile.pos_y()]
        ];

        for (const [x, y] of missileStar) {
            ctx.fillRect(x, y, 1, 1);
        }

        ctx.fillStyle = bulletAccentColour;
        ctx.fillRect(missile.pos_x(), missile.pos_y(), 1, 1);
    }

    for (const enemyId in state.entities.enemies) {
        const enemy = state.entities.enemies[enemyId];
        if (!enemy) continue;

        if (enemy.type === 'fish') {
            ctx.drawImage(this.render_cache.fish_img, enemy.pos_x(), enemy.pos_y());
        } else if (enemy.type === 'triangle') {
            ctx.drawImage(this.render_cache.triangle_img, enemy.pos_x(), enemy.pos_y());
        } else if (enemy.type === 'spoon') {
            ctx.drawImage(this.render_cache.spoon_img, enemy.pos_x(), enemy.pos_y());
        } else {
            ctx.drawImage(this.render_cache.enemy_img, enemy.pos_x(), enemy.pos_y());
        }

        if (!enemy.showHealthBar) continue;

        const healthRatio = Math.max(0, enemy.health / enemy.maxHealth);
        const healthX = enemy.pos_x();
        const healthY = enemy.pos_y() - 5;
        ctx.fillStyle = '#300000';
        ctx.fillRect(healthX, healthY, enemy.width, 3);

        if (healthRatio > 0.55) {
            ctx.fillStyle = '#00ff66';
        } else if (healthRatio > 0.25) {
            ctx.fillStyle = '#ffcc00';
        } else {
            ctx.fillStyle = '#ff3300';
        }

        ctx.fillRect(healthX, healthY, Math.floor(enemy.width * healthRatio), 3);
    }

    for (const powerupId in state.entities.powerups) {
        const powerup = state.entities.powerups[powerupId];
        if (!powerup) continue;
        ctx.drawImage(this.render_cache.health_img, powerup.pos_x(), powerup.pos_y(), powerup.width, powerup.height);
    }

    for (const missileId in state.entities.enemyMissiles) {
        const missile = state.entities.enemyMissiles[missileId];
        if (!missile) continue;
        ctx.fillStyle = enemyMissileColour;
        ctx.fillRect(missile.pos_x(), missile.pos_y(), missile.width, missile.height);
    }

    if (state.hyperspace) {
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = this.config.playertrailColoursHyperspace[Math.floor(Math.random() * 4)];
            ctx.fillRect(0, player.pos_y() + 11 + i, player.pos_x(), 1);
        }
    }

    ctx.font = 'bold 12px monospace';

    for (const numberId in state.entities.floatingNumbers) {
        const number = state.entities.floatingNumbers[numberId];
        if (!number) continue;
        ctx.fillStyle = this.config.scoreColour;
        ctx.fillText(String(number.number), number.pos_x(), number.pos_y());
    }

    for (const particleId in state.entities.explosionParticles) {
        const particle = state.entities.explosionParticles[particleId];
        if (!particle) continue;
        ctx.fillStyle = this.config.playertrailColoursHyperspace[Math.floor(Math.random() * 4)];
        ctx.fillRect(particle.pos_x(), particle.pos_y(), particle.width, particle.height);
    }

    const lifeIconSize = 18;
    const lifeIconPad = 4;
    for (let index = 0; index < state.playerLives; index++) {
        ctx.drawImage(this.render_cache.player_img, sc.max_x - (index + 1) * (lifeIconSize + lifeIconPad), 14, lifeIconSize, lifeIconSize);
    }

    const healthPct = state.playerHealth / 100;
    let healthBarColor = '#00cc00';
    if (healthPct <= 0.5 && healthPct > 0.3) {
        healthBarColor = '#cc6600';
    } else if (healthPct <= 0.3 && healthPct > 0.15) {
        healthBarColor = '#cc0000';
    } else if (healthPct <= 0.15) {
        healthBarColor = state.frameCount % 12 < 6 ? '#cc00cc' : '#330033';
    } else if (healthPct <= 0.7) {
        healthBarColor = '#cccc00';
    }

    ctx.fillStyle = healthBarColor;
    ctx.fillRect(0, 0, Math.max(0, Math.floor(sc.max_x * healthPct)), 10);

    ctx.fillStyle = this.config.scoreColour;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`Score:${state.score}`, sc.score_x, sc.score_y);
    ctx.fillText(`Stage ${state.stage + 1}`, 8, sc.score_y);

    if (state.collisions) {
        ctx.fillStyle = this.config.collisionColour;
        ctx.globalAlpha = 0.15;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.globalAlpha = 1.0;
    }

    if (state.paused && state.phase === 'playing') {
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px monospace';
        ctx.fillStyle = '#ffff00';
        ctx.fillText('PAUSED', sc.max_x / 2, sc.max_y / 2);
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('PRESS P TO RESUME', sc.max_x / 2, sc.max_y / 2 + 28);
        ctx.textAlign = 'left';
    }

    if (state.phase === 'life_lost') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, sc.max_x, sc.max_y);
        ctx.textAlign = 'center';
        ctx.font = 'bold 42px monospace';
        ctx.fillStyle = '#ff4444';
        ctx.fillText('LIFE LOST!', sc.max_x / 2, sc.max_y / 2 - 10);
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('LIVES REMAINING: ' + state.playerLives, sc.max_x / 2, sc.max_y / 2 + 36);
        ctx.textAlign = 'left';
    }
};

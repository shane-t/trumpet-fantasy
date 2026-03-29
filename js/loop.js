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
        this.state.phase = 'splash';
        this.state.background_things = BackgroundThings.create(250, this.state.stateCanvas, 'particle', 'star');
        this.fill_render_cache();
    },

    begin_game: function () {
        Sound.init();
        this.state.phase = 'playing';
        this.state.stage = 0;
        this.state.score = 0;
        this.state.player_health = 100;
        this.state.frame_count = 0;
        this.state.stage_message_timer = 0;
        this.state.last_player_shot_at = 0;
        this.state.last_player_hit_at = 0;
        this.state.stage_advance_score = this.config.stages[0].points_to_advance;
        this.state.hyperspace = false;
        this.state.collisions = 0;
        this.state.player_lives = 3;
        this.state.life_lost_timer = 0;
        this.state.entities.missiles = {};
        this.state.entities.enemy_missiles = {};
        this.state.entities.enemies = {};
        this.state.entities.powerups = {};
        this.state.entities.floating_numbers = {};
        this.state.entities.explosion_particles = {};
        this.state.entities.player = new Player(this.state.stateCanvas);
        this.state.background_things = BackgroundThings.create(
            this.config.stages[0].background_thing_count,
            this.state.stateCanvas,
            this.config.stages[0].background_thing_type,
            this.config.stages[0].background_thing_kind
        );
    },

    damage_player: function (amount) {
        const now = Date.now();
        if (now - this.state.last_player_hit_at < this.config.player_hit_cooldown_ms) {
            return;
        }
        this.state.last_player_hit_at = now;
        this.state.player_health = Math.max(0, this.state.player_health - amount);
        Sound.player_hit();
        if (this.state.player_health <= 0) {
            this.state.player_lives--;
            if (this.state.player_lives <= 0) {
                this.state.phase = 'gameover';
                Sound.game_over();
            } else {
                this.restart_stage();
            }
        }
    },

    restart_stage() {
        this.state.player_health = 100;
        this.state.last_player_hit_at = 0;
        this.state.last_player_shot_at = 0;
        this.state.entities.enemies = {};
        this.state.entities.enemy_missiles = {};
        this.state.entities.missiles = {};
        this.state.entities.powerups = {};
        this.state.entities.player = new Player(this.state.stateCanvas);
        this.state.phase = 'life_lost';
        this.state.life_lost_timer = 160;
    },

    advance_stage_score_needed() {
        return this.state.stage_advance_score;
    },

    render(state) {
        var background_things = state.background_things,
            config = this.config,
            stage_cfg = config.stages[state.stage] || config.stages[config.stages.length - 1],
            particle_colours = state.hyperspace ? config.star_colours_hyperspace : stage_cfg.particle_colours,
            ctx = this.context,
            sc = state.stateCanvas,
            i = 0,
            j = 0,
            player = state.entities.player,
            rgb,
            trail_multiplier = (state.hyperspace ? 3 : 1),
            trail_length,
            missile_star,
            explosion_particle,
            missile,
            enemy,
            powerup,
            floating_number,
            health_pct,
            bar_colour,
            bar_width;

        // Stage transition: full hyperspace screen, no game entities
        if (state.phase === 'stage_transition') {
            ctx.fillStyle = '#000005';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            if (state.transition_stars) {
                for (i = 0; i < state.transition_stars.length; i++) {
                    const ts = state.transition_stars[i];
                    ctx.fillStyle = config.star_colours_hyperspace[ts.speed];
                    ctx.fillRect(ts.pos_x, ts.pos_y, 1, 1);
                    const tsRgb = this.hex_to_rgb(config.star_colours_hyperspace[ts.speed]);
                    if (tsRgb) {
                        ctx.fillStyle = 'rgb(' + Math.max(0, tsRgb.r - 30) + ',' + Math.max(0, tsRgb.g - 30) + ',' + Math.max(0, tsRgb.b - 30) + ')';
                    }
                    ctx.fillRect(ts.pos_x, ts.pos_y, ts.speed * 3, 1);
                }
            }
            if (player) {
                for (i = 0; i < 3; i++) {
                    ctx.fillStyle = config.playertrail_colours_hyperspace[Math.floor(Math.random() * 4)];
                    ctx.fillRect(0, player.pos_y() + 11 + i, player.pos_x(), 1);
                }
                ctx.drawImage(this.render_cache.player_img, player.pos_x(), player.pos_y());
            }
            ctx.textAlign = 'center';
            ctx.font = 'bold 36px monospace';
            ctx.fillStyle = '#ffff00';
            ctx.fillText(stage_cfg.name, sc.max_x / 2, sc.max_y / 2);
            ctx.font = 'bold 18px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('STAGE ' + (state.stage + 1), sc.max_x / 2, sc.max_y / 2 + 40);
            ctx.textAlign = 'left';
            return;
        }

        // Background gradient
        const bg_grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bg_grad.addColorStop(0, stage_cfg.bg_colour);
        bg_grad.addColorStop(1, stage_cfg.bg_colour_bottom || stage_cfg.bg_colour);
        ctx.fillStyle = bg_grad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Background things — particles, shapes, or images depending on stage
        if (background_things) {
            for (i = 0; i < background_things.length; i++) {
                if (background_things[i].type === 'shape' && background_things[i].kind === 'bubble') {
                    ctx.beginPath();
                    ctx.arc(background_things[i].pos_x, background_things[i].pos_y, background_things[i].size, 0, Math.PI * 2);
                    ctx.strokeStyle = stage_cfg.particle_colours[background_things[i].speed];
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                } else if (background_things[i].type === 'image' && background_things[i].kind === 'cloud') {
                    const cloud_alphas = [0.28, 0.48, 0.70, 1.0];
                    ctx.globalAlpha = cloud_alphas[background_things[i].speed];
                    ctx.drawImage(this.render_cache.cloud_img, background_things[i].pos_x, background_things[i].pos_y, background_things[i].size * 4, background_things[i].size * 2);
                    ctx.globalAlpha = 1.0;
                } else {
                    ctx.fillStyle = particle_colours[background_things[i].speed];
                    ctx.fillRect(background_things[i].pos_x, background_things[i].pos_y, 1, 1);
                    rgb = this.hex_to_rgb(particle_colours[background_things[i].speed]);
                    if (rgb) {
                        ctx.fillStyle = "rgb(" + Math.max(0,rgb.r-30) + "," + Math.max(0,rgb.g-30) + "," + Math.max(0,rgb.b-30) + ")";
                    }
                    trail_length = background_things[i].speed * trail_multiplier;
                    ctx.fillRect(background_things[i].pos_x, background_things[i].pos_y, trail_length, 1);
                }
            }
        }

        // Splash screen
        if (state.phase === 'splash') {
            ctx.textAlign = 'center';
            ctx.font = 'bold 48px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('TRUMPET FANTASY', sc.max_x / 2, sc.max_y / 2 - 40);
            ctx.font = 'bold 20px monospace';
            ctx.fillStyle = '#ffff00';
            ctx.fillText('PRESS ANY KEY TO START', sc.max_x / 2, sc.max_y / 2 + 20);

            ctx.font = 'bold 14px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('MOVE: W A S D   SHOOT: SPACE   PAUSE: P   SKIP STAGE (TEST): K', sc.max_x / 2, sc.max_y / 2 + 55);

            ctx.drawImage(this.render_cache.health_img, sc.max_x / 2 - 150, sc.max_y / 2 + 85, 24, 24);
            ctx.font = 'bold 16px monospace';
            ctx.fillStyle = '#aaffaa';
            ctx.fillText('SHOOT HEALTH PICKUPS TO RESTORE HP (+20)', sc.max_x / 2 + 45, sc.max_y / 2 + 103);
            ctx.textAlign = 'left';
            return;
        }

        // Victory screen
        if (state.phase === 'victory') {
            ctx.fillStyle = '#000005';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            if (state.transition_stars) {
                for (i = 0; i < state.transition_stars.length; i++) {
                    const vt = state.transition_stars[i];
                    ctx.fillStyle = config.star_colours_hyperspace[vt.speed];
                    ctx.fillRect(vt.pos_x, vt.pos_y, 1, 1);
                    ctx.fillRect(vt.pos_x, vt.pos_y, vt.speed * 3, 1);
                }
            }
            ctx.textAlign = 'center';
            ctx.font = 'bold 52px monospace';
            ctx.fillStyle = '#ffff00';
            ctx.fillText('YOU WIN!', sc.max_x / 2, sc.max_y / 2 - 60);
            ctx.font = 'bold 28px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('CONGRATULATIONS, TRUMPET HERO', sc.max_x / 2, sc.max_y / 2);
            ctx.font = 'bold 22px monospace';
            ctx.fillStyle = '#aaffaa';
            ctx.fillText('FINAL SCORE: ' + state.score, sc.max_x / 2, sc.max_y / 2 + 44);
            ctx.font = 'bold 16px monospace';
            ctx.fillStyle = '#ffff00';
            ctx.fillText('PRESS ANY KEY TO PLAY AGAIN', sc.max_x / 2, sc.max_y / 2 + 84);
            ctx.textAlign = 'left';
            return;
        }

        // Game over screen
        if (state.phase === 'gameover') {
            ctx.textAlign = 'center';
            ctx.font = 'bold 56px monospace';
            ctx.fillStyle = '#ff0000';
            ctx.fillText('GAME OVER', sc.max_x / 2, sc.max_y / 2 - 50);
            ctx.font = 'bold 24px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('SCORE: ' + state.score, sc.max_x / 2, sc.max_y / 2 + 10);
            ctx.font = 'bold 18px monospace';
            ctx.fillStyle = '#ffff00';
            ctx.fillText('PRESS ANY KEY TO CONTINUE', sc.max_x / 2, sc.max_y / 2 + 50);
            ctx.textAlign = 'left';
            return;
        }

        // Playing / stage transition — draw game entities
        ctx.drawImage(this.render_cache.player_img, player.pos_x(), player.pos_y());

        for (let i in state.entities.missiles) {
            ctx.fillStyle = this.config.playertrail_colours_hyperspace[Math.floor(Math.random() * 4)];
            missile_star = [
                [state.entities.missiles[i].pos_x() + 1, state.entities.missiles[i].pos_y() + 1],
                [state.entities.missiles[i].pos_x() + 1, state.entities.missiles[i].pos_y() - 1],
                [state.entities.missiles[i].pos_x(),     state.entities.missiles[i].pos_y()],
                [state.entities.missiles[i].pos_x() + 2, state.entities.missiles[i].pos_y()],
            ];
            for (j = 0; j < missile_star.length; j++) {
                ctx.fillRect(missile_star[j][0], missile_star[j][1], 1, 1);
            }
        }

        for (i in state.entities.enemies) {
            enemy = state.entities.enemies[i];
            if (enemy.type === 'fish') {
                ctx.drawImage(this.render_cache.fish_img, enemy.pos_x(), enemy.pos_y());
            } else if (enemy.type === 'triangle') {
                ctx.drawImage(this.render_cache.triangle_img, enemy.pos_x(), enemy.pos_y());
            } else {
                ctx.drawImage(this.render_cache.enemy_img, enemy.pos_x(), enemy.pos_y());
            }

            if (enemy.show_health_bar) {
                const health_ratio = Math.max(0, enemy.health / enemy.max_health);
                const health_x = enemy.pos_x();
                const health_y = enemy.pos_y() - 5;
                ctx.fillStyle = '#300000';
                ctx.fillRect(health_x, health_y, enemy.width, 3);
                if (health_ratio > 0.55) {
                    ctx.fillStyle = '#00ff66';
                } else if (health_ratio > 0.25) {
                    ctx.fillStyle = '#ffcc00';
                } else {
                    ctx.fillStyle = '#ff3300';
                }
                ctx.fillRect(health_x, health_y, Math.floor(enemy.width * health_ratio), 3);
            }
        }

        for (i in state.entities.powerups) {
            powerup = state.entities.powerups[i];
            ctx.drawImage(this.render_cache.health_img, powerup.pos_x(), powerup.pos_y(), powerup.width, powerup.height);
        }

        for (i in state.entities.enemy_missiles) {
            missile = state.entities.enemy_missiles[i];
            ctx.fillStyle = stage_cfg.enemy_missile_colour;
            ctx.fillRect(missile.pos_x(), missile.pos_y(), missile.width, missile.height);
        }

        if (state.hyperspace) {
            for (i = 0; i < 3; i++) {
                ctx.fillStyle = this.config.playertrail_colours_hyperspace[Math.floor(Math.random() * 4)];
                ctx.fillRect(0, player.pos_y() + 11 + i, player.pos_x(), 1);
            }
        }

        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = this.config.score_colour;

        for (i in state.entities.floating_numbers) {
            floating_number = state.entities.floating_numbers[i];
            ctx.fillText(floating_number.number + '', floating_number.pos_x(), floating_number.pos_y());
        }

        for (i in state.entities.explosion_particles) {
            explosion_particle = state.entities.explosion_particles[i];
            ctx.fillStyle = this.config.playertrail_colours_hyperspace[Math.floor(Math.random() * 4)];
            ctx.fillRect(explosion_particle.pos_x(), explosion_particle.pos_y(), explosion_particle.width, explosion_particle.height);
        }

        // Lives — small trumpet icons top-right (below health bar)
        const lifeIconSize = 18;
        const lifeIconPad = 4;
        for (let l = 0; l < state.player_lives; l++) {
            ctx.drawImage(
                this.render_cache.player_img,
                sc.max_x - (l + 1) * (lifeIconSize + lifeIconPad),
                14,
                lifeIconSize,
                lifeIconSize
            );
        }

        // Health bar — 10px at top of screen
        health_pct = state.player_health / 100;
        bar_width = Math.max(0, Math.floor(sc.max_x * health_pct));
        if (health_pct > 0.70) {
            bar_colour = '#00cc00';
        } else if (health_pct > 0.50) {
            bar_colour = '#cccc00';
        } else if (health_pct > 0.30) {
            bar_colour = '#cc6600';
        } else if (health_pct > 0.15) {
            bar_colour = '#cc0000';
        } else {
            bar_colour = (state.frame_count % 12 < 6) ? '#cc00cc' : '#330033';
        }
        ctx.fillStyle = bar_colour;
        ctx.fillRect(0, 0, bar_width, 10);

        // Score and stage label
        ctx.fillStyle = this.config.score_colour;
        ctx.font = 'bold 12px monospace';
        ctx.fillText('Score:' + state.score, sc.score_x, sc.score_y);
        ctx.fillText('Stage ' + (state.stage + 1), 8, sc.score_y);

        if (state.collisions) {
            ctx.fillStyle = config.collision_colour;
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

        // Life lost overlay
        if (state.phase === 'life_lost') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, sc.max_x, sc.max_y);
            ctx.textAlign = 'center';
            ctx.font = 'bold 42px monospace';
            ctx.fillStyle = '#ff4444';
            ctx.fillText('LIFE LOST!', sc.max_x / 2, sc.max_y / 2 - 10);
            ctx.font = 'bold 20px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('LIVES REMAINING: ' + state.player_lives, sc.max_x / 2, sc.max_y / 2 + 36);
            ctx.textAlign = 'left';
        }
    },

    think(cb) {

        var background_things = this.state.background_things,
            missiles = this.state.entities.missiles,
            enemy_missiles = this.state.entities.enemy_missiles,
            powerups = this.state.entities.powerups,
            floating_numbers = this.state.entities.floating_numbers,
            explosion_particles = this.state.entities.explosion_particles,
            player = this.state.entities.player,
            sc = this.state.stateCanvas,
            cfg = this.config,
            speed_multiplier = this.state.hyperspace ? 3 : 1,
            launch_time,
            enemies = this.state.entities.enemies,
            new_enemy,
            new_missile,
            powerup,
            new_number,
            new_explosion_particles,
            next_stage,
            i, j, k, that = this;

        this.state.frame_count++;
        this.state.collisions = 0;

        // Always animate background things regardless of phase
        if (background_things) {
            for (i = 0; i < background_things.length; i++) {
                if (background_things[i].type === 'shape' && background_things[i].kind === 'bubble') {
                    background_things[i].pos_x -= cfg.star_speeds[background_things[i].speed] * 0.5;
                    background_things[i].pos_y -= 0.3;
                    if (background_things[i].pos_x <= 0 || background_things[i].pos_y <= 0) {
                        background_things[i].pos_x = sc.max_x;
                        background_things[i].pos_y = Math.floor(Math.random() * sc.max_y);
                    }
                } else if (background_things[i].type === 'image' && background_things[i].kind === 'cloud') {
                    background_things[i].pos_x -= cfg.star_speeds[background_things[i].speed] * 0.25;
                    if (background_things[i].pos_x <= -200) {
                        background_things[i].pos_x = sc.max_x + Math.floor(Math.random() * 200);
                        background_things[i].pos_y = Math.floor(Math.random() * Math.max(1, sc.max_y - 140));
                    }
                } else {
                    background_things[i].pos_x -= cfg.star_speeds[background_things[i].speed] * speed_multiplier;
                    if (background_things[i].pos_x <= 0) {
                        background_things[i].pos_x = sc.max_x;
                        background_things[i].pos_y = Math.floor(Math.random() * sc.max_y);
                    }
                }
            }
        }

        // Stage transition: animate transition stars and count down
        if (this.state.phase === 'stage_transition') {
            this.state.stage_message_timer--;
            if (this.state.transition_stars) {
                for (i = 0; i < this.state.transition_stars.length; i++) {
                    this.state.transition_stars[i].pos_x -= cfg.star_speeds[this.state.transition_stars[i].speed] * 3;
                    if (this.state.transition_stars[i].pos_x <= 0) {
                        this.state.transition_stars[i].pos_x = sc.max_x;
                        this.state.transition_stars[i].pos_y = Math.floor(Math.random() * sc.max_y);
                    }
                }
            }
            if (this.state.stage_message_timer <= 0) {
                this.state.phase = 'playing';
                this.state.transition_stars = null;
            }
            cb();
            return;
        }

        // Life lost: count down then resume
        if (this.state.phase === 'life_lost') {
            this.state.life_lost_timer--;
            if (this.state.life_lost_timer <= 0) {
                this.state.phase = 'playing';
            }
            cb();
            return;
        }

        // Victory: keep transition stars flying
        if (this.state.phase === 'victory') {
            if (this.state.transition_stars) {
                for (i = 0; i < this.state.transition_stars.length; i++) {
                    this.state.transition_stars[i].pos_x -= cfg.star_speeds[this.state.transition_stars[i].speed] * 3;
                    if (this.state.transition_stars[i].pos_x <= 0) {
                        this.state.transition_stars[i].pos_x = sc.max_x;
                        this.state.transition_stars[i].pos_y = Math.floor(Math.random() * sc.max_y);
                    }
                }
            }
            cb();
            return;
        }

        // Skip game logic unless actively playing
        if (this.state.phase !== 'playing') {
            cb();
            return;
        }

        if (Key.isDown(Key.UP))   player.move_y(-2);
        if (Key.isDown(Key.DOWN)) player.move_y(2);
        if (Key.isDown(Key.LEFT)) player.move_x(-4);

        if (Key.isDown(Key.RIGHT)) {
            player.move_x(2);
            this.state.hyperspace = true;
        } else {
            this.state.hyperspace = false;
        }

        launch_time = Key.isDown(Key.SHOOT);
        if (launch_time && (Date.now() - this.state.last_player_shot_at >= cfg.player_fire_cooldown_ms)) {
            missiles[Date.now()] = player.fire(cfg.player_missile_damage);
            this.state.last_player_shot_at = Date.now();
            Sound.shoot();
        }

        new_enemy = this.create_enemy_maybe();
        if (new_enemy) {
            enemies[new_enemy.id] = new_enemy;
        }

        if (this.create_powerup_maybe()) {
            powerup = new HealthPowerup(this.state.stateCanvas.max_x, Math.floor(Math.random() * this.state.stateCanvas.max_y));
            powerups[powerup.id] = powerup;
        }

        for (i in missiles) {
            if (missiles[i].move() >= sc.max_x) {
                delete missiles[i];
            }
        }

        for (i in floating_numbers) {
            if (floating_numbers[i].move() <= 0) {
                delete floating_numbers[i];
            }
        }

        for (i in powerups) {
            const current_powerup = powerups[i];
            if (!current_powerup) {
                console.warn('[think] stale powerup entry', i);
                continue;
            }
            if (current_powerup.move() <= 0) {
                delete powerups[i];
                continue;
            }
            for (j in missiles) {
                const player_missile = missiles[j];
                if (!player_missile || !powerups[i]) continue;
                if (this.collide(player_missile, powerups[i])) {
                    delete missiles[j];
                    this.state.player_health = Math.min(100, this.state.player_health + 20);
                    Sound.stage_up();
                    new_number = new FloatingNumber(powerups[i].pos_x(), powerups[i].pos_y(), 1, '+20');
                    this.state.entities.floating_numbers[new_number.id] = new_number;
                    delete powerups[i];
                }
            }
        }

        for (i in enemy_missiles) {
            const enemy_missile = enemy_missiles[i];
            if (!enemy_missile) {
                console.warn('[think] stale enemy_missile entry', i);
                continue;
            }
            if (this.collide(enemy_missile, player)) {
                const hit_damage = enemy_missile.damage || 10;
                delete enemy_missiles[i];
                this.state.collisions++;
                this.damage_player(hit_damage);
            } else if (enemy_missile.move() <= 0) {
                delete enemy_missiles[i];
            }
        }

        for (i in explosion_particles) {
            if (this.out_of_bounds(explosion_particles[i].move())) {
                delete explosion_particles[i];
            }
        }

        for (i in enemies) {
            const current_enemy = enemies[i];
            if (!current_enemy) {
                console.warn('[think] stale enemy entry', i);
                continue;
            }
            if (current_enemy.move(player.pos_y()) <= 0) {
                delete enemies[i];
            } else if (this.collide(player, current_enemy)) {
                const collision_damage = current_enemy.collision_damage || 25;
                delete enemies[i];
                this.state.collisions++;
                this.damage_player(collision_damage);
            } else {
                new_missile = current_enemy.fire();
                if (new_missile) {
                    enemy_missiles[new_missile.id] = new_missile;
                }
                for (j in missiles) {
                    const player_missile = missiles[j];
                    if (!enemies[i] || !player_missile) continue;
                    if (this.collide(player_missile, enemies[i])) {
                        const missile_damage = player_missile.damage || 20;
                        delete missiles[j];
                        enemies[i].damage(missile_damage,
                            function () {   // enemy killed
                                Sound.explosion();
                                that.state.score += enemies[i].points_kill;
                                new_number = new FloatingNumber(enemies[i].pos_x(), enemies[i].pos_y(), 1, enemies[i].points_kill);
                                that.state.entities.floating_numbers[new_number.id] = new_number;
                                new_explosion_particles = new Explosion(enemies[i].pos_x(), enemies[i].pos_y(), 5, 25);
                                for (k in new_explosion_particles) {
                                    that.state.entities.explosion_particles[k] = new_explosion_particles[k];
                                }
                                delete enemies[i];
                            },
                            function () {   // enemy damaged
                                Sound.hit();
                                that.state.score += enemies[i].points_damage;
                                new_number = new FloatingNumber(enemies[i].pos_x(), enemies[i].pos_y(), 1, enemies[i].points_damage);
                                that.state.entities.floating_numbers[new_number.id] = new_number;
                            }
                        );
                    }
                }
            }
        }

        // Check stage advancement
        if (this.state.score >= this.state.stage_advance_score) {
            this.advance_stage();
        }

        cb();
    },

    eq: [],

    config: {
        star_speeds: [0.5, 1, 2, 4],
        player_fire_cooldown_ms: 110,
        player_missile_damage: 20,
        player_hit_cooldown_ms: 360,
        collision_colour: '#ffffff',
        star_colours_hyperspace: ['#000077', '#37FDFC', '#ffffff', '#ffffff'],
        startrail_length: 5,
        playertrail_colours_hyperspace: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
        floating_number_speed: 1,
        bill_src: 'img/trumpet.png',
        miaow_src: 'img/miaow.png',
        fish_src: 'img/fish.png',
        triangle_src: 'img/triangle.png',
        health_src: 'img/health.png',
        cloud_src: 'img/cloud.png',
        score_colour: '#ffffff',
        stages: [
            {
                name: 'THE DEEP',
                bg_colour: '#000c38',
                bg_colour_bottom: '#000008',
                background_thing_type: 'shape',
                background_thing_kind: 'bubble',
                background_thing_count: 220,
                particle_colours: ['#1a4a6a', '#1a6a8a', '#2a8aaa', '#4aaacc'],
                enemy_type: 'fish',
                enemy_missile_colour: '#ffee33',
                points_to_advance: 300   // 20 fish kills at 15pts each
            },
            {
                name: 'OUTER SPACE',
                bg_colour: '#00007a',
                bg_colour_bottom: '#00001e',
                background_thing_type: 'particle',
                background_thing_kind: 'star',
                background_thing_count: 250,
                particle_colours: ['#777777', '#999999', '#cccccc', '#ffffff'],
                enemy_type: 'miaow',
                enemy_missile_colour: '#ff33cc',
                points_to_advance: 140   // tougher than before
            },
            {
                name: 'SKY',
                bg_colour: '#4ab4e8',
                bg_colour_bottom: '#d0eeff',
                background_thing_type: 'image',
                background_thing_kind: 'cloud',
                background_thing_count: 18,
                particle_colours: ['#d9f3ff', '#e8f8ff', '#f2fbff', '#ffffff'],
                enemy_type: 'triangle',
                enemy_missile_colour: '#4a0033',
                points_to_advance: 220
            }
        ]
    },

    render_cache: {
      player_img: null,
      enemy_img: null,
      fish_img: null,
            triangle_img: null,
            health_img: null,
            cloud_img: null,
    },

    fill_render_cache: function () {

        this.render_cache.player_img = new Image();
        this.render_cache.player_img.src = this.config.bill_src;
        this.render_cache.enemy_img = new Image();
        this.render_cache.enemy_img.src = this.config.miaow_src;
        this.render_cache.fish_img = new Image();
        this.render_cache.fish_img.src = this.config.fish_src;
        this.render_cache.triangle_img = new Image();
        this.render_cache.triangle_img.src = this.config.triangle_src;
        this.render_cache.health_img = new Image();
        this.render_cache.health_img.src = this.config.health_src;
        this.render_cache.cloud_img = new Image();
        this.render_cache.cloud_img.src = this.config.cloud_src;
    },

    state: {
        started: false,
        paused: false,
        hyperspace: false,
        phase: 'splash',       // 'splash' | 'playing' | 'stage_transition' | 'life_lost' | 'gameover'
        stage: 0,
        stage_advance_score: 300,
        stage_message_timer: 0,
        last_player_shot_at: 0,
        last_player_hit_at: 0,
        player_health: 100,
        player_lives: 3,
        life_lost_timer: 0,
        frame_count: 0,

        score: 0,
        game_message: '',
        collisions: 0,
        transition_stars: null,

        entities: {
            player: null,
            missiles: {},
            enemy_missiles: {},
            enemies: {},
            powerups: {},
            floating_numbers: {},
            explosion_particles: {}
        },
        background_things: null,
        stateCanvas: null
    },
    
    pause: function () {
        this.state.paused ? this.state.paused = false : this.state.paused = true;
    },

    advance_stage() {
        const cfg = this.config;
        const sc = this.state.stateCanvas;
        const next_stage = this.state.stage + 1;

        this.state.entities.enemies = {};
        this.state.entities.enemy_missiles = {};
        this.state.entities.powerups = {};
        this.state.player_health = 100;

        if (next_stage >= cfg.stages.length) {
            // All stages complete — victory!
            this.state.transition_stars = BackgroundThings.create(280, sc, 'particle', 'star');
            this.state.phase = 'victory';
            Sound.stage_up();
            return;
        }

        this.state.stage_advance_score = Math.max(this.state.stage_advance_score, this.state.score) + cfg.stages[next_stage].points_to_advance;
        this.state.stage = next_stage;
        this.state.phase = 'stage_transition';
        this.state.stage_message_timer = 220;
        this.state.transition_stars = BackgroundThings.create(280, sc, 'particle', 'star');
        this.state.background_things = BackgroundThings.create(
            cfg.stages[next_stage].background_thing_count,
            sc,
            cfg.stages[next_stage].background_thing_type,
            cfg.stages[next_stage].background_thing_kind
        );
        Sound.stage_up();
    },

    skip_stage() {
        if (!this.state.started) return;
        if (this.state.phase === 'splash' || this.state.phase === 'gameover') return;
        this.advance_stage();
    },

    create_enemy_maybe() {
        const stage_cfg = this.config.stages[this.state.stage];
        const roll = Math.random();
        if (stage_cfg.enemy_type === 'fish') {
            if (roll < 0.012) {
                return new Enemy(this.state.stateCanvas.max_x, Math.floor(Math.random() * this.state.stateCanvas.max_y), 1 + Math.floor(Math.random() * 2), 'fish', 15, 3, 100, 0.1, false, 0.018, 8, 18);
            }
        } else if (stage_cfg.enemy_type === 'triangle') {
            if (roll < 0.006) {
                return new Enemy(this.state.stateCanvas.max_x, Math.floor(Math.random() * this.state.stateCanvas.max_y), 4 + Math.floor(Math.random() * 3), 'triangle', 14, 2, 300, 0.62, true, 0.04, 22, 40);
            }
        } else {
            if (roll < 0.042) {
                return new Enemy(this.state.stateCanvas.max_x, Math.floor(Math.random() * this.state.stateCanvas.max_y), 2 + Math.floor(Math.random() * 3), 'miaow', 5, 1, 80, 0.06, false, 0.01, 8, 14);
            }
        }
        return false;
    },

    create_powerup_maybe() {
        return Math.random() < 0.002;
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

    hex_to_rgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
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
        this._y -= Game.config.floating_number_speed;
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
    constructor(start_x, start_y, speed, type, points_kill, points_damage, max_health, tracking_chance, show_health_bar, fire_rate, missile_damage, collision_damage) {
        this._x = start_x;
        this._y = start_y;
        this.speed = speed;
        this.type = type || 'miaow';
        this.points_kill = points_kill || 5;
        this.points_damage = points_damage || 1;
        this.width = 20;
        this.height = 20;
        this.id = Date.now() + Math.floor(Math.random() * 1000);
        this.max_health = max_health || 100;
        this.health = this.max_health;
        this.tracking_chance = tracking_chance || 0.1;
        this.show_health_bar = !!show_health_bar;
        this.fire_rate = fire_rate || 0.02;
        this.missile_damage = missile_damage || 10;
        this.collision_damage = collision_damage || 25;
        this.lastmove = 0;
        this.direction = 0;
    }

    pos_x() {
        return this._x;
    }

    pos_y() {
        return this._y;
    }

    move(player_y) {
        this._x -= this.speed;

        if (typeof player_y === 'number' && Math.random() < this.tracking_chance) {
            const delta = player_y - this._y;
            const step = Math.sign(delta) * Math.min(3, Math.abs(delta));
            this._y += step;
            this.lastmove = step;
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
            this._y += this.lastmove;
        } else if (decision < 0.05) {
            this._y += this.direction * 3;
            this.lastmove = this.direction * 3;
        } else {
            this._y += this.direction;
            this._y += this.lastmove;
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
        if (Math.random() < this.fire_rate) {
            return new Missile(this._x + this.width, this._y + this.height / 2, -16, this.missile_damage);
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
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
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
  SHOOT:32, //space
    PAUSE:80, //p
    SKIP_STAGE:75, //k
  
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

    if (!ev.repeat) {
        if (ev.which === Key.PAUSE && Game.state.phase === 'playing') {
            Game.pause();
        }
        if (ev.which === Key.SKIP_STAGE) {
            Game.skip_stage();
        }
    }

    if (Game.state.phase === 'splash' || Game.state.phase === 'gameover' || Game.state.phase === 'victory') {
        Game.begin_game();
    }
});


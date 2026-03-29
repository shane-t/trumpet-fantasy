window.GameScreens = window.GameScreens || {};

window.GameScreens.renderStageSelect = function (state) {
    this.ensureStageSelectSelection();

    const ctx = this.context;
    const sc = state.stateCanvas;
    const leftX = 42;
    const rightX = Math.floor(sc.max_x * 0.56);
    const options = this.getMenuOptions();
    const startY = 160;
    const stepY = 28;
    const spriteX = rightX + 10;
    const labelX = rightX + 30;

    ctx.fillStyle = '#000010';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (state.backgroundThings) {
        for (let i = 0; i < state.backgroundThings.length; i++) {
            const star = state.backgroundThings[i];
            ctx.fillStyle = this.config.starColoursHyperspace[star.speed];
            ctx.fillRect(star.pos_x, star.pos_y, 1, 1);
            ctx.fillRect(star.pos_x, star.pos_y, star.speed * 2, 1);
        }
    }

    ctx.textAlign = 'left';
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('THE ULTIMATE COMMENT', leftX, 74);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffff00';
    ctx.fillText('STAGE SELECT', leftX, 106);

    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('MENU: W/S or UP/DOWN', leftX, 150);
    ctx.fillText('SELECT: SPACE or ENTER', leftX, 172);
    ctx.fillText('IN-GAME MOVE: WASD or ARROWS', leftX, 194);
    ctx.fillText('IN-GAME SHOOT: SPACE', leftX, 216);
    ctx.fillText('CURRENT SCORE: ' + state.score, leftX, 238);

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#99aabb';
    ctx.fillText('Complete a stage to reveal', leftX, 274);
    ctx.fillText('its secret in the list.', leftX, 292);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#ffffaa';
    ctx.fillText('STAGES / SECRETS', rightX, 130);

    for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        const isSelected = i === state.selectedMenuIndex;
        if (opt.locked) {
            ctx.fillStyle = '#88aacc';
        } else if (isSelected) {
            ctx.fillStyle = '#aaff66';
        } else {
            ctx.fillStyle = '#ffffff';
        }

        ctx.font = isSelected ? 'bold 18px monospace' : 'bold 16px monospace';

        if (opt.type === 'stage') {
            const stage_for_opt = this.config.stages[opt.stageIndex];
            let menu_sprite = this.render_cache.enemy_img;
            if (stage_for_opt && stage_for_opt.enemyType === 'fish') {
                menu_sprite = this.render_cache.fish_img;
            } else if (stage_for_opt && stage_for_opt.enemyType === 'triangle') {
                menu_sprite = this.render_cache.triangle_img;
            } else if (stage_for_opt && stage_for_opt.enemyType === 'spoon') {
                menu_sprite = this.render_cache.spoon_img;
            }
            const spin_size = isSelected ? 18 : 16;
            const spin_angle = (state.frameCount * 0.08) + i * 0.5;
            const spin_y = startY + i * stepY - 8;
            ctx.save();
            ctx.translate(spriteX, spin_y);
            ctx.rotate(spin_angle);
            ctx.drawImage(menu_sprite, -spin_size / 2, -spin_size / 2, spin_size, spin_size);
            ctx.restore();
        }

        ctx.fillText(opt.label, labelX, startY + i * stepY);
    }

    ctx.textAlign = 'left';
};

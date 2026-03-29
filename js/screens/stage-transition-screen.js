window.GameScreens = window.GameScreens || {};

window.GameScreens.renderStageTransition = function (state) {
    const ctx = this.context;
    const sc = state.stateCanvas;
    const config = this.config;
    const stage_cfg = config.stages[state.stage] || config.stages[config.stages.length - 1];
    const player = state.entities.player;

    ctx.fillStyle = '#000005';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (state.transitionStars) {
        for (let i = 0; i < state.transitionStars.length; i++) {
            const ts = state.transitionStars[i];
            ctx.fillStyle = config.starColoursHyperspace[ts.speed];
            ctx.fillRect(ts.pos_x, ts.pos_y, 1, 1);
            const tsRgb = this.hexToRgb(config.starColoursHyperspace[ts.speed]);
            if (tsRgb) {
                ctx.fillStyle = 'rgb(' + Math.max(0, tsRgb.r - 30) + ',' + Math.max(0, tsRgb.g - 30) + ',' + Math.max(0, tsRgb.b - 30) + ')';
            }
            ctx.fillRect(ts.pos_x, ts.pos_y, ts.speed * 3, 1);
        }
    }

    if (player) {
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = config.playertrailColoursHyperspace[Math.floor(Math.random() * 4)];
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
};

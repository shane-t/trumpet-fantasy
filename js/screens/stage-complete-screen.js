window.GameScreens = window.GameScreens || {};

window.GameScreens.renderStageComplete = function (state) {
    const ctx = this.context;
    const sc = state.stateCanvas;
    const config = this.config;

    ctx.fillStyle = '#000005';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (state.transitionStars) {
        for (let i = 0; i < state.transitionStars.length; i++) {
            const rs = state.transitionStars[i];
            ctx.fillStyle = config.starColoursHyperspace[rs.speed];
            ctx.fillRect(rs.pos_x, rs.pos_y, 1, 1);
            ctx.fillRect(rs.pos_x, rs.pos_y, rs.speed * 3, 1);
        }
    }

    ctx.textAlign = 'center';
    ctx.font = 'bold 34px monospace';
    ctx.fillStyle = '#ffff00';
    ctx.fillText('SECRET REVEALED', sc.max_x / 2, sc.max_y / 2 - 60);
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(state.lastRevealedStageName, sc.max_x / 2, sc.max_y / 2 - 22);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#aaffaa';
    ctx.fillText(state.lastRevealedSecret, sc.max_x / 2, sc.max_y / 2 + 18);
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#ffffaa';
    ctx.fillText('Returning to stage select...', sc.max_x / 2, sc.max_y / 2 + 62);
    ctx.textAlign = 'left';
};

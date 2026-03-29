window.GameScreens = window.GameScreens || {};

window.GameScreens.renderVictory = function (state) {
    const ctx = this.context;
    const sc = state.stateCanvas;
    const config = this.config;

    ctx.fillStyle = '#000005';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (state.transitionStars) {
        for (let i = 0; i < state.transitionStars.length; i++) {
            const vt = state.transitionStars[i];
            ctx.fillStyle = config.starColoursHyperspace[vt.speed];
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
};

window.GameScreens = window.GameScreens || {};

window.GameScreens.renderGameOver = function (state) {
    const ctx = this.context;
    const sc = state.stateCanvas;

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
};

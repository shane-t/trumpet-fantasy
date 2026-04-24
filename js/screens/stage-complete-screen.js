window.GameScreens = window.GameScreens || {};

window.GameScreens.renderStageComplete = function (state) {
    const ctx = this.context;
    const sc = state.stateCanvas;
    const config = this.config;

    ctx.fillStyle = '#000005';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (state.entities && state.entities.stageEndExplosionParticles) {
        for (const particleId in state.entities.stageEndExplosionParticles) {
            const p = state.entities.stageEndExplosionParticles[particleId];
            if (!p) continue;
            if (p.life > 120) {
                ctx.fillStyle = '#ffffff';
            } else if (p.life > 80) {
                ctx.fillStyle = '#ffee88';
            } else if (p.life > 40) {
                ctx.fillStyle = '#ff8833';
            } else {
                ctx.fillStyle = '#cc2200';
            }
            ctx.fillRect(p.pos_x(), p.pos_y(), p.width, p.height);
        }
    }

    if (state.transitionStars) {
        for (let i = 0; i < state.transitionStars.length; i++) {
            const rs = state.transitionStars[i];
            ctx.fillStyle = config.starColoursHyperspace[rs.speed];
            ctx.fillRect(rs.pos_x, rs.pos_y, 1, 1);
            ctx.fillRect(rs.pos_x, rs.pos_y, rs.speed * 3, 1);
        }
    }

    if (state.stageCompleteTimer < 140) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 24px monospace';
        ctx.fillStyle = '#ffaa00';
        ctx.fillText('TARGET SCORE REACHED!', sc.max_x / 2, sc.max_y / 2 - 90);
        
        ctx.font = 'bold 34px monospace';
        ctx.fillStyle = '#ffff00';
        ctx.fillText('SECRET REVEALED', sc.max_x / 2, sc.max_y / 2 - 50);
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(state.lastRevealedStageName, sc.max_x / 2, sc.max_y / 2 - 12);
        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = '#aaffaa';
        ctx.fillText(state.lastRevealedSecret, sc.max_x / 2, sc.max_y / 2 + 28);
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#ffffaa';
        ctx.fillText('Returning to stage select...', sc.max_x / 2, sc.max_y / 2 + 72);
        ctx.textAlign = 'left';
    }
};

(() => {
    const legacyRender = Game.render;

    Game.render = function (state) {
        if (!window.GameScreens) {
            return legacyRender.call(this, state);
        }

        if (state.phase === 'stage_select' && window.GameScreens.renderStageSelect) {
            return window.GameScreens.renderStageSelect.call(this, state);
        }

        if (state.phase === 'stage_transition' && window.GameScreens.renderStageTransition) {
            return window.GameScreens.renderStageTransition.call(this, state);
        }

        if (state.phase === 'stage_complete' && window.GameScreens.renderStageComplete) {
            return window.GameScreens.renderStageComplete.call(this, state);
        }

        if (state.phase === 'victory' && window.GameScreens.renderVictory) {
            return window.GameScreens.renderVictory.call(this, state);
        }

        if (state.phase === 'gameover' && window.GameScreens.renderGameOver) {
            return window.GameScreens.renderGameOver.call(this, state);
        }

        if (window.GameRenderingModules && window.GameRenderingModules.renderGameplay) {
            return window.GameRenderingModules.renderGameplay.call(this, state);
        }

        return legacyRender.call(this, state);
    };
})();

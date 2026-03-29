(() => {
    const applyRegisteredStages = () => {
        if (window.GameStageRegistry && window.GameStageRegistry.length) {
            Game.config.stages = window.GameStageRegistry.slice();
        }
    };

    const legacyStart = Game.start;
    const legacyBeginGame = Game.beginGame;

    if (window.GameEngineModules && window.GameEngineModules.think) {
        Game.think = window.GameEngineModules.think;
    }

    Game.start = function () {
        applyRegisteredStages();
        return legacyStart.call(this);
    };

    Game.beginGame = function () {
        applyRegisteredStages();
        return legacyBeginGame.call(this);
    };

    Game.begin_game = function () {
        return Game.beginGame();
    };
})();

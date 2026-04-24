document.addEventListener('DOMContentLoaded', () => {
    const bindButton = (btnId, keyCode) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        
        let isDown = false;
        
        const triggerDown = (e) => {
            if (e) e.preventDefault();
            if (isDown) return;
            isDown = true;
            
            Key.onKeydown({ which: keyCode });
            if (typeof Sound !== 'undefined' && Sound.init) {
                Sound.init();
            }
            
            if (typeof Game !== 'undefined') {
                if (Game.state.phase === 'stage_select') {
                    if (keyCode === Key.UP || keyCode === Key.ARROW_UP) Game.moveStageSelect(-1);
                    if (keyCode === Key.DOWN || keyCode === Key.ARROW_DOWN) Game.moveStageSelect(1);
                    if (keyCode === Key.SHOOT || keyCode === 13) Game.startSelectedStage();
                }
                if (keyCode === Key.PAUSE && Game.state.phase === 'playing') Game.pause();
                if (keyCode === Key.RAINBOW && Game.state.phase === 'playing') Game.activateRainbowBlast();
            }
        };
        
        const triggerUp = (e) => {
            if (e) e.preventDefault();
            if (!isDown) return;
            isDown = false;
            Key.onKeyup({ which: keyCode });
        };
        
        btn.addEventListener('touchstart', triggerDown, { passive: false });
        btn.addEventListener('touchend', triggerUp, { passive: false });
        btn.addEventListener('touchcancel', triggerUp, { passive: false });
        btn.addEventListener('mousedown', triggerDown, { passive: false });
        btn.addEventListener('mouseup', triggerUp, { passive: false });
        btn.addEventListener('mouseleave', triggerUp, { passive: false });
    };

    bindButton('btn-up', Key.UP);
    bindButton('btn-down', Key.DOWN);
    bindButton('btn-left', Key.LEFT);
    bindButton('btn-right', Key.RIGHT);
    bindButton('btn-shoot', Key.SHOOT);
    bindButton('btn-rainbow', Key.RAINBOW);
});

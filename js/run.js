(() => {
    const onEachFrame = window.requestAnimationFrame
        ? (cb) => {
              const loop = () => {
                  cb();
                  window.requestAnimationFrame(loop);
              };
              window.requestAnimationFrame(loop);
          }
        : (cb) => {
              window.setInterval(cb, 1000 / 60);
          };

    document.addEventListener('DOMContentLoaded', () => {
        onEachFrame(() => {
            Game.run();
        });
    });
})();

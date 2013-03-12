$(function () {
    var onEachFrame;
    if (window.webkitRequestAnimationFrame) {
        onEachFrame = function(cb) {
        var _cb = function() { cb(); webkitRequestAnimationFrame(_cb); }
             _cb();
        };
    } else if (window.mozRequestAnimationFrame) {
        onEachFrame = function(cb) {
            var _cb = function() { cb(); mozRequestAnimationFrame(_cb); }
            _cb();
        };
    } else {
        onEachFrame = function(cb) {
            setInterval(cb, 1000 / 60);
        }
    }
  
    window.onEachFrame = onEachFrame;
    window.onEachFrame(function () {
        Game.run();
    });

});

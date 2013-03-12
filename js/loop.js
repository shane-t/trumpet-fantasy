'use strict';

if (!Function.prototype.bind) {
    Function.prototype.bind = function (obj /*, arg1, arg2, ... */)  {  
        var func = this,
            _slice = Array.prototype.slice,
            _concat = Array.prototype.concat,
            _args = _slice.call(arguments, 1);

        return function () {
            return func.apply(obj ? obj : this,
                              _concat.call(_args,
                                           _slice.call(arguments, 0)));
        };
    };
}

var Game = {

    canvas: null,
    context: null,

    run: function () {
        var that = this;
        if (!this.state.started) {
            this.start();
        }
        if (!this.state.paused) {
            this.think(function () {
                that.render(that.state);
            });
        }
    },

    start : function () {
        this.canvas = document.getElementById('space')
        this.context = this.canvas.getContext('2d');
        this.state.started = true;
        this.state.stateCanvas = new StateCanvas(this.canvas);
        this.state.entities.player = new Player(this.state.stateCanvas);
        this.state.stars = new Stars(250, this.state.stateCanvas);
        this.fill_render_cache();
    },

    render: function (state) {
        var stars = state.stars,
            config = this.config,
            star_colours = state.hyperspace ? config.star_colours_hyperspace : config.star_colours,
            ctx = this.context,
            sc = state.stateCanvas,
            i = 0,
            j = 0,
            player = state.entities.player,
            rgb,                                                   // holds an object from hex_to_rgb
            trail = this.config.startrail_length,
            trail_multiplier = (state.hyperspace ? 3 : 1),         // if we are moving starfield is elongated
            trail_length,                                          // holds trail length for calculation
            missile_star,                                          // missile is ✦ shaped, array of x,y for it
            explosion_particle,
            missile,                                               
            enemy,
            floating_number;


        ctx.fillStyle = config.space_colour;;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
       //this.canvas.width = this.canvas.width; //can be faster but then no colour

        for (i=0; i<stars.length; i++) { 
            ctx.fillStyle = star_colours[stars[i].speed];
            ctx.fillRect(stars[i].pos_x, stars[i].pos_y, 1, 1);
            //now get a darker version of the same colour for star trail
            rgb = this.hex_to_rgb(star_colours[stars[i].speed]);
            ctx.fillStyle = "rgb(" + (rgb.r-30) + "," + (rgb.g-30) + "," + (rgb.b-30) + ")";
            trail_length = stars[i].speed*trail_multiplier;
            //console.log("star speed" + stars[i].speed + ", trail_len" + trail_length);
            ctx.fillRect(stars[i].pos_x, stars[i].pos_y, trail_length, 1);
        }

        ctx.drawImage(this.render_cache.player_img, player.pos_x(), player.pos_y());

        for (var i in state.entities.missiles) {
            ctx.fillStyle = this.config.playertrail_colours_hyperspace[Math.floor(Math.random() * 4)];
            missile_star = [ 
                    [state.entities.missiles[i].pos_x()+1, state.entities.missiles[i].pos_y()+1],
                    [state.entities.missiles[i].pos_x()+1, state.entities.missiles[i].pos_y()-1],
                    [state.entities.missiles[i].pos_x(), state.entities.missiles[i].pos_y()],
                    [state.entities.missiles[i].pos_x()+2, state.entities.missiles[i].pos_y()],
            ];
            for (j=0; j < missile_star.length; j++) {
                
                ctx.fillRect(missile_star[j][0], missile_star[j][1], 1, 1);
            }
        }

        for (i in state.entities.enemies) {
            enemy = state.entities.enemies[i];
            ctx.drawImage(this.render_cache.enemy_img, enemy.pos_x(), enemy.pos_y());
        }
        for (i in state.entities.enemy_missiles) {
            missile = state.entities.enemy_missiles[i];
            ctx.fillStyle = this.config.playertrail_colours_hyperspace[Math.floor(Math.random() * 4)]
            ctx.fillRect(missile.pos_x(), missile.pos_y(), missile.width, missile.height);
        }

        //we in hyperspace? draw trail for player
        if (state.hyperspace) {
            for (i=0;i<3;i++) {
                ctx.fillStyle = this.config.playertrail_colours_hyperspace[Math.floor(Math.random() * 4)];
                ctx.fillRect(0, player.pos_y()+11+i, player.pos_x(), 1);
            }
        }

        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = this.config.score_colour;

        for (i in state.entities.floating_numbers) {
            floating_number = state.entities.floating_numbers[i];
            ctx.fillText(floating_number.number + "", floating_number.pos_x(), floating_number.pos_y());
        }

        for (i in state.entities.explosion_particles) {
            explosion_particle = state.entities.explosion_particles[i];
            ctx.fillStyle = this.config.playertrail_colours_hyperspace[Math.floor(Math.random() * 4)];
            ctx.fillRect(explosion_particle.pos_x(), explosion_particle.pos_y(), explosion_particle.width, explosion_particle.height);
        }

        ctx.fillStyle = this.config.score_colour;

        ctx.fillText("Score:" + this.state.score, sc.score_x, sc.score_y);
        
        if (this.state.collisions) {
            ctx.fillStyle = config.collision_colour;
            ctx.opacity = 0.1;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        }

    },

    think: function (cb) {

        var stars = this.state.stars,
            missiles = this.state.entities.missiles,
            enemy_missiles = this.state.entities.enemy_missiles,
            floating_numbers = this.state.entities.floating_numbers,
            explosion_particles = this.state.entities.explosion_particles,
            player = this.state.entities.player,
            sc = this.state.stateCanvas,
            cfg = this.config,
            speed_multiplier = this.state.hyperspace ? 3 : 1,
            launch_time,
            enemies = this.state.entities.enemies,
            new_enemy,
            new_missile,
            new_number,
            new_explosion_particles,
            i, j, k, that= this;

        this.state.collisions = 0;
        
        if (Key.isDown(Key.UP))   player.move_y(-2);
        if (Key.isDown(Key.DOWN)) player.move_y(2);
        if (Key.isDown(Key.LEFT)) player.move_x(-4);
        
        if (Key.isDown(Key.RIGHT)) {
            player.move_x(2);
            this.state.hyperspace = true;
        } else {
            this.state.hyperspace = false;
        }

        launch_time = Key.isDown(Key.SHOOT);  //add random number to stop "sticky" missiles

        if (launch_time) {
            missiles[new Date().getTime()] = player.fire();
        }

        new_enemy = this.create_enemy_maybe();

        if (new_enemy) {
            enemies[new_enemy.id] = new_enemy;
        }

        for (i=0; i<stars.length; i++) {
            stars[i].pos_x -= cfg.star_speeds[stars[i].speed]* speed_multiplier;

            if (stars[i].pos_x <= 0) {  
              stars[i].pos_x = sc.max_x;   
              stars[i].pos_y = Math.floor(Math.random()*sc.max_y); 
            }
        }

        for (i in missiles) {
            if (missiles[i].move() >= sc.max_x) {
                delete missiles[i];
            }
        }

        for (i in floating_numbers) {
            if (floating_numbers[i].move() <= 0) {
                delete floating_numbers[i];
            }
        }

        for (i in enemy_missiles) {
            if (this.collide(enemy_missiles[i], player)) {
                delete enemy_missiles[i];
                this.state.collisions++;
            } else if (enemy_missiles[i].move() <= 0) {
                delete enemy_missiles[i];
            }
        }

        for (i in explosion_particles) {
            if (this.out_of_bounds(explosion_particles[i].move())) {
                delete explosion_particles[i];
            }
        }

        for (i in enemies) {
            if (enemies[i].move() <= 0) {
                delete enemies[i];
            } else if (this.collide(player, enemies[i])) {
                console.log("POW!");
                delete enemies[i];
                this.state.score--;
                this.state.collisions++;
            } else {
                new_missile = enemies[i].fire();
                if (new_missile) {
                    enemy_missiles[new_missile.id] = new_missile;
                }
                for (j in missiles) {
                    if (!enemies[i]) continue;
                    if (this.collide(missiles[j], enemies[i])) {
                        delete missiles[j];
                        enemies[i].damage(20, 
                            function () {   //callback if enemy health drops below 0
                                that.state.score += 5;
                                new_number = new FloatingNumber(enemies[i].pos_x(), enemies[i].pos_y(), 1, 5);
                                that.state.entities.floating_numbers[new_number.id] = new_number;
                                new_explosion_particles = new Explosion(enemies[i].pos_x(),enemies[i].pos_y(),5,25);
                                for (k in new_explosion_particles) {
                                    that.state.entities.explosion_particles[k] = new_explosion_particles[k];
                                }
                                delete enemies[i];
                            },
                            function () {    //callback if enemy is damaged
                                that.state.score += 1;
                                new_number = new FloatingNumber(enemies[i].pos_x(), enemies[i].pos_y(), 1, 1);
                                that.state.entities.floating_numbers[new_number.id] = new_number;
                            }
                        );
                    }
                }
            }
        }

        cb();
    },

    eq: [],

    config: {
        space_colour: '#000060',
        star_speeds: [0.5, 1, 2, 4],
        collision_colour: '#ffffff',
        star_colours : ['#777777', '#999999', '#cccccc', '#ffffff'],
        star_colours_hyperspace : ['#000077', '#37FDFC', '#ffffff', '#ffffff'],
        startrail_length: 5,
        playertrail_colours_hyperspace : ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
        floating_number_speed: 1,
        bill_src : 'img/trumpet.png',
        miaow_src : 'img/miaow.png',
        score_colour: '#ffffff'
    },

    render_cache: {
      player_img: null,
      enemy_img: null,
    },

    fill_render_cache: function () {

        this.render_cache.player_img = new Image();
        this.render_cache.player_img.src = this.config.bill_src;
        this.render_cache.enemy_img = new Image();
        this.render_cache.enemy_img.src = this.config.miaow_src;
    },

    state: {
        started: false,
        paused: false,
        hyperspace: false,

        score: 0,
        game_message: "", //TODO display on screen
        collisions : 0,

        entities: {
            player: null,
            stars: null,
            missiles: {},
            enemy_missiles: {},
            enemies: {},
            floating_numbers: {},
            explosion_particles: {}
        },
        stateCanvas: null
    },
    
    pause: function () {
        this.state.paused ? this.state.paused = false : this.state.paused = true;
    },

    create_enemy_maybe: function () {
        if (Math.random() < 0.05) {
            return new Enemy(this.state.stateCanvas.max_x, Math.floor(Math.random()*this.state.stateCanvas.max_y), Math.floor(Math.random()*5));
        } else {
            return false;
        }
    },

    collide: function (a, b) {
        return !(
            a.pos_y() + a.height  < b.pos_y() ||
            a.pos_y() > b.pos_y() + b.height  ||
            a.pos_x() + a.width   < b.pos_x() ||
            a.pos_x() > b.pos_x() + b.width
        );
    },

    out_of_bounds: function (entity) {

        if (typeof entity.pos_y == "function" && typeof entity.pos_x == "function") {
            return (
                entity.pos_y() - entity.height <= 0                             ||
                entity.pos_y() + entity.height >= this.state.stateCanvas.max_y  ||
                entity.pos_x() - entity.width  <= 0                             ||
                entity.pos_x() + entity.width  >= this.state.stateCanvas.max_x
            );
        } else {
            return (
                entity.pos_y - entity.height <= 0                             ||
                entity.pos_y + entity.height >= this.state.stateCanvas.max_y  ||
                entity.pos_x - entity.width  <= 0                             ||
                entity.pos_x + entity.width  >= this.state.stateCanvas.max_x
            );
        }
    },

    hex_to_rgb: function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}

function StateCanvas (canvas) {
    var max_y = canvas.height,
        max_x = canvas.width;

    return {
        max_y: max_y,
        max_x: max_x,
        score_x: max_x - 60,
        score_y: max_y - 20
    }
}

function Stars (max, stateCanvas) {
    var max_stars,
        speeds,
        stars = [];

    max_stars = max ? max : 250;
    

    while (max_stars --> 0) {
        stars.push({
            pos_x: Math.floor(Math.random()*stateCanvas.max_x),
            pos_y: Math.floor(Math.random()*stateCanvas.max_y),
            speed: Math.floor(Math.random()*4)
        });
    }

    return stars;

}

function FloatingNumber(start_x, start_y, speed, number) {
    var pos_x = start_x, 
        pos_y = start_y,
        width = 10,
        height = 10,
        id = new Date().getTime(),
        number = number;
    
    return {
        id: id,
        width: width,
        height: height,
        number: number,
        pos_x: function () {
            return pos_x;
        },
        pos_y: function () {
            return pos_y;
        },
        move: function () {
            pos_y -= Game.config.floating_number_speed;         //numbers float up
            return pos_y;
        }
    }
}

function Explosion (start_x, start_y, speed, number) {

    var particles = {},
        new_particle;

    while (number--) {
        new_particle = new ExplosionParticle(start_x, start_y, speed, Math.random()*Math.PI*2);
        particles[new Date().getTime()+number] = new_particle;
    }

    return particles;
}

function ExplosionParticle (start_x, start_y, speed, angle) {
    var pos_x = start_x,
        pos_y = start_y,
        width = 1,
        height = 1;
    
    return {
        width: width,
        height: height,
        pos_x: function () {
            return Math.floor(pos_x);
        },
        pos_y: function () {
            return Math.floor(pos_y);
        },
        move: function () {
            pos_x += speed * Math.cos(angle);
            pos_y += speed * Math.sin(angle);
            return {
                width: width,
                height: height,
                pos_x: Math.floor(pos_x),
                pos_y: Math.floor(pos_y)
            }   
        }
    }
}

function Enemy(start_x, start_y, speed) {
    var pos_x = start_x,
        pos_y = start_y,
        width = 20,
        height= 20,
        id = new Date().getTime(),
        health = 100,
        lastmove = 0, //0: no move, 1: up, -1: down
        direction = 0,
        decision;

    return {
        id : id,
        width: width,
        height: height,

        pos_x: function () {
            return pos_x;
        },
        pos_y: function () {
            return pos_y;
        },
        move: function () {
            pos_x -= speed;                 //enemies go R->L
                                            //but also drift up and down a bit

            //decide whether we want to go up or down

            decision = Math.random();

            if (decision < 0.33) {
                direction = -1;
            } else if (decision > 0.33 && decision < 0.66) {
                direction = 0;
            } else {
                direction = 1;
            }

            // now check whether or not we are actually allowed to deviate from our current course

            decision = Math.random();

            if (decision > 0.1) {
                pos_y += lastmove;
            } else if (decision < 0.05) {
                pos_y += direction*3;
                lastmove = direction*3;
            } else {;
                pos_y += direction;
                pos_y += lastmove;
            }

            return pos_x;
        },
        damage: function (dmg, death_cb, injured_cb) {
            health -= dmg;
            if (health <= 0) {
                death_cb();
            } else {
                injured_cb();
            }
        },
        fire: function () {
            if (Math.random() < 0.025) {
                return new Missile(pos_x+width, pos_y+height/2, -20);       //enemy missiles go R -> L
            } else {
                return false;
            }
        }
    }
}

function Player (stateCanvas) {

    var pos_x,
        pos_y,
        height = 30,
        width = 50,
        health = 100;

    //init
    pos_x = 20;
    pos_y = stateCanvas.max_y/2;


    return {
        width: width,
        height: height,
        pos_x: function () {
            return pos_x;
        },
        pos_y: function () {
            return pos_y;
        },
        move_x: function (offset_x) {
            
            if ((pos_x + offset_x) >= stateCanvas.max_x-width) return false;
            if ((pos_x + offset_x) <= 0) return false;
            pos_x += offset_x;
        },
        move_y: function (offset_y) {
            if ((pos_y + offset_y) >= stateCanvas.max_y-height) return false;
            if ((pos_y + offset_y) <= 0) return false;
            pos_y += offset_y;
        },
        fire: function () {
            return new Missile(pos_x+width, pos_y+height/2, 10)
        },
        damage: function (dmg) {
            this.health -= dmg;
            return this.health;
        }
    }
}

function Missile(start_x, start_y, speed) {
    var pos_x = start_x,
        pos_y = start_y,
        width = 5,
        height = 5,
        id = new Date().getTime();

    return {
        id: id,
        width: width,
        height: height,
        pos_x: function () {
            return pos_x;
        },
        pos_y: function () {
            return pos_y;
        },
        move: function () {
            pos_x += speed;
            return pos_x;
        }
    }
}

//inputistas
var Key = {
  _pressed: {},

  LEFT: 65, //a
  UP: 87,   //w
  RIGHT: 68,//d
  DOWN: 83, //s
  SHOOT:32, //space
  
  isDown: function(keyCode) {
    return this._pressed[keyCode];
  },
  
  onKeydown: function(ev) {
    this._pressed[ev.which] = new Date().getTime();
  },
  
  onKeyup: function(ev) {
    delete this._pressed[ev.which];
  }
};

$(document).ready(function () {
    $(document).on('keyup', function (ev) {
        Key.onKeyup(ev);
    });
    $(document).on('keydown', function (ev) {
        Key.onKeydown(ev);
    });
});


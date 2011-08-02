(function(exports) {
/**
 * The game instance that's shared across all clients and the server
 */
var Game = function() {
  this.timeStamp = new Date();
  this.state = {};
};

Game.MAX_DELTA = 10000;

/**
 * Computes the game state
 * @param {number} delta Number of milliseconds in the future
 * @return {object} The new game state at that timestamp
 */
Game.prototype.computeState = function(delta) {
  var newState = {};
  // Generate a new state based on the old one
  for (var objId in this.state) {
    var obj = this.state[objId];
    newState[obj.id] = obj.computeState(delta);
  }
  // Go through the new state and check for collisions etc, make
  // adjustments accordingly.
  for (var i in newState) {
    var o = newState[i];
    for (var j in newState) {
      var p = newState[j];
      // Check collisions
      if (o !== p && o.intersects(p)) {
        // Transfer masses around
        this.transferMass_(o, p);
      }
    }
    // At this point, o is not collided with any objects.
    // But it may be out of bounds. Have it go back in-bound and
    // bounce off.
    if (!this.inBounds_(o)) {
      // Do some math
    }
  }
  return newState;
};

/**
 * Computes the game state for a given timestamp in the future
 * @param {number} timeStamp Timestamp to compute for
 */
Game.prototype.update = function(timeStamp) {
  var delta = timeStamp - this.timeStamp;
  if (delta < 0) {
    throw "Can't compute state in the past.";
  }
  if (delta > Game.MAX_DELTA) {
    throw "Can't compute state so far in the future.";
  }
  this.state = this.computeState(delta);
  this.timeStamp = timeStamp;
};

/**
 * Called when a new player joins
 */
Game.prototype.join = function(player) {
  this.state[player.id] = player;
};

/**
 * Called when a player leaves
 */
Game.prototype.leave = function(player) {
  delete this.state[player.id];
};

/**
 * Called when a player shoots
 */
Game.prototype.shoot = function(player, direction) {
  // Create a new blob, whose speed and size is a function of the
  // player's speed and size.
  var blob = new Blob();
  // Affect the player's velocity, depending on angle, speed and size.
  player.vx += 1;
  player.vy -= 1;
};

/***********************************************
 * Loading and saving
 */

/**
 * Save the game state.
 * @return {object} JSON of the game state
 */
Game.prototype.save = function() {
  var serialized = {};
  for (var id in this.state) {
    var obj = this.state[id];
    // Serialize to JSON!
    serialized[id] = obj.toJSON();
  }

  return serialized;
};

/**
 * Load the game state.
 * @param {object} gameState JSON of the game state
 */
Game.prototype.load = function(savedState) {
  for (var id in savedState) {
    var obj = savedState[id];
    if (obj.type == 'blob') {
      this.state[obj.id] = new Blob(obj);
    } else if (obj.type == 'player') {
      this.state[obj.id] = new Player(obj);
    }
  }
};

/***********************************************
 * Helper functions
 */

/**
 * Transfers mass between the two objects.
 */
Game.prototype.transferMass_ = function(o, p) {
  var big = o;
  var small = p;

  if (big.r < small.r) {
    big = p;
    small = o;
  }
  var overlap = big.overlap(small);
  var diff = overlap / 2;
  small.r -= diff;
  big.r += diff;

  // Check if we've killed the shrinking cell
  if (small.r <= 1) {
    small.dead = true;
    this.callback_('dead', {id: small.id});
  }
};

/**
 *
 */
Game.prototype.inBounds_ = function(o) {
  return true;
}

/**
 *
 */
Game.prototype.callback_ = function(event, data) {
  this.callbacks[event](data);
};

/**
 *
 */
Game.prototype.on = function(event, callback) {
  // Sample usage in a client:
  //
  // game.on('dead', function(data) {
  //   if (data.id == player.id) {
  //     // Darn -- player died!
  //   }
  // });
  this.callbacks[event] = callback;
};

/**
 * Instance of a blob in the world
 */
var Blob = function(params) {
  if (!params) {
    return;
  }
  this.id = params.id;
  this.x = params.x;
  this.y = params.y;
  this.r = params.r;
  this.vx = params.vx;
  this.vy = params.vy;
  this.type = params.type;
};


/**
 * Checks if the blob is touching another blob
 * @returns {number} Amount of overlap
 */
Blob.prototype.overlap = function(blob) {
  var overlap = this.r + blob.r - blob.distanceFrom(this) / (2 * blob.r);
};

Blob.prototype.intersects = function(blob) {
  return false;
};

Blob.prototype.distanceFrom = function(blob) {
  return 100;
};


/**
 * Create a new state for this blob in the future
 */
Blob.prototype.computeState = function(delta) {
  // TODO: dampen vx and vy slightly?
  return new Blob({
    id: this.id,
    x: this.x + this.vx * delta/10,
    y: this.y + this.vy * delta/10,
    r: this.r,
    vx: this.vx,
    vy: this.vy,
    type: this.type
  });
};

Blob.prototype.toJSON = function() {
  var obj = {};
  for (var prop in this) {
    if (this.hasOwnProperty(prop)) {
      obj[prop] = this[prop];
    }
  }
  return obj;
};

/**
 * Instance of a player (a kind of blob)
 */
var Player = function(params) {
  var name = params.name;

  Blob.call(this, params);
};

Player.prototype = new Blob();
Player.prototype.constructor = Player;


exports.Game = Game;
exports.Player = Player;
exports.Blob = Blob;

})(typeof global === "undefined" ? window : exports);

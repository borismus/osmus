(function(exports) {
/**
 * The game instance that's shared across all clients and the server
 */
var Game = function() {
  this.state = {};
  this.oldState = {};

  // Last used ID
  this.lastId = 0;
  this.callbacks = {};

  // Counter for the number of updates
  this.updateCount = 0;
  // Timer for the update loop.
  this.timer = null;
};

Game.UPDATE_INTERVAL = Math.round(1000 / 30);
Game.MAX_DELTA = 10000;
Game.WIDTH = 640;
Game.HEIGHT = 480;
Game.SHOT_AREA_RATIO = 0.02;
Game.SHOT_SPEED_RATIO = 1;
Game.PLAYER_SPEED_RATIO = 0.1;
Game.TRANSFER_RATE = 0.05;
Game.TARGET_LATENCY = 1000; // Maximum latency skew.
Game.RESTART_DELAY = 1000;

/**
 * Computes the game state
 * @param {number} delta Number of milliseconds in the future
 * @return {object} The new game state at that timestamp
 */
Game.prototype.computeState = function(delta) {
  var newState = {
    objects: {},
    timeStamp: this.state.timeStamp + delta
  };
  var newObjects = newState.objects;
  var objects = this.state.objects;
  // Generate a new state based on the old one
  for (var objId in objects) {
    var obj = objects[objId];
    if (!obj.dead) {
      newObjects[obj.id] = obj.computeState(delta);
    }
  }

  // Largest object.
  var largest = null;
  // Total area.
  var total = 0;

  // Go through the new state and check for collisions etc, make
  // adjustments accordingly.
  for (var i in newObjects) {
    var o = newObjects[i];
    for (var j in newObjects) {
      var p = newObjects[j];
      // Check collisions
      if (o !== p && o.intersects(p)) {
        // Transfer masses around
        this.transferAreas_(o, p, delta);
      }
    }
    // At this point, o is not collided with any objects.
    // But it may be out of bounds. Have it go back in-bound and
    // bounce off.
    if (!this.inBounds_(o)) {
      // Do some math, bounce and reposition.
      this.repositionInBounds_(o);
    }

    // Get the largest blob in the world.
    if (!largest) {
      largest = o;
    }
    if (o.r > largest.r) {
      largest = o;
    }
    total += o.r;
  }
  // Victory conditions!
  if (largest.r > total/2) {
    console.log('game over!');
    this.callback_('victory', {id: largest.id});
  }
  return newState;
};

/**
 * Computes the game state for a given timestamp in the future
 * @param {number} timeStamp Timestamp to compute for
 */
Game.prototype.update = function(timeStamp) {
  var delta = timeStamp - this.state.timeStamp;
  if (delta < 0) {
    throw "Can't compute state in the past. Delta: " + delta;
  }
  if (delta > Game.MAX_DELTA) {
    throw "Can't compute state so far in the future. Delta: " + delta;
  }
  this.state = this.computeState(delta);
  this.updateCount++;
};

/**
 * Set up an accurate timer in JS
 */
Game.prototype.updateEvery = function(interval, skew) {
  if (!skew) {
    skew = 0;
  }
  var lastUpdate = (new Date()).valueOf() - skew;
  var ctx = this;
  this.timer = setInterval(function() {
    var date = (new Date()).valueOf() - skew;
    if (date - lastUpdate >= interval) {
      ctx.update(date);
      lastUpdate += interval;
    }
  }, 1);
};

Game.prototype.over = function() {
  clearInterval(this.timer);
};

/**
 * Called when a new player joins
 */
Game.prototype.join = function(id) {
  var x, y, vx, vy;
  switch (this.getPlayerCount() % 4) {
    case 0:
      x = 0; y = 0; vx = 0.1; vy = 0.1;
      break;
    case 1:
      x = 640; y = 0; vx = -0.1; vy = 0.1;
      break;
    case 2:
      x = 0; y = 480; vx = 0.1; vy = -0.1;
      break;
    case 3:
      x = 640; y = 480; vx = -0.1; vy = -0.1;
      break;
  }
  // Add the player to the world
  var player = new Player({
    id: id,
    x: x,
    y: y,
    vx: vx,
    vy: vy,
    r: 20
  });
  this.state.objects[player.id] = player;
  return player.id;
};

/**
 * Called when a player leaves
 */
Game.prototype.leave = function(playerId) {
  delete this.state.objects[playerId];
};

/**
 * Called when a player shoots
 * @param {object} info {id, direction, timeStamp}
 */
Game.prototype.shoot = function(id, direction, timeStamp) {
  console.log('adding shot from', this.state.timeStamp - timeStamp, 'ago');
  var player = this.state.objects[id];
  // Unit vectors.
  var ex = Math.cos(direction);
  var ey = Math.sin(direction);
  // See how much area we will need to transfer.
  var diff = player.area() * Game.SHOT_AREA_RATIO;
  // Create the new blob.
  var blob = new Blob({
    id: this.newId_(),
    vx: player.vx + ex * Game.SHOT_SPEED_RATIO,
    vy: player.vy + ey * Game.SHOT_SPEED_RATIO,
    r: 0
  });
  this.state.objects[blob.id] = blob;
  // New blob should be positioned so that it doesn't overlap parent.
  blob.x = player.x + (player.r + blob.r) * ex;
  blob.y = player.y + (player.r + blob.r) * ey;
  // Affect the player's velocity, depending on angle, speed and size.
  player.vx -= ex * Game.PLAYER_SPEED_RATIO;
  player.vy -= ey * Game.PLAYER_SPEED_RATIO;
  // Affect blob and player radius.
  blob.transferArea(diff);
  player.transferArea(-diff);
  // Check if we've suicided
  if (player.r <= 2) {
    player.dead = true;
    this.callback_('dead', {id: player.id, type: player.type});
  }
};

Game.prototype.getPlayerCount = function() {
  var count = 0;
  var objects = this.state.objects;
  for (var id in objects) {
    if (objects[id].type == 'player') {
      count++;
    }
  }
  return count;
};

/***********************************************
 * Loading and saving
 */

/**
 * Save the game state.
 * @return {object} JSON of the game state
 */
Game.prototype.save = function() {
  var serialized = {
    objects: {},
    timeStamp: this.state.timeStamp
  };
  for (var id in this.state.objects) {
    var obj = this.state.objects[id];
    // Serialize to JSON!
    serialized.objects[id] = obj.toJSON();
  }

  return serialized;
};

/**
 * Load the game state.
 * @param {object} gameState JSON of the game state
 */
Game.prototype.load = function(savedState) {
  //console.log(savedState.objects);
  var objects = savedState.objects;
  this.state = {
    objects: {},
    timeStamp: savedState.timeStamp.valueOf()
  }
  for (var id in objects) {
    var obj = objects[id];
    // Depending on type, instantiate.
    if (obj.type == 'blob') {
      this.state.objects[obj.id] = new Blob(obj);
    } else if (obj.type == 'player') {
      this.state.objects[obj.id] = new Player(obj);
    }
    // Increment this.lastId
    if (obj.id > this.lastId) {
      this.lastId = obj.id;
    }
  }
};

Game.prototype.blobExists = function(blobId) {
  return this.state.objects[blobId] !== undefined;
};

/***********************************************
 * Helper functions
 */

/**
 * Transfers mass between two objects.
 */
Game.prototype.transferAreas_ = function(o, p, delta) {
  //console.log('deadness', o.id, o.dead, p.id, p.dead);
  if (o.dead || p.dead) {
    return;
  }

  var big = o;
  var small = p;

  if (big.r < small.r) {
    big = p;
    small = o;
  }
  var overlap = big.overlap(small);

  //console.log('overlapping', o.id, p.id, 'by', overlap);
  var diff = overlap * Game.TRANSFER_RATE;
  small.transferArea(-diff);
  big.transferArea(diff);

  // Check if we've killed the shrinking cell
  if (small.r <= 1) {
    small.dead = true;
    this.callback_('dead', {id: small.id, type: small.type});
  }

  //console.log('sanity check: total area', small.r + big.r);
};

/**
 *
 */
Game.prototype.inBounds_ = function(o) {
  // For now, use a rectangular field.
  return o.r < o.x && o.x < (Game.WIDTH - o.r) &&
         o.r < o.y && o.y < (Game.HEIGHT - o.r);
};

/**
 *
 */
Game.prototype.repositionInBounds_ = function(o) {
  var maxWidth = Game.WIDTH - o.r;
  var maxHeight = Game.HEIGHT - o.r;
  if (o.x < o.r) {
    o.x = o.r;
    o.vx = -o.vx;
  } else if (o.y < o.r) {
    o.y = o.r;
    o.vy = -o.vy;
  } else if (o.x > maxWidth) {
    o.x = maxWidth;
    o.vx = -o.vx;
  } else if (o.y > maxHeight) {
    o.y = maxHeight;
    o.vy = -o.vy;
  }
};

/**
 *
 */
Game.prototype.callback_ = function(event, data) {
  var callback = this.callbacks[event];
  if (callback) {
    callback(data);
  } else {
    throw "Warning: No callback defined!";
  }
};

/**
 * Deterministically generate new ID for an object
 */
Game.prototype.newId_ = function() {
  return ++this.lastId;
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
  if (!this.type) {
    this.type = 'blob';
  }
};


/**
 * Gives the amount of overlap between blobs (assuming blob and this are
 * overlapping, and that blob < this.
 * @returns {number} Amount of overlap
 */
Blob.prototype.overlap = function(blob) {
  var overlap = blob.r + this.r - this.distanceFrom(blob);
  return (overlap > 0 ? overlap : 0);
};

Blob.prototype.intersects = function(blob) {
  return this.distanceFrom(blob) < blob.r + this.r;
};

Blob.prototype.distanceFrom = function(blob) {
  return Math.sqrt(Math.pow(this.x - blob.x, 2) + Math.pow(this.y - blob.y, 2));
};

Blob.prototype.area = function() {
  return Math.PI * this.r * this.r;
};

/**
 * Transfers some area to (or from if area < 0) this blob.
 */
Blob.prototype.transferArea = function(area) {
  var sign = 1;
  if (area < 0) {
    sign = -1;
  }
  this.r += sign * Math.sqrt(Math.abs(area) / Math.PI);
};

/**
 * Create a new state for this blob in the future
 */
Blob.prototype.computeState = function(delta) {
  // TODO: dampen vx and vy slightly?
  var newBlob = new this.constructor(this.toJSON());
  newBlob.x += this.vx * delta/10;
  newBlob.y += this.vy * delta/10;
  return newBlob;
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
  this.name = params.name;
  this.type = 'player';

  Blob.call(this, params);
};

Player.prototype = new Blob();
Player.prototype.constructor = Player;

exports.Game = Game;
exports.Player = Player;
exports.Blob = Blob;

})(typeof global === "undefined" ? window : exports);

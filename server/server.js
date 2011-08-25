var io = require('socket.io').listen(5050);
var gamejs = new require('../common/game.js');
var level = new require('./level.js');

var Game = gamejs.Game;
var game = new Game();

// Generate a new level.
var gen = new level.Generator({
  width: Game.WIDTH,
  height: Game.HEIGHT,
  maxSpeed: 0.1,
  maxRadius: 15,
  blobCount: 10
});

game.load(gen.generate());

// Initialize the game loop
game.updateEvery(Game.UPDATE_INTERVAL);
var observerCount = 0;

io.sockets.on('connection', function(socket) {
  observerCount++;
  // Keep track of the player associated with this socket
  var playerId = null;

  // When client connects, dump game state
  socket.emit('start', {
    state: game.save()
  });

  // Client shoots
  socket.on('shoot', function(data) {
    console.log('recv shoot', data);
    // Check that the player is still alive
    if (!game.blobExists(playerId)) {
      return;
    }
    // Update the game game
    game.shoot(playerId, data.direction);
    data.playerId = playerId;
    data.timeStamp = (new Date()).valueOf();
    // Broadcast that shot was fired.
    io.sockets.emit('shoot', data);
  });

  socket.on('state', function(data) {
    socket.emit('state', {
      state: game.save()
    });
  });

  // Client joins the game as a player
  socket.on('join', function(data) {
    console.log('recv join', data);
    if (game.blobExists(data.name)) {
      // Don't allow duplicate names.
      return;
    }
    if (game.getPlayerCount() >= 4) {
      // Don't allow more than 4 players.
      return;
    }
    playerId = game.join(data.name);
    data.timeStamp = new Date();
    // Broadcast that client has joined
    socket.broadcast.emit('join', data);
    data.isme = true;
    socket.emit('join', data);
  });

  // Client leaves the game
  socket.on('leave', function(data) {
    console.log('recv leave', data);
    observerCount--;
    game.leave(playerId);
    data.timeStamp = new Date();
    // Broadcast that client has joined
    io.sockets.emit('leave', data);
  });

  socket.on('disconnect', function(data) {
    console.log('recv disconnect', data);
    observerCount--;
    game.leave(playerId);
    // If this was a player, it just left
    if (playerId) {
      socket.broadcast.emit('leave', {name: playerId, timeStamp: new Date()});
    }
  });

  // Periodically emit time sync commands
  var timeSyncTimer = setInterval(function() {
    socket.emit('time', {
      timeStamp: (new Date()).valueOf(),
      lastUpdate: game.state.timeStamp,
      updateCount: game.updateCount,
      observerCount: observerCount
    });
  }, 2000);
});

// When someone dies, let the clients know.
game.on('dead', function(data) {
  io.sockets.emit('leave', {name: data.id, type: data.type, timeStamp: new Date()});
});

// When the game ends, let the clients know.
game.on('victory', function(data) {
  console.log('game victory event fired');
  io.sockets.emit('victory', {id: data.id});
  // Stop the game.
  game.over();
  // Wait a bit and then restart.
  setTimeout(function() {
    // Load a new level.
    game.load(gen.generate());
    // Restart the game.
    game.updateEvery(Game.UPDATE_INTERVAL);
  }, Game.RESTART_DELAY);
});

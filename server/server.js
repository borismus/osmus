var STATE = {
  1: {
    type: 'blob',
    id: 1,
    x: 100,
    y: 400,
    r: 10,
    vx: 0.1,
    vy: -0.1
  },
  2: {
    type: 'blob',
    id: 2,
    x: 200,
    y: 100,
    r: 5,
    vx: -0.1,
    vy: 0.2
  },
  3: {
    type: 'blob',
    id: 3,
    x: 100,
    y: 200,
    r: 50,
    vx: 1,
    vy: 0
  }
};

var io = require('socket.io').listen(5050);
var game = new require('../common/game.js');

var engine = new game.Game();
engine.load(STATE);

// Initialize the game loop
function gameloop() {
  var time = new Date();
  // Update the engine
  engine.update(time);
  // Ping the clients with the current time
}
var timer = setInterval(gameloop, 100);
var observerCount = 0;

io.sockets.on('connection', function(socket) {
  observerCount++;
  // Keep track of the player associated with this socket
  var playerId = null;

  // When client connects, dump game state
  socket.emit('state', engine.save());

  // Client shoots
  socket.on('shoot', function(data) {
    console.log('recv shoot', data);
    // Update the game engine
    engine.shoot(playerId, data.direction);
    data.playerId = playerId;
    // Broadcast that shot was fired.
    io.sockets.emit('shoot', data);
  });

  // Client joins the game as a player
  socket.on('join', function(data) {
    console.log('recv join', data);
    playerId = engine.join(data.name);
    // Broadcast that client has joined
    socket.broadcast.emit('join', data);
    data.isme = true;
    socket.emit('join', data);
  });

  // Client leaves the game
  socket.on('leave', function(data) {
    console.log('recv leave', data);
    observerCount--;
    engine.leave(playerId);
    // Broadcast that client has joined
    io.sockets.emit('leave', data);
  });

  socket.on('disconnect', function(data) {
    console.log('recv disconnect', data);
    observerCount--;
    engine.leave(playerId);
    // If this was a player, it just left
    if (playerId) {
      socket.broadcast.emit('leave', {name: playerId});
    }
  });

  // Periodically emit time sync commands
  var timeSyncTimer = setInterval(function() {
    socket.emit('time', {
      date: new Date(),
      observerCount: observerCount
    });
  }, 5000);

  engine.on('dead', function(data) {
    io.sockets.emit('leave', {name: data.id});
  });
});


function generateState() {
}

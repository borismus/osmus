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
    type: 'player',
    id: 2,
    name: 'borismus',
    x: 200,
    y: 100,
    r: 5,
    vx: -0.1,
    vy: 0.2
  }
};

var io = require('socket.io').listen(5050);
var game = new require('../common/game.js');

var Game = game.Game;

var engine = new game.Game();
engine.load(STATE);

function gameloop() {
  engine.update(new Date());
}

var timer = setInterval(gameloop, 1000);


io.sockets.on('connection', function (socket) {
  // When client connects, dump game state
  socket.emit('state', engine.save());

  // Client shoots
  socket.on('shoot', function(data) {
    console.log('recv shoot', data);
  });

  // Client joins the game as a player
  socket.on('join', function(data) {
    console.log('recv join', data);
  });
});


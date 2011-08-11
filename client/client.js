document.addEventListener('DOMContentLoaded', function() {

// Globals
socket = io.connect('http://localhost:5050');
game = new Game();
playerId = null;
skew = 0;

var renderer = new Renderer(game);
var input = new Input(game);

// Get the initial game state
socket.on('start', function(data) {
  console.log('recv state', data);
  // Load the game
  game.load(data.state);
  // Get the initial time to calibrate synchronization.
  // scenario: t0 = server time; t1 = client time; r = refresh rate;
  // goal: server and client interval start should be synced
  // so we take server state, load into client.
  // then we wait until t2 == t0 + k*r to start the timer, but progress
  // the game state k times beforehand.
  // 1. compute k
  // 2. run game state k times
  // 3. wait for t1 - (t0 + k*r) ms before starting.
  var t0 = data.state.timeStamp;
  var t1 = new Date().valueOf();
  var d = t1 - t0;
  skew = d;
  var r = Game.UPDATE_INTERVAL;
  var k = Math.floor(d / r);
  var startTime = t0 + k*r;
  console.log('starting in', t1 - startTime);

  // Run the game k times

  // Setup the game progress loop
  setTimeout(function() {
    if (new Date() - startTime >= 0) {
      game.updateEvery(Game.UPDATE_INTERVAL);
    }
  }, 0);

  // Start the renderer.
  renderer.render();
});

socket.on('state', function(data) {
  game.load(data.state);
});

// A new client joins.
socket.on('join', function(data) {
  console.log('recv join', data);
  game.join(data.name);
  if (data.isme) {
    playerId = data.name;
  }
  document.getElementById('player-count').innerText = game.getPlayerCount();
});

// A client leaves.
socket.on('leave', function(data) {
  console.log('recv leave', data);
  game.leave(data.name);
  document.getElementById('player-count').innerText = game.getPlayerCount();
});

// A client shoots.
socket.on('shoot', function(data) {
  console.log('recv shoot', data.timeStamp, (new Date()).valueOf());
  game.shoot(data.playerId, data.direction, data.timeStamp);
  socket.emit('state');
});

// Get a time sync from the server
socket.on('time', function(data) {
  socket.emit('state');
  //console.log('recv time', data);
  // Number of clients that aren't playing.
  document.getElementById('observer-count').innerText =
      Math.max(data.observerCount - game.getPlayerCount(), 0);

  // Compute how much we've skewed from the server
  var timeDelta = new Date() - data.timeStamp;
  var updateDelta = game.state.timeStamp - data.lastUpdate;
  game.state.timeStamp = data.lastUpdate;
  //console.log('timeDelta', timeDelta);
  console.log('updateDelta', updateDelta);
  //console.log('updateCountDelta', game.updateCount - data.updateCount);
});

// Server reports that somebody won!
socket.on('victory', function(data) {
  if (playerId) {
    if (data.id == playerId) {
      alert('you won!');
    } else {
      alert(data.id + ' won and you lost!');
    }
  } else {
    alert('game over. ' + data.id + ' won!');
  }
  window.location.reload();
});

game.on('dead', function(data) {
  // Someone died :(
  // If it's the player on this client, end game!
  if (data.id == playerId) {
    alert('sorry, you died :(');
  }
});

// Note: do not use this as the definitive game win condition because we may be
// out of sync with the truth on the server!
game.on('victory', function(data) {
  // Somebody won!
});

});

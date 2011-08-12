document.addEventListener('DOMContentLoaded', function() {

// Globals
//socket = io.connect('http://smus.com:5050');
socket = io.connect('http://localhost:5050');
game = new Game();
playerId = null;
totalSkew = 0;
alert = smoke.signal;

var renderer = new Renderer(game);
var input = new Input(game);
sound = new SoundManager();

// Get the initial game state
socket.on('start', function(data) {
  sound.playSoundtrack();
  console.log('recv state', data);
  // Load the game
  game.load(data.state);
  // Get the initial time to calibrate synchronization.
  var startDelta = new Date().valueOf() - data.state.timeStamp;
  // Setup the game progress loop
  game.updateEvery(Game.UPDATE_INTERVAL, startDelta);

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
  // Get a fresh state
  socket.emit('state');
});

// A client leaves.
socket.on('leave', function(data) {
  console.log('recv leave', data);
  game.leave(data.name);
  document.getElementById('player-count').innerText = game.getPlayerCount();
  // Get a fresh state
  socket.emit('state');
});

// A client shoots.
socket.on('shoot', function(data) {
  console.log('recv shoot', data.timeStamp, (new Date()).valueOf());
  // Play shoot sound effect
  sound.playBloop();
  game.shoot(data.playerId, data.direction, data.timeStamp);
  // Get a fresh state
  socket.emit('state');
});

// Get a time sync from the server
socket.on('time', function(data) {
  // Compute how much we've skewed from the server
  var updateDelta = game.state.timeStamp - data.lastUpdate;
  totalSkew += updateDelta;
  console.log('totalSkew', totalSkew);
  if (Math.abs(totalSkew) > 50) {
    // Fetch the new truth from the server.
    socket.emit('state');
    totalSkew = 0;
  }
  // Set the true timestamp anyway now.
  //game.state.timeStamp = data.lastUpdate;

  // Number of clients that aren't playing.
  document.getElementById('observer-count').innerText =
      Math.max(data.observerCount - game.getPlayerCount(), 0);
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

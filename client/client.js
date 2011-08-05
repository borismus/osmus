document.addEventListener('DOMContentLoaded', function() {

// Globals
socket = io.connect('http://localhost:5050');
game = new Game();
playerId = null;

var renderer = new Renderer(game);
var input = new Input(game);

// Get the initial game state
socket.on('state', function(data) {
  console.log('recv state', data);
  // Load the game
  game.load(data);
  renderer.render();
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
  console.log('recv shoot', data);
  game.shoot(data.playerId, data.direction);
});

// Get a time sync from the server
socket.on('time', function(data) {
  console.log('recv time', data);
  // Number of clients that aren't playing.
  document.getElementById('observer-count').innerText =
      Math.max(data.observerCount - game.getPlayerCount(), 0);
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

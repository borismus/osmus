document.addEventListener('DOMContentLoaded', function() {

var socket = io.connect('http://localhost:5050');
game = new Game();
var renderer = new CanvasRenderer(game);

// Get the initial game state
socket.on('state', function(data) {
  console.log('recv state', data);
  // Load the game
  game.load(data);
  renderer.render();
});

// Get an update from the server
socket.on('update', function(data) {
  console.log('recv update', data);
});

// Get a time sync from the server
socket.on('time', function(data) {
  console.log('recv time', data);
});

});

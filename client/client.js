document.addEventListener('DOMContentLoaded', function() {

// TODO: These should be hidden with var
socket = io.connect('http://localhost:5050');
game = new Game();
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
});

// A client leaves.
socket.on('leave', function(data) {
  console.log('recv leave', data);
  game.leave(data.name);
});

// A client shoots.
socket.on('shoot', function(data) {
  console.log('recv shoot', data);
  game.shoot(data.playerId, data.direction);
});

// Get a time sync from the server
socket.on('time', function(data) {
  console.log('recv time', data);
});

});

game.on('dead', function(data) {
  // Someone died :(
  // If it's the player on this client, end game!
  if (data.id == clientId) {
  }
});

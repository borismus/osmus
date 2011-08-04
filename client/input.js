(function(exports) {
/**
 * Desktop input handler (ie. mouse, keyboard)
 */

function DesktopInput(game) {
  this.game = game;
  var ctx = this;

  // Listen for mouse events on the canvas element
  var canvas = document.getElementById('canvas');
  canvas.addEventListener('click', function(e) {
    ctx.onclick.call(ctx, e);
  });

  // Bind to the join button
  var join = document.getElementById('join');
  join.addEventListener('click', function(e) {
    ctx.onjoin.call(ctx, e);
  });
}

DesktopInput.prototype.onjoin = function() {
  var name = prompt("your name");
  socket.emit('join', {name: name});
};

DesktopInput.prototype.onleave = function() {
  socket.emit('leave', {name: playerId});
};

DesktopInput.prototype.onclick = function(event) {
  // Get the position of the click.
  var cx = event.clientX;
  var cy = event.clientY;
  // Get the current player.
  var player = this.game.state[playerId];
  // Consider where the player is positioned.
  var px = player.x;
  var py = player.y;
  // Get the angle of the shot
  var angle = Math.atan2(cy - py, cx - px);
  // Send the corresponding shoot() command.
  socket.emit('shoot', { direction: angle });
};

exports.Input = DesktopInput;

})(window);

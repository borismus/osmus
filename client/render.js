// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
})();

var CanvasRenderer = function(game) {
  this.game = game;
  this.canvas = document.getElementById('canvas');
  this.context = this.canvas.getContext('2d');
};

CanvasRenderer.prototype.render = function() {
  var timeStamp = new Date();
  this.game.update(timeStamp);

  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  // Render the game state
  for (var i in this.game.state) {
    var o = this.game.state[i];
    this.renderObject_(o);
  }

  var ctx = this;
  requestAnimFrame(function() {
    ctx.render.call(ctx);
  });
};

CanvasRenderer.prototype.renderObject_ = function(obj) {
  this.context.fillStyle = (obj.name ? 'green' : 'red');
  this.context.fillRect(obj.x, obj.y, obj.r, obj.r);
};

(function(exports) {
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

/**
 * Canvas-based renderer
 */
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
    if (o.dead) {
      // TODO: render animation
      console.log('dead!', o.id);
    }
    this.renderObject_(o);
  }

  var ctx = this;
  requestAnimFrame(function() {
    ctx.render.call(ctx);
  });
};

CanvasRenderer.prototype.renderObject_ = function(obj) {
  var ctx = this.context;
  ctx.fillStyle = (obj.type == "player" ? 'green' : 'red');
  ctx.beginPath();
  if (obj.r > 0) {
    ctx.arc(obj.x, obj.y, obj.r, 0, 2 * Math.PI, true);
  }
  ctx.closePath();
  ctx.fill();
  if (obj.type == 'player') {
    ctx.font = "10pt Arial";
    ctx.fillStyle = 'black';
    ctx.fillText(obj.id, obj.x, obj.y);
  }

};

exports.Renderer = CanvasRenderer;

})(window);


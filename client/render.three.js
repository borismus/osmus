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

var ThreeRenderer = function(game) {
  this.game = game;
  this.geometry = {};

  console.log(game);
  var VIEW_ANGLE = 45,
      ASPECT = Game.WIDTH / Game.HEIGHT,
      NEAR = -500,
      FAR = 500;

  var container = document.getElementById('container');
  this.renderer = new THREE.WebGLRenderer();
  this.camera = new THREE.Camera(VIEW_ANGLE,
                                 ASPECT,
                                 NEAR,
                                 FAR);
  this.scene = new THREE.Scene();

  this.camera.projectionMatrix = THREE.Matrix4.makeOrtho(
      0, Game.WIDTH, 0, Game.HEIGHT, NEAR, FAR);
  this.camera.position.x = 0;
  this.camera.position.y = 0;
  this.camera.position.z = 400;

  this.renderer.setClearColor(new THREE.Color(0xFFFFFF, 1));
  this.renderer.setSize(Game.WIDTH, Game.HEIGHT);
  this.renderer.domElement.id = 'canvas';
  container.appendChild(this.renderer.domElement);

  var pointLight = new THREE.PointLight(0xFFFFFF);
  pointLight.position.x = Game.WIDTH / 2.0;
  pointLight.position.y = Game.HEIGHT / 2.0;
  pointLight.position.z = -400;
  this.scene.addLight(pointLight);
  var ambientLight = new THREE.AmbientLight(0xCCCCCC);
  this.scene.addLight(ambientLight);

  //this.addFloor_();

  this.setSphereProps_(
      this.addSphere_(0xFF0000),
      0, 0, 10);
  this.setSphereProps_(
      this.addSphere_(0xFFF000),
      Game.WIDTH, 0, 10);
  this.setSphereProps_(
      this.addSphere_(0x00FF00),
      0, Game.HEIGHT, 10);
  this.setSphereProps_(
      this.addSphere_(0x0000FF),
      Game.WIDTH, Game.HEIGHT, 10);

};

ThreeRenderer.prototype.addFloor_ = function() {
  var geometry = new THREE.CubeGeometry(Game.WIDTH, Game.HEIGHT, 1, 50, 50);
  var material = new THREE.MeshLambertMaterial({
      color: 0xFFFFFF
  });
  var cube = new THREE.Mesh(geometry, material);
  cube.position.x = Game.WIDTH / 2.0;
  cube.position.y = Game.HEIGHT / 2.0;
  cube.position.z = -200;
  this.scene.addObject(cube);
};

ThreeRenderer.prototype.addSphere_ = function(color) {
  var radius = 1, segments = 16, rings = 32;
  var sphereMaterial = new THREE.MeshLambertMaterial({
      color: color
  });
  var sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, segments, rings),
      sphereMaterial);
  this.scene.addChild(sphere);
  return sphere;
};



ThreeRenderer.prototype.setSphereProps_ = function(geo, x, y, r) {
  geo.scale.x = r;
  geo.scale.y = r;
  geo.scale.z = r;
  geo.position.x = x;
  geo.position.y = y;
  geo.position.z = 0;
};

ThreeRenderer.prototype.render = function() {
  var timeStamp = new Date();
  this.game.update(timeStamp);
  for (var i in this.game.state) {
    var o = this.game.state[i];
    if (o.dead) {
      // TODO: render animation
      this.scene.removeChild(this.geometry[o.id]);
      delete this.geometry[o.id];
      console.log('dead!', o.id);
    } else {
      this.updateObject_(o);
    }
  }
  this.renderer.render(this.scene, this.camera);
  var ctx = this;
  requestAnimFrame(function() {
    ctx.render.call(ctx);
  });
};

ThreeRenderer.prototype.updateObject_ = function(obj) {
  if (!this.geometry[obj.id]) {
    var color = (obj.type == 'player' ? 0x00cc00 : 0xcc0000);
    console.log("Adding sphere", obj, color);
    this.geometry[obj.id] = this.addSphere_(color);
  }
  var mesh = this.geometry[obj.id];
  if (obj.r > 0) {
    this.setSphereProps_(mesh, obj.x, obj.y, obj.r);
    //console.log(obj.id, obj.x, obj.y, obj.r);
  }
  /*
  if (obj.type == 'player') {
    ctx.font = "10pt Arial";
    ctx.fillStyle = 'black';
    ctx.fillText(obj.id, obj.x, obj.y);
  }
  */
};

exports.Renderer = ThreeRenderer;

})(window);


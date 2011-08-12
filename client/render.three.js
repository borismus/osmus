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
      SHADOW_MAP_WIDTH = 2048,
      SHADOW_MAP_HEIGHT = 2048,
      NEAR = 0.1,
      FAR = 2000;

  var container = document.getElementById('container');
  this.renderer = new THREE.WebGLRenderer();
  this.camera = new THREE.Camera(VIEW_ANGLE,
                                 ASPECT,
                                 NEAR,
                                 FAR);
  this.scene = new THREE.Scene();

  this.camera.projectionMatrix = THREE.Matrix4.makeOrtho(
      0, Game.WIDTH, Game.HEIGHT, 0, NEAR, FAR);
  this.camera.position.x = 0;
  this.camera.position.y = 0;
  this.camera.position.z = 1000;
  this.camera.rotation.z = Math.PI / 2.0;

  this.renderer.shadowCameraNear = 3;
  this.renderer.shadowCameraFar = FAR;
  this.renderer.shadowCameraFov = 90;
  this.renderer.shadowMapBias = 0.0039;
  this.renderer.shadowMapDarkness = 0.5;
  this.renderer.shadowMapWidth = SHADOW_MAP_WIDTH;
  this.renderer.shadowMapHeight = SHADOW_MAP_HEIGHT;
  this.renderer.shadowMapEnabled = true;
  this.renderer.shadowMapSoft = true;

  this.renderer.setClearColor(new THREE.Color(0xFFFFFF, 1));
  this.renderer.setSize(Game.WIDTH, Game.HEIGHT);
  this.renderer.domElement.id = 'canvas';
  container.appendChild(this.renderer.domElement);

  /*
  var pointLight = new THREE.PointLight(0xFFFFFF);
  pointLight.position.x = Game.WIDTH / 2.0;
  pointLight.position.y = Game.HEIGHT / 2.0;
  pointLight.position.z = 500;
  this.scene.addLight(pointLight);
  */

  var light = new THREE.SpotLight(0xFFFFFF);
  light.intensity = 0.8;
  lightX = Game.WIDTH / 2.0;
  lightY = Game.HEIGHT / 2.0;
  light.position.set(lightX, lightY, 800);
  light.target.position.set(lightX, lightY, 0);
  light.castShadow = true;
  this.scene.addLight(light);

  var ambientLight = new THREE.AmbientLight(0x555555);
  this.scene.addLight(ambientLight);

  this.addFloor_();

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

  var myself = this;
  var cameraDelta = 100;
  window.addEventListener('keydown', function(evt) {
    switch(evt.keyCode) {
      case 37: // left
        myself.camera.position.x -= cameraDelta;
        break;
      case 38: // up
        myself.camera.position.y += cameraDelta;
        break;
      case 39: // right
        myself.camera.position.x += cameraDelta;
        break;
      case 40: // down
        myself.camera.position.y -= cameraDelta;
        break;
    }
  });
};

ThreeRenderer.prototype.addFloor_ = function() {
  var geometry = new THREE.CubeGeometry(Game.WIDTH, Game.HEIGHT, 1, 1, 1);
  var material = new THREE.MeshLambertMaterial({
      color: 0xFFFFFF
  });
  var cube = new THREE.Mesh(geometry, material);
  cube.position.x = Game.WIDTH / 2.0;
  cube.position.y = Game.HEIGHT / 2.0;
  cube.position.z = -1;
  cube.castShadow = false;
  cube.receiveShadow = true;
  this.scene.addObject(cube);
};

ThreeRenderer.prototype.addSphere_ = function(color) {
  var radius = 1, segments = 32, rings = 32;
  var sphereMaterial = new THREE.MeshLambertMaterial({
      color: color
  });
  var sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, segments, rings),
      sphereMaterial);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  this.scene.addChild(sphere);
  return sphere;
};

ThreeRenderer.prototype.setSphereProps_ = function(geo, x, y, r) {
  r = Math.max(r, 2);
  geo.scale.x = r;
  geo.scale.y = r;
  geo.scale.z = r;
  geo.position.x = x;
  geo.position.y = Game.HEIGHT - y;
  geo.position.z = r;
};

ThreeRenderer.prototype.render = function() {
  var timeStamp = new Date();
  var objects = this.game.state.objects;
  for (var i in objects) {
    var o = objects[i];
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


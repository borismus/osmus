function LevelGenerator(params) {
  this.blobCount = params.blobCount;
  this.maxSpeed= params.maxSpeed;
  this.maxRadius = params.maxRadius;
  this.width = params.width;
  this.height = params.height;

  this.lastId = 0;
}

LevelGenerator.prototype.generate = function() {
  var state = {
    objects: {},
    timeStamp: new Date()
  };
  var count = this.blobCount;
  while (count--) {
    var blob = this.createRandomBlob_();
    state.objects[blob.id] = blob;
  }
  return state;
};

LevelGenerator.prototype.createRandomBlob_ = function() {
  return {
    type: 'blob',
    id: this.lastId++,
    x: Math.floor(Math.random() * this.width),
    y: Math.floor(Math.random() * this.height),
    r: Math.floor(Math.random() * this.maxRadius),
    vx: this.createRandomSpeed_(),
    vy: this.createRandomSpeed_()
  };
};

LevelGenerator.prototype.createRandomSpeed_ = function() {
  var speed = Math.random() * this.maxSpeed * 2;
  return speed - this.maxSpeed/2;
};

exports.Generator = LevelGenerator;

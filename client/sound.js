(function(exports) {

var BLOOPS = ['sounds/bloop1.wav', 'sounds/bloop2.wav',
    'sounds/bloop3.wav', 'sounds/bloop4.wav', 'sounds/bloop5.wav'];

function AudioTagSoundManager() {
  this.audio = document.createElement('audio');
  this.soundtrack = document.createElement('audio');
  this.soundtrack.setAttribute('loop', true);
  this.soundtrack.src = 'sounds/soundtrack.mp3';
  this.soundtrack.volume = 0.5;
}

AudioTagSoundManager.prototype.playBloop = function() {
  var url = BLOOPS[Math.floor(Math.random() * BLOOPS.length)];
  this.audio.src = url;
  this.audio.play();
};

AudioTagSoundManager.prototype.playJoin = function() {
};

AudioTagSoundManager.prototype.toggleSoundtrack = function() {
  if (this.soundtrack.paused) {
    this.soundtrack.play();
  } else {
    this.soundtrack.pause();
  }
};

exports.SoundManager = AudioTagSoundManager;

})(window);

'use strict';
var musicPlayer = function() {
  var self = this;

  const $musicPlayer = document.createElement('audio');
  let idArray = [];
  let pathArray = [];
  let curIndex = 0;
  
  self.playSong = function(songID) {
    curIndex = idArray.indexOf(songID);
    $musicPlayer.src = pathArray[curIndex];
    $musicPlayer.play();
  }

  self.playPause = function() {
    $musicPlayer.paused ? $musicPlayer.play() : $musicPlayer.pause();
  }

  self.nextTrack = function() {
    let nextTrackPath = pathArray[curIndex + 1];

    if (nextTrackPath) {
      $musicPlayer.src = nextTrackPath;
      $musicPlayer.play();
      curIndex++;
    } else {
      curIndex = 0;
      $musicPlayer.src = pathArray[curIndex];
      $musicPlayer.play();
    }
  }

  self.previousTrack = function() {
    let previousTrackPath = pathArray[curIndex - 1];

    if (previousTrackPath) {
      $musicPlayer.src = previousTrackPath;
      $musicPlayer.play();
      curIndex--;
    } else {
      curIndex = pathArray.length - 1;
      $musicPlayer.src = pathArray[curIndex];
      $musicPlayer.play();
    }
  }

  self.queueNext = function(songID) {
    let songIndex = idArray.indexOf(songID);
    let songPath = pathArray[songIndex];

    idArray.splice(curIndex + 1, 0, songID);
    pathArray.splice(curIndex + 1, 0, songPath);
  }

  self.setVolume = function(event) {
    $musicPlayer.volume = event.target.value / 100;
  }

  self.paths = pathArray;
  self.IDs = idArray;
  self.audio = $musicPlayer;
}

module.exports = musicPlayer;

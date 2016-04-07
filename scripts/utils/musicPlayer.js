'use strict';
var musicPlayer = function() {
  var self = this;

  var $musicPlayer = document.createElement('audio');
  // var $musicPlayerNextBuffer = document.createElement('audio');
  // var $musicPlayerPreviousBuffer = document.createElement('audio');

  $musicPlayer.volume = 1;
  self.ids = [];
  self.paths = [];
  self.curIndex = 0;
  self.curTrackId = 0;

  // LISTENERS
  $musicPlayer.onended = function() {
    self.nextTrack();
  }
  
  self.playSong = function(songId) {
    self.curTrackId = songId;
    self.curIndex = self.ids.indexOf(songId);
    $musicPlayer.src = self.paths[self.curIndex];
    $musicPlayer.play();
  }

  self.playPause = function() {
    if ($musicPlayer.src === '') {
      self.curIndex = 0;
      $musicPlayer.src = self.paths[self.curIndex];
    }
    $musicPlayer.paused ? $musicPlayer.play() : $musicPlayer.pause();
  }

  self.nextTrack = function() {
    let nextTrackPath = self.paths[self.curIndex + 1]

    if (nextTrackPath) {
      $musicPlayer.src = nextTrackPath;
      $musicPlayer.play();
      self.curIndex++;
      self.curTrackId = self.ids[self.curIndex];
    } else {
      self.curIndex = 0;
      self.curTrackId = self.ids[self.curIndex];
      $musicPlayer.src = self.paths[self.curIndex];
      $musicPlayer.play();
    }
  }

  self.previousTrack = function() {
    let previousTrackPath = self.paths[self.curIndex - 1];

    if (previousTrackPath) {
      $musicPlayer.src = previousTrackPath;
      $musicPlayer.play();
      self.curIndex--;
      self.curTrackId = self.ids[self.curIndex];
    } else {
      self.curIndex = self.paths.length - 1;
      self.curTrackId = self.ids[self.curIndex];
      $musicPlayer.src = self.paths[self.curIndex];
      $musicPlayer.play();
    }
  }

  self.queueNext = function(songId) {
    let songIndex = self.ids.indexOf(songId);
    let songPath = self.paths[songIndex];

    self.ids.splice(self.curIndex + 1, 0, songId);
    self.paths.splice(self.curIndex + 1, 0, songPath);
  }

  self.setVolume = function(event) {
    $musicPlayer.volume = event.target.value / 100;
  }

  self.updateListData = function(tracks) {
    var idArray = tracks.map(track => {
      return track._id;
    });
    var pathArray = tracks.map(track => {
      return track.path;
    });
    self.ids = idArray;
    self.paths = pathArray;
  }

  self.audio = $musicPlayer;
}

module.exports = musicPlayer;

'use strict';
let musicPlayer = function() {
  let self = this;

  let $musicPlayer = document.createElement('audio');
  // var $musicPlayerNextBuffer = document.createElement('audio');
  // var $musicPlayerPreviousBuffer = document.createElement('audio');

  $musicPlayer.volume = 1;
  self.ids = [];
  self.paths = [];
  self.shuffledIds = [];
  self.shuffledPaths = [];
  self.shuffleActivated = false;
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
    // Last track, reset to start. Can count on both lists being the same size
    if (self.curIndex === self.ids.length - 1) {
      self.curIndex = 0;
    } else {
      self.curIndex += 1;
    }

    // Get proper list according to shuffle status
    let nextTrackPath;
    if (!self.shuffleActivated) {
      nextTrackPath = self.paths[self.curIndex];
      self.curTrackId = self.ids[self.curIndex];
    } else {
      nextTrackPath = self.shuffledPaths[self.curIndex];
      self.curTrackId = self.shuffledIds[self.curIndex];
    }

    $musicPlayer.src = nextTrackPath;
    $musicPlayer.play();
  }

  self.previousTrack = function() {
    // Last track, reset to start. Can count on both lists being the same size
    if (self.curIndex === 0) {
      self.curIndex = self.ids.length - 1;
    } else {
      self.curIndex -= 1;
    }

    // Get proper list according to shuffle status
    let prevTrackPath;
    if (!self.shuffleActivated) {
      prevTrackPath = self.paths[self.curIndex];
      self.curTrackId = self.ids[self.curIndex];
    } else {
      prevTrackPath = self.shuffledPaths[self.curIndex];
      self.curTrackId = self.shuffledIds[self.curIndex];
    }

    $musicPlayer.src = prevTrackPath;
    $musicPlayer.play();
  }

  self.queueNext = function(songId) {
    let songIndex, songPath;
    if (!self.shuffleActivated) {
      songIndex = self.ids.indexOf(songId);
      songPath = self.paths[songIndex];
    } else {
      songIndex = self.shuffledIds.indexOf(songId);
      songPath = self.shuffledPaths[songIndex];
    }

    self.ids.splice(self.curIndex + 1, 0, songId);
    self.paths.splice(self.curIndex + 1, 0, songPath);
  }

  self.setVolume = function(event) {
    $musicPlayer.volume = event.target.value / 100;
  }

  self.seek = function(event) {
    let percentage = event.x / event.target.clientWidth;
    let targetTime = Math.round($musicPlayer.duration * percentage);
    $musicPlayer.currentTime = targetTime;
  }

  self.updateListData = function(tracks) {
    let idArray = tracks.map(track => {
      return track._id;
    });
    let pathArray = tracks.map(track => {
      return track.path;
    });
    self.ids = idArray;
    self.paths = pathArray;
    self.shuffleList();
  }

  // Shuffle function. Need to shuffle the ids and paths the same way to maintain functionality
  // For now, reset to start of list
  self.shuffleList = function() {
    let idCopy = self.ids.slice();
    let pathsCopy = self.paths.slice();
    self.shuffledIds = [];
    self.shuffledPaths = [];
    while (idCopy.length > 0) {
      let randomIndex = Math.floor(Math.random() * idCopy.length);
      let tempId = idCopy.splice(randomIndex - 1,1);
      let tempPath = pathsCopy.splice(randomIndex - 1,1);
      self.shuffledIds.push(tempId);
      self.shuffledPaths.push(tempPath);
    }
  }

  self.toggleShuffle = function() {
    if (!self.shuffleActivated) {
      self.shuffleList();
      self.shuffleActivated = true;
    } else {
      self.shuffleActivated = false;
    }
    self.curIndex = -1;
    self.nextTrack();
  }

  self.audio = $musicPlayer;
}

module.exports = musicPlayer;

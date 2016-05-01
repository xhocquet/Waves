class musicPlayer {
  constructor() {
    let self = this;

    this._musicPlayer = document.createElement('audio');
    this._nextMusicPlayer = document.createElement('audio');

    this._musicPlayer.volume = 1;
    this._nextMusicPlayer.volume = this._musicPlayer.volume;
    this.ids = [];
    this.paths = [];
    this.shuffledIds = [];
    this.shuffledPaths = [];
    this.shuffleActivated = false;
    this.curIndex = 0;
    this.curTrackId = 0;

    this._musicPlayer.onended = function() {
      self.nextTrack();
    }
  }

  playSong(songId) {
    this.curTrackId = songId;
    this.curIndex = this.ids.indexOf(songId);
    this._musicPlayer.src = this.paths[this.curIndex];
    this._musicPlayer.play();

    this.loadNextTrack();
  }

  playPause() {
    if (this._musicPlayer.src === '') {
      this.curIndex = 0;
      this._musicPlayer.src = this.paths[this.curIndex];
    }
    this._musicPlayer.paused ? this._musicPlayer.play() : this._musicPlayer.pause();
  }

  loadNextTrack() {
    this._nextMusicPlayer.src = this.nextSrc;
    this._nextMusicPlayer.load();
  }

  get nextSrc() {
    let nextIndex = this.curIndex;
    // Last track, reset to start. Can count on both lists being the same size
    if (nextIndex === this.ids.length - 1) {
      nextIndex = 0;
    } else {
      nextIndex += 1;
    }

    // Get proper list according to shuffle status
    let nextTrackPath;
    if (!this.shuffleActivated) {
      nextTrackPath = this.paths[nextIndex];
      this.curTrackId = this.ids[nextIndex];
    } else {
      nextTrackPath = this.shuffledPaths[nextIndex];
      this.curTrackId = this.shuffledIds[nextIndex];
    }

    return nextTrackPath;
  }

  // Play next track
  nextTrack() {
    console.log('nextTrack');
    console.log(this._musicPlayer);
    this._musicPlayer = this._nextMusicPlayer;
    this._musicPlayer.play();
    console.log(this._musicPlayer);
    if (this.curIndex === this.ids.length - 1) {
      this.curIndex = 0;
    } else {
      this.curIndex += 1;
    }
    this._nextMusicPlayer = document.createElement('audio');
    this._nextMusicPlayer.volume = this._musicPlayer.volume;
    this.loadNextTrack();
  }

  // Play previous track
  previousTrack() {
    // Last track, reset to start. Can count on both lists being the same size
    if (this.curIndex === 0) {
      this.curIndex = this.ids.length - 1;
    } else {
      this.curIndex -= 1;
    }

    // Get proper list according to shuffle status
    let prevTrackPath;
    if (!this.shuffleActivated) {
      prevTrackPath = this.paths[this.curIndex];
      this.curTrackId = this.ids[this.curIndex];
    } else {
      prevTrackPath = this.shuffledPaths[this.curIndex];
      this.curTrackId = this.shuffledIds[this.curIndex];
    }

    this._musicPlayer.src = prevTrackPath;
    this._musicPlayer.play();
  }

  queueNext(songId) {
    let songIndex, songPath;
    if (!this.shuffleActivated) {
      songIndex = this.ids.indexOf(songId);
      songPath = this.paths[songIndex];
    } else {
      songIndex = this.shuffledIds.indexOf(songId);
      songPath = this.shuffledPaths[songIndex];
    }

    this.ids.splice(this.curIndex + 1, 0, songId);
    this.paths.splice(this.curIndex + 1, 0, songPath);
  }

  seek(event) {
    let percentage = event.x / event.target.clientWidth;
    let targetTime = Math.round(this._musicPlayer.duration * percentage);
    this._musicPlayer.currentTime = targetTime;
  }

  updateListData(idArray, pathArray) {
    this.ids = idArray;
    this.paths = pathArray;
    this.shuffleList();
  }

  // Shuffle function. Need to shuffle the ids and paths the same way to maintain functionality
  // For now, reset to start of list
  shuffleList() {
    let idCopy = this.ids.slice();
    let pathsCopy = this.paths.slice();
    this.shuffledIds = [];
    this.shuffledPaths = [];
    while (idCopy.length > 0) {
      let randomIndex = Math.floor(Math.random() * idCopy.length);
      let tempId = idCopy.splice(randomIndex - 1,1)[0];
      let tempPath = pathsCopy.splice(randomIndex - 1,1)[0];
      this.shuffledIds.push(tempId);
      this.shuffledPaths.push(tempPath);
    }
  }

  toggleShuffle() {
    if (!this.shuffleActivated) {
      this.shuffleList();
      this.shuffleActivated = true;
    } else {
      this.shuffleActivated = false;
    }
    this.curIndex = -1;
    this.nextTrack();
  }

  setVolume(value) {
    this._musicPlayer.volume = value;
  }

  volumeUp() {
    this.setVolume(Math.min(this._musicPlayer.volume += 0.1, 1));
  }

  volumeDown() {
    this.setVolume(Math.max(this._musicPlayer.volume -= 0.1, 0));
  }

  volumeMuteToggle() {
    this._musicPlayer.muted = this._musicPlayer.muted ? false : true;
  }


  get audio() {
    return this._musicPlayer;
  }

  get idArray() {
    return this.ids;
  }

  get pathArray() {
    return this.paths;
  }
}

module.exports = musicPlayer;

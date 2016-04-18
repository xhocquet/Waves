class musicPlayer {
  constructor() {
    let self = this;

    this._musicPlayer = document.createElement('audio');

    this._musicPlayer.volume = 1;
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
  }

  playPause() {
    if (this._musicPlayer.src === '') {
      this.curIndex = 0;
      this._musicPlayer.src = this.paths[this.curIndex];
    }
    this._musicPlayer.paused ? this._musicPlayer.play() : this._musicPlayer.pause();
  }

  // Play next track
  nextTrack() {
    // Last track, reset to start. Can count on both lists being the same size
    if (this.curIndex === this.ids.length - 1) {
      this.curIndex = 0;
    } else {
      this.curIndex += 1;
    }

    // Get proper list according to shuffle status
    let nextTrackPath;
    if (!this.shuffleActivated) {
      nextTrackPath = this.paths[this.curIndex];
      this.curTrackId = this.ids[this.curIndex];
    } else {
      nextTrackPath = this.shuffledPaths[this.curIndex];
      this.curTrackId = this.shuffledIds[this.curIndex];
    }

    this._musicPlayer.src = nextTrackPath;
    this._musicPlayer.play();
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

  setVolume(event) {
    this._musicPlayer.volume = event.target.value / 100;
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

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

  queueNext(trackId) {
    let trackIndex, trackPath;
    if (!this.shuffleActivated) {
      trackIndex = this.ids.indexOf(trackId);
      trackPath = this.paths[trackIndex];
    } else {
      trackIndex = this.shuffledIds.indexOf(trackId);
      trackPath = this.shuffledPaths[trackIndex];
    }
    this.ids.splice(this.curIndex + 1, 0, trackId);
    this.paths.splice(this.curIndex + 1, 0, trackPath);
  }

  // Queue up tracks in reverse order to preserve click order
  queueMultipleNext(trackArray) {
    for (let i = trackArray.length - 1; i > -1; i--) {
      console.log(trackArray[i])
      this.queueNext(trackArray[i]);
    }
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

  // Shuffle paths and ids
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

  // Shuffle if needed and set index to new position
  toggleShuffle() {
    if (!this.shuffleActivated) {
      this.shuffleList();
      this.curIndex = this.shuffledIds.indexOf(this.curTrackId);
      this.shuffleActivated = true;
    } else {
      this.curIndex = this.ids.indexOf(this.curTrackId);
      this.shuffleActivated = false;
    }
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

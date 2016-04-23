// MODULES
const ipcRenderer = require('electron').ipcRenderer;
const Remote = require('electron').remote;
const Menu = Remote.Menu;
var playerWindow = Remote.getCurrentWindow();
var mp = require('../scripts/utils/musicPlayer.js');
const MetaData = require('musicmetadata');
const fs = require('graceful-fs');

// ELECTRON MENUS
const trackContextMenuSource = require('../scripts/menus/trackContextMenu.js');
const trackContextMenu = Menu.buildFromTemplate(trackContextMenuSource);

// DOM REFERENCES
let searchDiv = document.getElementById("search");
let contentDiv = document.getElementById("content");
let pauseButton = document.getElementById("pause");
let previousButton = document.getElementById("previous");
let nextButton = document.getElementById("next");
let shuffleButton = document.getElementById("shuffle");
let progressBarDiv = document.getElementById("progressBar");
let curProgressDiv = document.getElementById("curProgress");
let songList = document.getElementById("songList");
let volumeSlider = document.getElementById("volumeSlider");
let albumArtImage = document.getElementById("albumArtImage");
let artistListContainer = document.getElementById("artistListContainer");

playerWindow.musicPlayer = new mp();
playerWindow.displayedTrackIds = null;
playerWindow.displayedTrackPaths = null;

// REACT
const React = require('react');
const ReactDOM = require('react-dom');
let TrackList = require('../scripts/modules/trackList.jsx');
let ArtistList = require('../scripts/modules/artistList.jsx');

let TrackListComponent = ReactDOM.render(<TrackList
  height={770}
  musicPlayer={playerWindow.musicPlayer}
  playerWindow={playerWindow}
  recordHeight={25}
  trackContextMenu={trackContextMenu}
/>, contentDiv);


function artistClick(artist, event) {
  event.preventDefault();
  if (artist === "All") {
    ipcRenderer.send('getListData', {});
  } else {
    ipcRenderer.send('getListData', {
      artist: artist
    });
  }
}

let ArtistListComponent = ReactDOM.render(<ArtistList
  onClick={artistClick}
  playerWindow={playerWindow}
  musicPlayer={playerWindow.musicPlayer}
/>, artistListContainer);

setupIPCListeners();
setupEventListeners();

function setupIPCListeners() {
  // Only update trackList, update player list when user plays something new
  ipcRenderer.on('listData', function(event, response) {
    let idArray = response.map(track => {
      return track._id;
    });
    let pathArray = response.map(track => {
      return track.path;
    });
    playerWindow.displayedTrackIds = idArray;
    playerWindow.displayedTrackPaths = pathArray;

    renderTracklist(response);
  });

  ipcRenderer.on('initialListData', function(event, response) {
    let idArray = response.map(track => {
      return track._id;
    });
    let pathArray = response.map(track => {
      return track.path;
    });
    playerWindow.displayedTrackIds = idArray;
    playerWindow.displayedTrackPaths = pathArray;

    playerWindow.updateMusicPlayerData();
    renderTracklist(response);
  });

  ipcRenderer.on('playPause', function(event, response) {
    playerWindow.musicPlayer.playPause();
  });

  ipcRenderer.on('nextTrack', function(event, response) {
    playerWindow.musicPlayer.nextTrack();
  });

  ipcRenderer.on('previousTrack', function(event, response) {
    playerWindow.musicPlayer.previousTrack();
  });

  ipcRenderer.on('addToQueue', function(event, response) {  
    playerWindow.musicPlayer.queueNext(response.trackID);
  });

  ipcRenderer.on('setVolume', function(event, response) {
    playerWindow.musicPlayer.audio.volume = response.value;
  });

  ipcRenderer.on('artistListData', function(event, response) {
    ArtistListComponent.setState({
      artists: response
    })
  });
}

function renderTracklist(tracks) {
  // Reset scroll so we don't just see blank
  TrackListComponent.refs.scrollable.scrollTop = 0;
  TrackListComponent.setState({
    tracks: tracks,
    total: tracks.length,
    selectedTrackComponents: []
  });
}

function addTracksToQueue(...tracks) {
  playerWindow.musicPlayer.queueNext(tracks[0]);
}

function playPause() {
  playerWindow.musicPlayer.playPause();
}

function playHandler() {
  let trackId = playerWindow.musicPlayer.curTrackId;
  let trackComponent = TrackListComponent.refs[trackId];

  // Update now playing track
  TrackListComponent.setState({
    playingTrackId: trackId,
    playingTrackComponent: trackComponent
  });

  // Update the play/pause button
  if (!playerWindow.musicPlayer.audio.paused) {
    pauseButton.style.background = "url('../assets/pause.svg') no-repeat left top";
  } else {
    pauseButton.style.background = "url('../assets/play.svg') no-repeat left top";
  }

  // Update album art
  updateAlbumArtImage(playerWindow.musicPlayer.audio.src);
}

function deleteTrack(trackId) {
  databaseManager.deleteTrack(trackId);
}

function search(event) {
  let searchTerm = searchDiv.value;
  if (searchTerm === "") {
    ipcRenderer.send('getListData', {});
  } else {
    ipcRenderer.send('getListData', {
      searchAll: searchDiv.value
    });
  }
}

function updateAlbumArtImage(filePath) {
  if (filePath) {
    let newFilePath = decodeURI(filePath.slice(8));

    let fileStream = fs.createReadStream(newFilePath);
    MetaData(fileStream, function(err, metaData) {
      let coverImage = metaData.picture[0];
      if (coverImage) {
        let base64String = "";
        for (let i = 0; i < coverImage.data.length; i++) {
          base64String += String.fromCharCode(coverImage.data[i]);
        }
        let base64 = "data:" + coverImage.format + ";base64," + window.btoa(base64String);

        albumArtImage.setAttribute('src',base64);
      } else {0
        albumArtImage.setAttribute('src', "../assets/albumArt.png");
      }
    });
  } else {
    albumArtImage.setAttribute('src', "../assets/albumArt.png");
  }
}

playerWindow.updateMusicPlayerData = function() {
  if (playerWindow.displayedTrackIds !== playerWindow.musicPlayer.idArray) {
    playerWindow.musicPlayer.updateListData(playerWindow.displayedTrackIds, playerWindow.displayedTrackPaths);
  }
}

function progressHandler() {
  if (!playerWindow.musicPlayer.audio.ended) {
    let progress = playerWindow.musicPlayer.audio.currentTime;
    let total = playerWindow.musicPlayer.audio.duration;
    let ratio = (progress/total) * 100;
    curProgressDiv.style.width = ratio+"%";
  } else {
    curProgressDiv.style.width = "0%";
  }
}

function volumeHandler() {
  let volume = playerWindow.musicPlayer.audio.volume;
  volumeSlider.value = volume * 100;
}

function setupEventListeners() {
  // Search
  searchDiv.oninput = search;
  pauseButton.onclick = playPause;
  previousButton.onclick = playerWindow.musicPlayer.previousTrack.bind(playerWindow.musicPlayer);
  nextButton.onclick = playerWindow.musicPlayer.nextTrack.bind(playerWindow.musicPlayer);
  shuffleButton.onclick = playerWindow.musicPlayer.toggleShuffle.bind(playerWindow.musicPlayer);
  // Set volume with the volume slider
  volumeSlider.oninput = playerWindow.musicPlayer.setVolume.bind(playerWindow.musicPlayer);
  // Seek track on clicking the progress bar
  progressBarDiv.onclick = playerWindow.musicPlayer.seek.bind(playerWindow.musicPlayer);
  playerWindow.musicPlayer.audio.onplay = playHandler;
  playerWindow.musicPlayer.audio.onpause = playHandler;
  playerWindow.musicPlayer.audio.ontimeupdate = progressHandler;
  playerWindow.musicPlayer.audio.onvolumechange = volumeHandler;

  contentDiv.ondragover = function() {
    return false;
  }
  contentDiv.ondragleave = function() {
    return false;
  }
  // Drag file handler
  contentDiv.ondrop = function(e) {
    e.preventDefault();
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      ipcRenderer.send('generateLibrary', { path: e.dataTransfer.files[i].path });
    }
  }

  // Initial album art load
  updateAlbumArtImage();
}

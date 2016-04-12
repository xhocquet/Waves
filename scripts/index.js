// MODULES
const ipcRenderer = require('electron').ipcRenderer;
const Remote = require('electron').remote;
const Menu = Remote.Menu;
var playerWindow = Remote.getCurrentWindow();
var mp = require('../scripts/utils/musicPlayer.js');
const MetaData = require('musicmetadata');
const fs = require('graceful-fs');

// ELECTRON MENUS
var trackContextMenuSource = require('../scripts/menus/trackContextMenu.js');
var trackContextMenu = Menu.buildFromTemplate(trackContextMenuSource);

// DOM REFERENCES
var searchDiv = document.getElementById("search");
var contentDiv = document.getElementById("content");
var pauseButton = document.getElementById("pause");
var previousButton = document.getElementById("previous");
var nextButton = document.getElementById("next");
var shuffleButton = document.getElementById("shuffle");
var progressBarDiv = document.getElementById("progressBar");
var curProgressDiv = document.getElementById("curProgress");
var songList = document.getElementById("songList");
var volumeSlider = document.getElementById("volumeSlider");
var albumArtImage = document.getElementById("albumArtImage");
var artistListContainer = document.getElementById("artistListContainer");

playerWindow.musicPlayer = new mp();

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
/>, artistListContainer);

setupIPCListeners();
setupEventListeners();

function setupIPCListeners() {
  ipcRenderer.on('listData', function(event, response) {
    playerWindow.musicPlayer.updateListData(response);
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

function generateLibrary() {
  ipcRenderer.send('generateLibrary', {});
}

function renderTracklist(tracks) {
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
  var trackId = playerWindow.musicPlayer.curTrackId;
  var trackComponent = TrackListComponent.refs;

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
        var base64String = "";
        for (var i = 0; i < coverImage.data.length; i++) {
          base64String += String.fromCharCode(coverImage.data[i]);
        }
        var base64 = "data:" + coverImage.format + ";base64," + window.btoa(base64String);

        albumArtImage.setAttribute('src',base64);
      } else {
        albumArtImage.setAttribute('src', "../assets/albumArt.png");
      }
    });
  } else {
    albumArtImage.setAttribute('src', "../assets/albumArt.png");
  }
}

function progressHandler() {
  if (!playerWindow.musicPlayer.audio.ended) {
    var progress = playerWindow.musicPlayer.audio.currentTime;
    var total = playerWindow.musicPlayer.audio.duration;
    var ratio = (progress/total) * 100;
    curProgressDiv.style.width = ratio+"%";
  } else {
    curProgressDiv.style.width = "0%";
  }
}

function volumeHandler() {
  var volume = playerWindow.musicPlayer.audio.volume;
  volumeSlider.value = volume * 100;
}

function setupEventListeners() {
  // Search
  searchDiv.oninput = search;
  pauseButton.onclick = playPause;
  previousButton.onclick = playerWindow.musicPlayer.previousTrack;
  nextButton.onclick = playerWindow.musicPlayer.nextTrack;
  shuffleButton.onclick = playerWindow.musicPlayer.toggleShuffle;
  // Set volume with the volume slider
  volumeSlider.oninput = playerWindow.musicPlayer.setVolume;
  // Seek track on clicking the progress bar
  progressBarDiv.onclick = playerWindow.musicPlayer.seek;
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

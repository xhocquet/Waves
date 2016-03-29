// MODULES
var ipcRenderer = require('electron').ipcRenderer;
var Remote = require('electron').remote;
var Menu = Remote.Menu;
var playerWindow = Remote.getCurrentWindow();
var mp = require('../scripts/musicPlayer.js');
const MetaData = require('musicmetadata');
const fs = require('graceful-fs');

// ELECTRON MENUS
var trackContextMenuSource = require('../scripts/menus/trackContextMenu.js');
var trackContextMenu = Menu.buildFromTemplate(trackContextMenuSource);

// DOM REFERENCES
var contentDiv = document.getElementsByClassName("content")[0];
var pauseButton = document.getElementsByClassName("pause")[0];
var previousButton = document.getElementsByClassName("previous")[0];
var nextButton = document.getElementsByClassName("next")[0];
var progressBarDiv = document.getElementsByClassName("progressBar")[0];
var songList = document.getElementsByClassName("songList")[0];
var volumeSlider = document.getElementsByClassName("volumeSlider")[0];
var albumArtImage = document.getElementById("albumArt");
var artistListContainer = document.getElementsByClassName("artistListContainer")[0];

var prevPlayingTrackId = null
var curPlayingTrackId = null;
var curSelectedTrackIds = [];

playerWindow.musicPlayer = new mp();


// REACT
var React = require('react');
var ReactDOM = require('react-dom');
var TrackList = require('../scripts/modules/trackList.jsx');
var ArtistList = require('../scripts/modules/artistList.jsx');

var TrackListComponent = ReactDOM.render(<TrackList
  height={770}
  recordHeight={25}
  musicPlayer={playerWindow.musicPlayer}
  trackContextMenu={trackContextMenu}
/>, contentDiv);


function artistClick(artist, event) {
  event.preventDefault();
  ipcRenderer.send('getListData', {
    artist: artist
  });
}

var ArtistListComponent = ReactDOM.render(<ArtistList
  onClick={artistClick}
/>, artistListContainer);

setupIPCListeners();
setupEventListeners();

function setupIPCListeners() {
  ipcRenderer.on('listData', function(event, response) {
    var idArray = response.map(track => {
      return track._id;
    });
    var pathArray = response.map(track => {
      return track.path;
    });
    playerWindow.musicPlayer.ids = idArray;
    playerWindow.musicPlayer.paths = pathArray;

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
  // Update the play/pause button
  if (!playerWindow.musicPlayer.audio.paused) {
    pauseButton.style.background = "url('../assets/pause.svg') no-repeat left top";
  } else {
    pauseButton.style.background = "url('../assets/play.svg') no-repeat left top";
  }
  updateAlbumArtImage(playerWindow.musicPlayer.audio.src);
}

function updateAlbumArtImage(filePath) {
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
      albumArtImage.setAttribute('src', "../assets/missing_album_art.png")
    }
  });
}

function progressHandler() {
  if (!playerWindow.musicPlayer.audio.ended) {
    var progress = playerWindow.musicPlayer.audio.currentTime;
    var total = playerWindow.musicPlayer.audio.duration;
    var ratio = (progress/total) * 100;
    progressBarDiv.style.width = ratio+"%";
  } else {
    progressBarDiv.style.width = "0%";
  }
}

function volumeHandler() {
  var volume = playerWindow.musicPlayer.audio.volume;
  volumeSlider.value = volume * 100;
}

function setupEventListeners() {
  pauseButton.onclick = playPause;
  previousButton.onclick = playerWindow.musicPlayer.previousTrack;
  nextButton.onclick = playerWindow.musicPlayer.nextTrack;
  volumeSlider.oninput = playerWindow.musicPlayer.setVolume;
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
    var file = e.dataTransfer.files[0];
    ipcRenderer.send('generateLibrary', { path: file.path });
  }
}

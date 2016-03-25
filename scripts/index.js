var ipcRenderer = require('electron').ipcRenderer;
var Remote = require('electron').remote;
var Menu = Remote.Menu;
var playerWindow = Remote.getCurrentWindow();
var mp = require('../scripts/musicPlayer.js');
playerWindow.musicPlayer = new mp();
var React = require('react');
var ReactDOM = require('react-dom');
var TrackList = require('../scripts/modules/trackList.jsx');

var trackContextMenuSource = require('../scripts/menus/trackContextMenu.js');
var trackContextMenu = Menu.buildFromTemplate(trackContextMenuSource);

var contentDiv = document.getElementsByClassName("content")[0];
var pauseButton = document.getElementsByClassName("pause")[0];
var previousButton = document.getElementsByClassName("previous")[0];
var nextButton = document.getElementsByClassName("next")[0];
var progressBarDiv = document.getElementsByClassName("progressBar")[0];
var songList = document.getElementsByClassName("songList")[0];
var volumeSlider = document.getElementsByClassName("volumeSlider")[0];

var prevPlayingTrackId = null
var curPlayingTrackId = null;
var curSelectedTrackIds = [];

var trackList = React.createElement(TrackList, {
  playerWindow: playerWindow,
  musicPlayer: playerWindow.musicPlayer,
  trackContextMenu: trackContextMenu
} ,null);
var songListReactElement = ReactDOM.render(trackList, contentDiv);

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
  })
}

function generateLibrary() {
  ipcRenderer.send('generateLibrary', {});
}

function renderTracklist(tracks) {
  songListReactElement.setState({
    tracks: tracks,
    selectedTracks: []
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

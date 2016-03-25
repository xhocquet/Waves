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

var prevPlayingTrackID = null
var curPlayingTrackID = null;
var curSelectedTrackIDs = [];

var trackList = React.createElement(TrackList, {
  musicPlayer: playerWindow.musicPlayer
} ,null);
var songListReactElement = ReactDOM.render(trackList, contentDiv);

setupIPCListeners();
setupEventListeners();

function setupIPCListeners() {
  ipcRenderer.on('listData', function(event, response) {
    renderTracklist(response);
    for (var track of response) {
      playerWindow.musicPlayer.paths.push(track.path);
      playerWindow.musicPlayer.IDs.push(track._id);
    }
  });

  ipcRenderer.on('playPause', function(event, response) {
    playerWindow.playPause();
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

// Handles clicking on a track
// Left click: Select song, apply style
// Right click: Open context menu
// Middle click: Queue song
function trackClickHandler(event) {
  event.preventDefault();
  if (event.target !== event.currentTarget) {
    var trackID = event.target.parentElement.firstChild.innerHTML;
    switch(event.button) {
      case 0: // Left
        // If ctrl is pressed, add to selection
        if(!event.ctrlKey) {
          if (curSelectedTrackIDs.length > 0) {
            curSelectedTrackIDs.forEach(function(element, index, array) {
              document.getElementById(element).classList.remove('songListItemSelected');
            });
            curSelectedTrackIDs = [];
          }
        }

        curSelectedTrackIDs.push(trackID);
        event.target.parentElement.classList.add('songListItemSelected');
        break;
      case 1: // Middle
        playerWindow.musicPlayer.queueNext(trackID);
        break;
      case 2: // Right
        if (curSelectedTrackIDs.length > 0) {
          curSelectedTrackIDs.forEach(function(element, index, array) {
            document.getElementById(element).classList.remove('songListItemSelected');
          });
          curSelectedTrackIDs = [];
        }
        curSelectedTrackIDs.push(trackID);
        event.target.parentElement.classList.add('songListItemSelected');
        // TODO: Highlight doesn't show up until context menu is closed. Timing thing?

        playerWindow.curTrackID = trackID;
        trackContextMenu.popup(playerWindow);
        break;
    }
  }
  event.stopPropagation();
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

  // Clear last playing song icon, set new one
  if (prevPlayingTrackID) {
    var prevPlayingRow = document.getElementById(prevPlayingTrackID);
    prevPlayingRow.children[1].innerHTML = '';
  }
  var curPlayingRow = document.getElementById(curPlayingTrackID);
  curPlayingRow.children[1].innerHTML = '<img src="../assets/volume.svg" />';
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

function setupEventListeners() {
  // songList.onmousedown = trackClickHandler;
  pauseButton.onclick = playPause;
  previousButton.onclick = playerWindow.musicPlayer.previousTrack;
  nextButton.onclick = playerWindow.musicPlayer.nextTrack;
  volumeSlider.oninput = playerWindow.musicPlayer.setVolume;
  playerWindow.musicPlayer.audio.onplay = playHandler;
  playerWindow.musicPlayer.audio.onpause = playHandler;
  playerWindow.musicPlayer.audio.ontimeupdate = progressHandler;

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

'use strict';
let self = this;
const ipcRenderer = require('electron').ipcRenderer;
const Remote = require('electron').remote;
const Menu = Remote.Menu;
const mp = require('../scripts/musicPlayer.js');
const musicPlayer = new mp();
const playerWindow = Remote.getCurrentWindow();

const trackContextMenuSource = require('../scripts/menus/trackContextMenu.js');
let trackContextMenu = Menu.buildFromTemplate(trackContextMenuSource);

let contentDiv = document.getElementsByClassName("content")[0];
let pauseButton = document.getElementsByClassName("pause")[0];
let previousButton = document.getElementsByClassName("previous")[0];
let nextButton = document.getElementsByClassName("next")[0];
let progressBarDiv = document.getElementsByClassName("progressBar")[0];
let songList = document.getElementsByClassName("songList")[0];
let volumeSlider = document.getElementsByClassName("volumeSlider")[0];

let prevPlayingTrackID = null
let curPlayingTrackID = null;
let curSelectedTrackIDs = [];

setupIPCListeners();
setupEventListeners();
// setupProgressBarTimer();

function setupIPCListeners() {

  ipcRenderer.on('listData', function(event, response) {
    songList.innerHTML = '';

    let count = 0;
    curSelectedTrackIDs = [];
    for (let track of response) {
      let newRow = document.createElement("div");
      let rowClass = count % 2 ? 'songListItem' : 'songListItemAlternate';
      newRow.setAttribute('class', rowClass);
      newRow.setAttribute('id', track._id);

      let htmlString = '<div class="rowItem rowIndex">'
      htmlString += track._id;
      htmlString += '</div><div class="rowItem rowPlaying"></div><div class="rowItem rowArtist">';
      htmlString += track.artist;
      htmlString += '</div><div class="rowItem rowAlbum">';
      htmlString += track.album;
      htmlString += '</div><div class="rowItem rowTitle">';
      htmlString += track.title;
      htmlString += '</div><div class="rowItem rowDuration">';
      htmlString += sanitizeDuration(track.duration);
      htmlString += '</div>';

      newRow.innerHTML = htmlString;

      musicPlayer.paths.push(track.path);
      musicPlayer.IDs.push(track._id);

      songList.appendChild(newRow);
      count++;
    }
  });

  ipcRenderer.on('playPause', function(event, response) {
    self.playPause();
  });

  ipcRenderer.on('nextTrack', function(event, response) {
    musicPlayer.nextTrack();
  });

  ipcRenderer.on('previousTrack', function(event, response) {
    musicPlayer.previousTrack();
  });

  ipcRenderer.on('addToQueue', function(event, response) {  
    musicPlayer.queueNext(response.trackID);
  });
}

function generateLibrary() {
  ipcRenderer.send('generateLibrary', {});
}

function playSong(event) {
  event.preventDefault();
  if (event.target !== event.currentTarget) {
    let trackID = event.target.parentElement.firstChild.innerHTML;
    prevPlayingTrackID = curPlayingTrackID;
    curPlayingTrackID = trackID;
    musicPlayer.playSong(trackID);
  }
  event.stopPropagation();
}

function addTracksToQueue(...tracks) {
  musicPlayer.queueNext(tracks[0]);
}

// Handles clicking on a track
// Left click: Select song, apply style
// Right click: Open context menu
// Middle click: Queue song
function trackClickHandler(event) {
  event.preventDefault();
  if (event.target !== event.currentTarget) {
    let trackID = event.target.parentElement.firstChild.innerHTML;
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
        musicPlayer.queueNext(trackID);
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

function setupEventListeners() {
  songList.ondblclick = playSong;
  songList.onmousedown = trackClickHandler;
  pauseButton.onclick = self.playPause;
  previousButton.onclick = musicPlayer.previousTrack;
  nextButton.onclick = musicPlayer.nextTrack;
  volumeSlider.oninput = musicPlayer.setVolume;
  musicPlayer.audio.onplay = self.playHandler;
  musicPlayer.audio.onpause = self.playHandler;
  musicPlayer.audio.ontimeupdate = self.progressHandler;

  contentDiv.ondragover = function() {
    return false;
  }
  contentDiv.ondragleave = function() {
    return false;
  }
  // Drag file handler
  contentDiv.ondrop = function(e) {
    e.preventDefault();
    let file = e.dataTransfer.files[0];
    ipcRenderer.send('generateLibrary', { path: file.path });
  }
}

function playPause() {
  musicPlayer.playPause();
}

function playHandler() {
  // Update the play/pause button
  if (!musicPlayer.audio.paused) {
    pauseButton.style.background = "url('../assets/pause.svg') no-repeat left top";
  } else {
    pauseButton.style.background = "url('../assets/play.svg') no-repeat left top";
  }

  // Clear last playing song icon, set new one
  if (prevPlayingTrackID) {
    let prevPlayingRow = document.getElementById(prevPlayingTrackID);
    prevPlayingRow.children[1].innerHTML = '';
  }
  let curPlayingRow = document.getElementById(curPlayingTrackID);
  curPlayingRow.children[1].innerHTML = '<img src="../assets/volume.svg" />';
}

function progressHandler() {
  if (!musicPlayer.audio.ended) {
    let progress = musicPlayer.audio.currentTime;
    let total = musicPlayer.audio.duration;
    let ratio = (progress/total) * 100;
    progressBarDiv.style.width = ratio+"%";
  } else {
    progressBarDiv.style.width = "0%";
  }
}

function sanitizeDuration(duration) {
  let minutes = Math.floor(duration / 60);
  let remainder = Math.floor(duration % 60);
  return minutes.toString() + ":" + ("0" + remainder).slice(-2)
}

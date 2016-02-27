'use strict';
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
let progressBarTimer = null;


setupEventListeners();
setupProgressBarTimer();

ipcRenderer.on('listData', function(event, response) {
  songList.innerHTML = '';

  let count = 0;
  for (let track of response) {
    let newRow = document.createElement("div");
    let rowClass = count % 2 ? 'songListItem' : 'songListItemAlternate';
    newRow.setAttribute('class', rowClass);

    let htmlString = '<div class="rowItem rowIndex">'
    htmlString += track._id;
    htmlString += '</div><div class="rowItem rowArtist">';
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
  musicPlayer.playPause();
})

function generateLibrary() {
  ipcRenderer.send('generateLibrary', {});
}

function playSong(event) {
  event.preventDefault();
  if (event.target !== event.currentTarget) {
    let trackID = event.target.parentElement.firstChild.innerHTML;
    musicPlayer.playSong(trackID);
  }
  event.stopPropagation();
}

function addTracksToQueue(...tracks) {
  musicPlayer.queueNext(tracks[0]);
}

function clickHandler(event) {
  event.preventDefault();
  if (event.target !== event.currentTarget) {
    let trackID = event.target.parentElement.firstChild.innerHTML;
    switch(event.button) {
      case 0:
        // select
        break;
      case 1:
        musicPlayer.queueNext(trackID);
        break;
      case 2:
        playerWindow.curTrackID = trackID;
        trackContextMenu.popup(playerWindow);
        break;
    }
  }
  event.stopPropagation();
}

function setupEventListeners() {
  songList.ondblclick = playSong;
  songList.onmousedown = clickHandler;
  pauseButton.onclick = musicPlayer.playPause;
  previousButton.onclick = musicPlayer.previousTrack;
  nextButton.onclick = musicPlayer.nextTrack;

  contentDiv.ondragover = function() {
    return false;
  }
  contentDiv.ondragleave = function() {
    return false;
  }
  contentDiv.ondrop = function(e) {
    e.preventDefault();
    let file = e.dataTransfer.files[0];
    ipcRenderer.send('generateLibrary', { path: file.path });
  }
}

function setupProgressBarTimer() {
  progressBarTimer = window.setInterval(function() {
    if (!musicPlayer.audio.ended) {
      let progress = musicPlayer.audio.currentTime;
      let total = musicPlayer.audio.duration;
      let ratio = (progress/total) * 100;
      progressBarDiv.style.width = ratio+"%";
    } else {
      progressBarDiv.style.width = "0%";
    }
  }, 500);
}

function sanitizeDuration(duration) {
  let minutes = Math.floor(duration / 60);
  let remainder = Math.floor(duration % 60);
  return minutes.toString() + ":" + ("0" + remainder).slice(-2)
}

'use strict';
const ipcRenderer = require('electron').ipcRenderer;
const mp = require('../scripts/musicPlayer.js');
const musicPlayer = new mp();

let pauseButton = document.getElementsByClassName("pause")[0];
let previousButton = document.getElementsByClassName("previous")[0];
let nextButton = document.getElementsByClassName("next")[0];
let progressBarDiv = document.getElementsByClassName("progressBar")[0];
let songList = document.getElementsByClassName("songList")[0];
let progressBarTimer = null;

setupEventListeners();
setupProgressBarTimer();

ipcRenderer.on('listData', function(event, response) {
  // let titleHTML = '<div class="songListTitle"><div class="rowItem rowIndex">0'
  // titleHTML += '</div><div class="rowItem rowArtist">Artist';
  // titleHTML += '</div><div class="rowItem rowAlbum">Album';
  // titleHTML += '</div><div class="rowItem rowTitle">Title';
  // titleHTML += '</div><div class="rowItem rowDuration">x:xx</div></div>';
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

function generateLibrary() {
  ipcRenderer.send('generateLibrary', {});
}

function playSong(event) {
  event.preventDefault();
  if (event.target !== event.currentTarget) {
    let songID = event.target.parentElement.firstChild.innerHTML;
    musicPlayer.playSong(songID);
  }
  event.stopPropagation();
}

function queueSong(event) {

  event.preventDefault();
  if (event.target !== event.currentTarget) {
    if (event.button === 1) {
      let songID = event.target.parentElement.firstChild.innerHTML;
      musicPlayer.queueNext(songID);
    }
  }
  event.stopPropagation();
}

function setupEventListeners() {
  songList.ondblclick = playSong;
  songList.onmousedown = queueSong;
  pauseButton.onclick = musicPlayer.playPause;
  previousButton.onclick = musicPlayer.previousTrack;
  nextButton.onclick = musicPlayer.nextTrack;
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

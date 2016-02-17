'use strict';
const ipcRenderer = require('electron').ipcRenderer;
const musicPlayer = document.createElement('audio');

let pauseButton = document.getElementsByClassName("pause")[0];
let previousButton = document.getElementsByClassName("previous")[0];
let nextButton = document.getElementsByClassName("next")[0];
let progressBarDiv = document.getElementsByClassName("progressBar")[0];

let progressBarTimer = null;

setupEventListeners();
setupProgressBarTimer();

let curPlayingIndex = 0;

ipcRenderer.on('listData', function(event, response) {
  let list = document.getElementsByClassName("songList")[0];
  list.innerHTML = '';
  let count = 0;
  for (let track of response) {
    let newRow = document.createElement("div");
    let rowClass = count % 2 ? 'songListItem' : 'songListItemAlternate';
    newRow.setAttribute('class', rowClass);

    let indexDiv = document.createElement("div");
    indexDiv.setAttribute('class', 'rowItem rowIndex');
    indexDiv.innerHTML = count;
    let artistDiv = document.createElement("div");
    artistDiv.setAttribute('class', 'rowItem rowArtist');
    artistDiv.innerHTML = track.artist;
    let titleDiv = document.createElement("div");
    titleDiv.setAttribute('class', 'rowItem rowTitle');
    titleDiv.innerHTML = track.title;
    let durationDiv = document.createElement("div");
    durationDiv.setAttribute('class', 'rowItem rowDuration');
    durationDiv.innerHTML = track.duration;
    let pathDiv = document.createElement("div");
    pathDiv.setAttribute('class', 'rowItem rowPath');
    pathDiv.innerHTML = track.path;

    newRow.appendChild(indexDiv);
    newRow.appendChild(artistDiv);
    newRow.appendChild(titleDiv);
    newRow.appendChild(durationDiv);
    newRow.appendChild(pathDiv);

    list.appendChild(newRow);
    count++;
  }
});

function refreshList() {
  ipcRenderer.send('getListData', {}); // second param = options
}

function generateLibrary() {
  ipcRenderer.send('generateLibrary', {});
}

function playSong(e) {
  e.preventDefault();
  if (e.target !== e.currentTarget) {
    musicPlayer.src = e.target.parentElement.lastChild.innerHTML;
    musicPlayer.play();
    curPlayingIndex = parseInt(e.target.parentElement.firstChild.innerHTML);
    console.log("current play index: ", curPlayingIndex);
  }
  e.stopPropagation();
}

function playPause() {
  musicPlayer.paused ? musicPlayer.play() : musicPlayer.pause();
}

function nextTrack() {
  curPlayingIndex++;
  musicPlayer.src = document.getElementsByClassName("rowPath")[curPlayingIndex].innerHTML;
  musicPlayer.play();
}

function previousTrack() {
  curPlayingIndex--;
  musicPlayer.src = document.getElementsByClassName("rowPath")[curPlayingIndex].innerHTML;
  musicPlayer.play();
}

function setupEventListeners() {
  document.getElementsByClassName("refresh")[0].onclick = refreshList;
  document.getElementsByClassName("generate")[0].onclick = generateLibrary;
  document.getElementsByClassName("songList")[0].ondblclick = playSong;
  pauseButton.onclick = playPause;
  previousButton.onclick = previousTrack;
  nextButton.onclick = nextTrack;
}

function setupProgressBarTimer() {
  progressBarTimer = window.setInterval(function() {
    if (!musicPlayer.ended) {
      let progress = musicPlayer.currentTime;
      let total = musicPlayer.duration;
      let ratio = (progress/total) * 100;
      progressBarDiv.style.width = ratio+"%";
    }
  }, 500);
}

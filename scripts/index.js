'use strict';
const ipcRenderer = require('electron').ipcRenderer;
const musicPlayer = document.createElement('audio');

document.getElementsByClassName("refresh")[0].onclick = refreshList;
document.getElementsByClassName("generate")[0].onclick = generateLibrary;
document.getElementsByClassName("songList")[0].ondblclick = playSong;

ipcRenderer.on('listData', function(event, response) {
  let list = document.getElementsByClassName("songList")[0];
  list.innerHTML = '';
  let count = 0;
  for (let track of response) {
    let newRow = document.createElement("div");
    let rowClass = count % 2 ? 'songListItem' : 'songListItemAlternate';
    newRow.setAttribute('class', rowClass);

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
  }
  e.stopPropagation();
}

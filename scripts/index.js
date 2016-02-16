'use strict';
const ipcRenderer = require('electron').ipcRenderer;

document.getElementsByClassName("refresh")[0].onclick = refreshList;
document.getElementsByClassName("generate")[0].onclick = generateLibrary;

ipcRenderer.on('listData', function(event, response) {
  let list = document.getElementsByClassName("songList")[0];
  list.innerHTML = '';
  let count = 0;
  for (let track of response) {
    let newRow = document.createElement("div");
    let rowClass = count % 2 ? 'songListItem' : 'songListItemAlternate';
    newRow.setAttribute('class', rowClass);
    newRow.appendChild(document.createTextNode(track.artist[0] + " - " + track.title));
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

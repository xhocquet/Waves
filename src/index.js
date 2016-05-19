// MODULES
const ipcRenderer = require('electron').ipcRenderer;
const Remote = require('electron').remote;
const Menu = Remote.Menu;
let playerWindow = Remote.getCurrentWindow();
let mp = require('./../src/utils/musicPlayer.js');
const MetaData = require('musicmetadata');
const fs = require('graceful-fs');

// ELECTRON MENUS
const trackContextMenuSource = require('./../src/menus/trackContextMenu.js');
const trackContextMenu = Menu.buildFromTemplate(trackContextMenuSource);

// DOM REFERENCES
let searchDiv = document.querySelector("#search");
let contentDiv = document.querySelector("#content");
let pauseButton = document.querySelector("#pause");
let previousButton = document.querySelector("#previous");
let nextButton = document.querySelector("#next");
let shuffleButton = document.querySelector("#shuffle");
let progressBarDiv = document.querySelector("#progressBar");
let curProgressDiv = document.querySelector("#curProgress");
let currentlyPlayingInfo = document.querySelector("#currentlyPlayingInfo");
let songList = document.querySelector("#songList");
let muteButton = document.querySelector("#muteButton");
let volumeSlider = document.querySelector("#volumeSlider");
let albumArtImage = document.querySelector("#albumArtImage");
let explorerListContainer = document.querySelector("#explorerListContainer");

playerWindow.musicPlayer = new mp();
playerWindow.displayedTrackIds = null;
playerWindow.displayedTrackPaths = null;

// REACT
const React = require('react');
const ReactDOM = require('react-dom');
let TrackList = require('./../src/modules/trackList.jsx');
let ExplorerList = require('./../src/modules/explorerList.jsx');

let TrackListComponent = ReactDOM.render(<TrackList
  height={770}
  musicPlayer={playerWindow.musicPlayer}
  playerWindow={playerWindow}
  recordHeight={25}
  trackContextMenu={trackContextMenu}
/>, contentDiv);

let ExplorerListComponent = ReactDOM.render(<ExplorerList
  playerWindow={playerWindow}
  musicPlayer={playerWindow.musicPlayer}
/>, explorerListContainer);

setupIPCListeners();
setupEventListeners();

function setupIPCListeners() {
  // Only update trackList, update player list when user plays something new
  ipcRenderer.on('listData', function(event, tracks) {
    playerWindow.displayedTrackIds = tracks.map(track => track._id);
    playerWindow.displayedTrackPaths = tracks.map(track => track.path);

    renderTracklist(tracks);
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
    playerWindow.musicPlayer.setVolume(response.value);
  });

  ipcRenderer.on('volumeUp', function(event, response) {
    playerWindow.musicPlayer.volumeUp();
  })
  ipcRenderer.on('volumeDown', function(event, response) {
    playerWindow.musicPlayer.volumeDown();
  })
  ipcRenderer.on('volumeMuteToggle', function(event, response) {
    playerWindow.musicPlayer.volumeMuteToggle();
  })

  ipcRenderer.on('libraryData', function(event, libraryData) {
    ExplorerListComponent.setState({
      artist: libraryData.artists,
      album: libraryData.albums,
      albumArtist: libraryData.albumArtists
    })
  });

  ipcRenderer.on('settingsData', function(event, userSettings) {
    playerWindow.musicPlayer.setVolume(userSettings.currentVolume);
    TrackListComponent.setState({
      groupMethod: userSettings.trackGroupingMethod
    });
  })
}

// Pass tracks to TrackList and reset positioning
function renderTracklist(tracks) {
  TrackListComponent.refs.scrollable.scrollTop = 0;
  TrackListComponent.setState({
    tracks: tracks,
    total: tracks.length,
    selectedTrackComponents: [],
    displayStart: 0,
    displayEnd: 200,
    visibleStart: 0,
    visibleEnd: 25
  });
  TrackListComponent.refs.scrollable.scrollTop = 0;
}

function playHandler() {
  let trackId = playerWindow.musicPlayer.curTrackId;
  let trackComponent = TrackListComponent.refs[trackId];
  let curTrack = trackComponent.props.track;

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

  // Update now playing info
  currentlyPlayingInfo.innerHTML = curTrack.artist + " - " + curTrack.title;

  // Update album art
  updateAlbumArtImage(playerWindow.musicPlayer.audio.src);
}

// Remove track from library and libraryData
function deleteTrack(trackId) {
  databaseManager.deleteTrack(trackId);
}

// Generic search for search input
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
        let base64String = "";
        for (let i = 0; i < coverImage.data.length; i++) {
          base64String += String.fromCharCode(coverImage.data[i]);
        }
        let base64 = "data:" + coverImage.format + ";base64," + window.btoa(base64String);

        albumArtImage.setAttribute('src',base64);
      } else {0
        albumArtImage.setAttribute('src', "../assets/albumArt.png");
      }
    });
  } else {
    albumArtImage.setAttribute('src', "../assets/albumArt.png");
  }
}

// Set the musicplayer data to the displayed tracks. Activated when you play something new.
playerWindow.updateMusicPlayerData = function() {
  if (playerWindow.displayedTrackIds !== playerWindow.musicPlayer.idArray) {
    playerWindow.musicPlayer.updateListData(playerWindow.displayedTrackIds, playerWindow.displayedTrackPaths);
  }
}

// Called by musicplayer.audio to update seek bar
function progressHandler() {
  if (!playerWindow.musicPlayer.audio.ended) {
    let progress = playerWindow.musicPlayer.audio.currentTime;
    let total = playerWindow.musicPlayer.audio.duration;
    let ratio = (progress/total) * 100;
    curProgressDiv.style.width = ratio+"%";
  } else {
    curProgressDiv.style.width = "0%";
  }
}

// Called by musicPlayer.audio to update volume slider
function volumeHandler() {
  let volume = playerWindow.musicPlayer.audio.volume;
  volumeSlider.value = volume * 100;
  ipcRenderer.send('newVolume', volume);
}


function setupEventListeners() {
  // Search
  searchDiv.oninput = search;
  pauseButton.onclick = playerWindow.musicPlayer.playPause.bind(playerWindow.musicPlayer);
  previousButton.onclick = playerWindow.musicPlayer.previousTrack.bind(playerWindow.musicPlayer);
  nextButton.onclick = playerWindow.musicPlayer.nextTrack.bind(playerWindow.musicPlayer);
  shuffleButton.onclick = function(event) {
    playerWindow.musicPlayer.toggleShuffle();
    if (playerWindow.musicPlayer.shuffled) {
      shuffleButton.style.backgroundColor = "orange";
    } else {
      shuffleButton.style.backgroundColor = "#333";
    }
  }
  // Set volume with the volume slider
  volumeSlider.oninput = function(event) {
    playerWindow.musicPlayer.setVolume(event.target.value / 100);
  }
  // Mute toggle button
  muteButton.onclick = function(event) {
    let status = playerWindow.musicPlayer.volumeMuteToggle();
    if (status) {
      muteButton.classList.add('muted')
    } else {
      muteButton.classList.remove('muted')
    }
  }
  // Seek track on clicking the progress bar
  progressBarDiv.onclick = playerWindow.musicPlayer.seek.bind(playerWindow.musicPlayer);
  playerWindow.musicPlayer.audio.onplay = playHandler;
  playerWindow.musicPlayer.audio.onpause = playHandler;
  playerWindow.musicPlayer.audio.ontimeupdate = progressHandler;
  playerWindow.musicPlayer.audio.onvolumechange = volumeHandler;

  contentDiv.ondragover = contentDiv.ondragleave = function() {
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

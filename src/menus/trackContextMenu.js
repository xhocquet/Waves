'use strict';

let mainMenu = [
  {
    label: 'Set Volume',
    submenu: [
      {
        label: '100%',
        click: function(item, curWindow) {
          curWindow.setVolume(1);
        }
      },
      {
        label: '80%',
        click: function(item, curWindow) {
          curWindow.setVolume(0.8);
        }
      },
      {
        label: '60%',
        click: function(item, curWindow) {
          curWindow.setVolume(0.6);
        }
      },
      {
        label: '40%',
        click: function(item, curWindow) {
          curWindow.setVolume(0.4);
        }
      },
      {
        label: '20%',
        click: function(item, curWindow) {
          curWindow.setVolume(0.2);
        }
      },
      {
        label: '0%',
        click: function(item, curWindow) {
          curWindow.setVolume(0);
        }
      },
    ]
  },
  {
    label: 'Add to Queue',
    click: function(item, curWindow) {
      curWindow.musicPlayer.queueMultipleNext(curWindow.selectedTracks.map(track => track._id));
    }
  },
  {
    label: 'Add to Playlist',
    click: function(item, curWindow) {
      let playlistName = 'Test1';
      curWindow.selectedTracks.forEach(track => {
        require('electron').remote.app.addToPlaylist(track, playlistName);
      });
    }
  },
  {
    label: 'Remove from Playlist',
    click: function(item, curWindow) {
      let playlistName = 'Test1';
      curWindow.selectedTracks.forEach(track => {
        require('electron').remote.app.removeFromPlaylist(track, playlistName);
      });
    }
  },
  {
    label: 'Remove from Library',
    click: function(item, curWindow) {
      curWindow.selectedTracks.forEach(track => {
        require('electron').remote.app.deleteTrack(track._id);
      });
    }
  },
  {
    label: 'Open in Explorer',
    click: function(item, curWindow) {
      curWindow.selectedTracks.forEach(track => {
        require('electron').shell.showItemInFolder(track.path);
      });
    }
  }
];

module.exports = mainMenu;

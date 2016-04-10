'use strict';

var mainMenu = [
  {
    label: 'Play/Pause', //curWindow.playing? 'play' : 'pause'
    click: function(item, curWindow) {
      curWindow.playPause();
    }
  },
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
      curWindow.selectedTracks.forEach(track => {
        curWindow.musicPlayer.queueNext(track);
      });
    }
  },
];

module.exports = mainMenu;

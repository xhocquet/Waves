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
          curWindow.setVolume(100);
        }
      },
      {
        label: '80%',
        click: function(item, curWindow) {
          curWindow.setVolume(80);
        }
      },
      {
        label: '60%',
        click: function(item, curWindow) {
          curWindow.setVolume(60);
        }
      },
      {
        label: '40%',
        click: function(item, curWindow) {
          curWindow.setVolume(40);
        }
      },
      {
        label: '20%',
        click: function(item, curWindow) {
          curWindow.setVolume(20);
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
      curWindow.addToQueue(curWindow.curTrackID);
    }
  },
];

module.exports = mainMenu;

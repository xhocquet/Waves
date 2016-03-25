'use strict';
const app = require('electron').app;

var trayMenu = [
  {
    label: 'Play/Pause',
    click: function(item, focusedWindow) {
      app.playPause();
    }
  },
  {
    label: 'Next Track',
    click: function(item, focusedWindow) {
      app.nextTrack();
    }
  },
  {
    label: 'Previous Track',
    click: function(item, focusedWindow) {
      app.previousTrack();
    }
  },
  {
    label: 'Set Volume',
    submenu: [
      {
        label: '100%',
        click: function(item, curWindow) {
          app.setVolume(1);
        }
      },
      {
        label: '80%',
        click: function(item, curWindow) {
          app.setVolume(0.8);
        }
      },
      {
        label: '60%',
        click: function(item, curWindow) {
          app.setVolume(0.6);
        }
      },
      {
        label: '40%',
        click: function(item, curWindow) {
          app.setVolume(0.4);
        }
      },
      {
        label: '20%',
        click: function(item, curWindow) {
          app.setVolume(0.2);
        }
      },
      {
        label: '0%',
        click: function(item, curWindow) {
          app.setVolume(0);
        }
      },
    ]
  },
  { 
    label: 'Close Application', 
    click: function(item, focusedWindow) {
      app.exit(0);
    }
  }
];

module.exports = trayMenu;

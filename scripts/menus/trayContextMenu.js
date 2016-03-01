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
    label: 'Close Application', 
    click: function(item, focusedWindow) {
      app.exit(0);
    }
  }
];

module.exports = trayMenu;

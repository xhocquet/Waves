'use strict';
const app = require('electron').app;

var mainMenu = [
  { label: 'Quit', click: function(item, focusedWindow) {
    app.quit();
  }}
];

module.exports = mainMenu;

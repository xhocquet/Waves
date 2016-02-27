'use strict';

var mainMenu = [
  {
    label: 'Play/Pause', //curWindow.playing? 'play' : 'pause'
    click: function(item, curWindow) {
      curWindow.playPause();
    }
  },
  {
    label: 'TODO Volume',
    submenu: [
      {
        label: '100%'
      },
      {
        label: '50% etc'
      },
    ]
  },
  {
    label: 'Add to Queue',
    click: function(item, curWindow) {
      console.log(curWindow.curTrackID);
    }
  },
];

module.exports = mainMenu;

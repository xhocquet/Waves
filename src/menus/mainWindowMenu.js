'use strict';
let app = require('electron').app;

let mainMenu = [
  {
    label: 'Controls',
    submenu: [
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
      }
    ]
  },
  {
    label: 'About',
    role: 'help',
    submenu: [
      {
        label: 'Settings',
        click: function(item, focusedWindow) { 
          app.openSettings();
        }
      },
      {
        label: 'Generate Library',
        click: function(item, focusedWindow) {
          focusedWindow.generateLibraryFromSettings();
        }
      },
      {
        label: 'Refresh Library',
        click: function(item, focusedWindow) {
          focusedWindow.refreshLibrary();
        }
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: (function() {
          if (process.platform == 'darwin')
            return 'Alt+Command+I';
          else
            return 'Ctrl+Shift+I';
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.toggleDevTools();
        }
      },
      {
        label: 'GitHub Repo',
        click: function() { require('electron').shell.openExternal('http://github.com/xhocquet/Waves') }
      }
    ]
  },
  {
    label: 'Playlist',
    submenu: [
      {
        label: 'Create New Playlist',
        click: function(item, focusedWindow) { 
          app.createNewPlaylist();
        }
      }
    ]
  }
];

if (process.platform == 'darwin') {
  let name = require('electron').app.getName();
  template.unshift({
    label: name,
    submenu: [
      {
        label: 'About ' + name,
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        label: 'Services',
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        label: 'Hide ' + name,
        accelerator: 'Command+H',
        role: 'hide'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Alt+H',
        role: 'hideothers'
      },
      {
        label: 'Show All',
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click: function() { app.quit(); }
      },
    ]
  });
  // Window menu.
  template[3].submenu.push(
    {
      type: 'separator'
    },
    {
      label: 'Bring All to Front',
      role: 'front'
    }
  );
}

module.exports = mainMenu;

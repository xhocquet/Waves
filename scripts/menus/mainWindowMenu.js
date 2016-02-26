'use strict';

var mainMenu = [
  {
    label: 'Music',
    submenu: [
      {
        label: 'Play/Pause',
        accelerator: 'CmdOrCtrl+Shift+Up',
        click: function(item, focusedWindow) {
          console.log(item)
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
      }
    ]
  },
  {
    label: 'Window',
    role: 'window',
    submenu: [
      {
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
      },
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
      },
    ]
  },
  {
    label: 'About',
    role: 'help',
    submenu: [
      {
        label: 'GitHub Repo',
        click: function() { require('electron').shell.openExternal('http://github.com/xhocquet') }
      },
      {
        label: 'Settings',
        click: function(item, focusedWindow) { 
          focusedWindow.openSettingsWindow();
        }
      },
      {
        label: 'Generate Library',
        click: function(item, focusedWindow) {
          focusedWindow.generateLibrary();
        }
      },
      {
        label: 'Refresh Library',
        click: function(item, focusedWindow) {
          focusedWindow.refreshLibrary();
        }
      }
    ]
  },
];

if (process.platform == 'darwin') {
  var name = require('electron').app.getName();
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

'use strict';

const electron = require('electron');
const ipcMain = electron.ipcMain;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const Tray = electron.Tray;

const dm = require('./scripts/databaseManager.js');
const databaseManager = new dm();

const mainWindowMenu = require('./scripts/menus/mainWindowMenu.js');
const trayIconMenu = require('./scripts/menus/trayContextMenu.js');

let playerWindow;
let settingsWindow;
let trayIcon;

function createWindow () {
  playerWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    center: true,
    title: "Waves",
    minHeight: 500,
    minWidth: 500
  });

  settingsWindow = new BrowserWindow({
    width: 400,
    height: 400,
    show: false,
    center: true,
    minHeight: 400,
    minWidth: 400,
    frame: false,
    resizable: false,
    movable: false
  });

  trayIcon = new Tray('assets/icon.png');

  playerWindow.loadURL('file://' + __dirname + '/views/index.html');
  playerWindow.openSettingsWindow = function() {
    settingsWindow.show();
  }
  playerWindow.generateLibrary = function() {
    databaseManager.getSettings(function(settings) {
      settings.importFolders.forEach(function(element, index, array) {
        databaseManager.generateLibrary(element);
      })
    })
  }
  playerWindow.refreshLibrary = function() {
    // librarymanager.generate
  }
  playerWindow.setMenu(Menu.buildFromTemplate(mainWindowMenu));

  setupListeners();

  settingsWindow.loadURL('file://' + __dirname + '/views/settings.html');
  // settingsWindow.toggleDevTools();
  // settingsWindow.show();

  trayIcon.setContextMenu(Menu.buildFromTemplate(trayIconMenu));
}

app.on('ready', createWindow);

// Mac quit
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Mac recreate window
app.on('activate', function () {
  if (playerWindow === null) {
    createWindow();
  }
});

function sendInitialLibrary() {
  databaseManager.queryLibrary({page: 0}, function(response) {
    playerWindow.webContents.send("listData", response);
  });
}

function setupListeners() {
  // Pass-through database query for library
  ipcMain.on('getListData', function(event, options) {
    databaseManager.queryLibrary(options, function(response) {
      event.sender.send("listData", response);
    });
  });

  // Generate library from renderer command.
  ipcMain.on('generateLibrary', function(event, options) {
    generateLibrary("D:/Music/Beirut/");
    db.songs.persistence.compactDatafile();
    // console.log("Generated.");
  });

  // Close settings window
  ipcMain.on('closeSettings', function(event, options) {
    settingsWindow.hide();
  });

  // Save the settings in the db
  ipcMain.on('saveSettings', function(event, message) {
    databaseManager.saveSettings(message.userSettings, function(response) {
      event.sender.send("saveResponse", response);
    });
  });

  // Send initial library when the page loads
  playerWindow.webContents.on('did-finish-load', function(e) {
    sendInitialLibrary();
  });

  // Close the window, quit the app
  // TODO: Just hide the window so you can play minimized or something
  playerWindow.on('closed', function() {
    playerWindow = null;
    settingsWindow = null;
    trayIcon = null;
    app.quit();
  });

  // Fetches the settings when you open the settings window
  // TODO: change this to when it opens, not focus
  settingsWindow.on('focus', function() {
    databaseManager.getSettings(function(settings) {
      settingsWindow.webContents.send("settingsData", settings);
    });
  });
}

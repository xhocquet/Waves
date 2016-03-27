'use strict';

const electron = require('electron');
const ipcMain = electron.ipcMain;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const GlobalShortcut = electron.globalShortcut;
const Menu = electron.Menu;
const Tray = electron.Tray;

const dm = require('./scripts/databaseManager.js');
const databaseManager = new dm();
databaseManager.loadSettings(afterSettingsLoad);
databaseManager.loadLibraryData();

const mainWindowMenu = require('./scripts/menus/mainWindowMenu.js');
const trayIconMenu = require('./scripts/menus/trayContextMenu.js');

let playerWindow;
let settingsWindow;
// let testWindow;
let trayIcon;

setupAppListeners();
setupIPCListeners();

function createWindows () {
  playerWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    center: true,
    title: "Waves",
    minHeight: 500,
    minWidth: 500
  });

  setupPlayerWindow();
  setupPlayerWindowListeners();

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

  // testWindow = new BrowserWindow({
  //   width: 700,
  //   height: 700,
  //   show: false,
  //   center: true,
  //   minHeight: 700,
  //   minWidth: 700,
  //   frame: false,
  //   resizable: false,
  //   movable: false
  // });
  // testWindow.loadURL('file://' + __dirname + '/views/test.html');
  // testWindow.show();

  settingsWindow.loadURL('file://' + __dirname + '/views/settings.html');
  // settingsWindow.toggleDevTools();
  // settingsWindow.show();

  trayIcon = new Tray('assets/icon.png');
  trayIcon.setContextMenu(Menu.buildFromTemplate(trayIconMenu));
  trayIcon.on('double-click', function(event, bounds) {
    event.preventDefault();
    if (playerWindow.isVisible()) {
      playerWindow.hide();
    } else {
      playerWindow.show();
    }
  });
}

function setupGlobalShorcuts() {
  GlobalShortcut.unregisterAll();

  var playPauseHotkey = databaseManager.userSettings.playPauseHotkey;
  var previousTrackHotkey = databaseManager.userSettings.previousTrackHotkey;
  var nextTrackHotkey = databaseManager.userSettings.nextTrackHotkey;

  GlobalShortcut.register(playPauseHotkey, app.playPause);
  GlobalShortcut.register(previousTrackHotkey, app.previousTrack);
  GlobalShortcut.register(nextTrackHotkey, app.nextTrack);
}

function afterSettingsLoad() {
  setupGlobalShorcuts();

  settingsWindow.webContents.on('did-finish-load', function() {
    settingsWindow.webContents.send("settingsData", databaseManager.userSettings);
  });
}

function sendInitialLibrary() {
  databaseManager.queryLibrary({}, function(response) {
    playerWindow.webContents.send("listData", response);
  });
}

function setupPlayerWindow() {
  playerWindow.openSettingsWindow = function() {
    GlobalShortcut.unregisterAll();
    settingsWindow.show();
  }
  playerWindow.refreshLibrary = function() {
    // librarymanager.generate
  }
  playerWindow.playPause = function() {
    playerWindow.webContents.send("playPause", {});
  }
  playerWindow.nextTrack = function() {
    playerWindow.webContents.send("nextTrack");
  }
  playerWindow.previousTrack = function() {
    playerWindow.webContents.send("previousTrack");
  }
  playerWindow.addToQueue = function(track) {
    playerWindow.webContents.send("addToQueue", { trackID: track });
  }
  playerWindow.setVolume = function(value) {
    playerWindow.webContents.send("setVolume", { value: value });
  }

  playerWindow.curTrackID = null;

  playerWindow.setMenu(Menu.buildFromTemplate(mainWindowMenu));
  playerWindow.loadURL('file://' + __dirname + '/views/index.html');
}

function setupAppListeners() {
  app.on('ready', createWindows);

  // Mac recreate window
  app.on('activate', function () {
    if (playerWindow === null) {
      createWindow();
    }
  });

  app.on('will-quit', function(e) {
    GlobalShortcut.unregisterAll();
    playerWindow = null;
    settingsWindow = null;
    trayIcon = null;
  })
}

function setupIPCListeners() {
  // Pass-through database query for library
  ipcMain.on('getListData', function(event, options) {
    databaseManager.queryLibrary(options, function(response) {
      event.sender.send("listData", response);
    });
  });

  // Generate library from path or settings
  ipcMain.on('generateLibrary', function(event, options) {
    if (options.path) {
      databaseManager.generateLibrary(options.path);
    } else {
      databaseManager.generateLibraryFromSettings();
    }
  });

  // Close settings window
  ipcMain.on('closeSettings', function(event, options) {
    settingsWindow.hide();
    setupGlobalShorcuts();
  });

  // Save the settings in the db
  ipcMain.on('saveSettings', function(event, message) {
    databaseManager.saveSettings(message.userSettings, function(response) {
      event.sender.send("saveResponse", response);
    });
  });
}

function setupPlayerWindowListeners() {
  // Send initial library when the page loads
  playerWindow.webContents.on('did-finish-load', function(e) {
    sendInitialLibrary();
  });

  // When X is clicked, action based on user settings
  playerWindow.on('close', function(event) {
    if (databaseManager.userSettings.minimizeOnClose) {
      event.preventDefault();
      playerWindow.hide();
    }
  });

  playerWindow.on('closed', function() {
    app.quit();
  });
}

app.playPause = function() {
  playerWindow.playPause();
}

app.nextTrack = function() {
  playerWindow.nextTrack();
}

app.previousTrack = function() {
  playerWindow.previousTrack();
}

app.sendLibrary = function() {
  sendInitialLibrary();
}

app.setVolume = function(value) {
  playerWindow.setVolume(value);
}

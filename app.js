'use strict';

const electron = require('electron');
const {ipcMain, app, BrowserWindow, globalShortcut, Menu, Tray} = electron;

const dm = require('./src/utils/databaseManager.js');
const databaseManager = new dm();

resetDatabases();

const mainWindowMenu = require('./src/menus/mainWindowMenu.js');
const trayIconMenu = require('./src/menus/trayContextMenu.js');

let playerWindow;
let settingsWindow;
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
    minWidth: 1050
  });

  setupPlayerWindow();
  setupPlayerWindowListeners();

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 600,
    show: false,
    center: true,
    title: "Waves Settings",
    autoHideMenuBar: true,
    resizable: false,
    movable: false
  });

  settingsWindow.loadURL('file://' + __dirname + '/views/settings.html');

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

function resetDatabases() {
  databaseManager.initializeDatabases();
  databaseManager.loadLibraryData(afterLibraryDataLoad);
  databaseManager.loadSettings(afterSettingsLoad);
}

function afterSettingsLoad() {
  setupGlobalShorcuts();

  // Send data now or later depending on if the page is loading
  if (playerWindow.webContents.isLoading()) {
    playerWindow.webContents.on('did-finish-load', function() {
      playerWindow.webContents.send("settingsData", databaseManager.userSettings);
    });
  } else {
    playerWindow.webContents.send("settingsData", databaseManager.userSettings);
  }

  if (settingsWindow.webContents.isLoading()) {
    settingsWindow.webContents.on('did-finish-load', function() {
      settingsWindow.webContents.send("settingsData", databaseManager.userSettings);
    });
  } else {
    settingsWindow.webContents.send("settingsData", databaseManager.userSettings);
  }
}

// Send data now or later depending on if the page is loading
function afterLibraryDataLoad() {
  if (playerWindow.webContents.isLoading()) {
    playerWindow.webContents.on('did-finish-load', function() {
      playerWindow.webContents.send("libraryData", databaseManager.libraryData);
    });
  } else {
    playerWindow.webContents.send("libraryData", databaseManager.libraryData);
  }
}

function setupGlobalShorcuts() {
  globalShortcut.unregisterAll();

  var playPauseHotkey = databaseManager.userSettings.playPauseHotkey;
  var previousTrackHotkey = databaseManager.userSettings.previousTrackHotkey;
  var nextTrackHotkey = databaseManager.userSettings.nextTrackHotkey;
  var volumeUpHotkey = databaseManager.userSettings.volumeUpHotkey;
  var volumeDownHotkey = databaseManager.userSettings.volumeDownHotkey;
  var volumeMuteHotkey = databaseManager.userSettings.volumeMuteHotkey;

  playPauseHotkey ? globalShortcut.register(playPauseHotkey, app.playPause) : null;
  previousTrackHotkey? globalShortcut.register(previousTrackHotkey, app.previousTrack) : null;
  nextTrackHotkey ? globalShortcut.register(nextTrackHotkey, app.nextTrack) : null;
  volumeUpHotkey ? globalShortcut.register(volumeUpHotkey, app.volumeUp) : null;
  volumeDownHotkey ? globalShortcut.register(volumeDownHotkey, app.volumeDown) : null;
  volumeMuteHotkey ? globalShortcut.register(volumeMuteHotkey, app.volumeMuteToggle) : null;
}

function sendLibraryData() {
  playerWindow.webContents.send("libraryData", databaseManager.libraryData);
}

function sendInitialLibrary() {
  databaseManager.queryLibrary({}, function(response) {
    playerWindow.webContents.send("initialListData", response);
  });
}

function setupPlayerWindow() {
  playerWindow.loadURL('file://' + __dirname +'/views/index.html');
  
  playerWindow.generateLibraryFromSettings = function() {
    databaseManager.generateLibraryFromSettings();
  }

  // CONTROLS
  playerWindow.nextTrack = function() {
    playerWindow.webContents.send("nextTrack");
  }
  playerWindow.previousTrack = function() {
    playerWindow.webContents.send("previousTrack");
  }
  playerWindow.addToQueue = function(track) {
    playerWindow.webContents.send("addToQueue", { trackID: track });
  }

  // VOLUME
  playerWindow.setVolume = function(value) {
    playerWindow.webContents.send("setVolume", { value: value });
  }
  playerWindow.volumeUp = function() {
    playerWindow.webContents.send("volumeUp", {});
  }
  playerWindow.volumeDown = function() {
    playerWindow.webContents.send("volumeDown", {});
  }
  playerWindow.volumeMuteToggle = function() {
    playerWindow.webContents.send("volumeMuteToggle", {});
  }

  playerWindow.setMenu(Menu.buildFromTemplate(mainWindowMenu));
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
    globalShortcut.unregisterAll();
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
    app.closeSettings();
  });

  // Save the settings in the db
  ipcMain.on('saveSettings', function(event, settings) {
    databaseManager.saveSettings(settings, function(response) {
      event.sender.send("saveResponse", response);
    });
  });

  // Called when new data is imported via settings
  ipcMain.on('importedData', function(event, blank) {
    resetDatabases();
  });

  ipcMain.on('newVolume', function(event, newVolume) {
    databaseManager.userSettings.currentVolume = newVolume;
    databaseManager.saveSettings(databaseManager.userSettings, function(response) {});
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
  playerWindow.webContents.send("playPause", {});
}

app.nextTrack = function() {
  playerWindow.nextTrack();
}

app.previousTrack = function() {
  playerWindow.previousTrack();
}

app.afterNewLibraryData = function() {
  sendInitialLibrary();
  sendLibraryData();
}

app.setVolume = function(value) {
  playerWindow.setVolume(value);
}

app.volumeDown = function() {
  playerWindow.volumeDown();
}

app.volumeUp = function() {
  playerWindow.volumeUp();
}

app.volumeMuteToggle = function() {
  playerWindow.volumeMuteToggle();
}

app.openSettings = function() {
  globalShortcut.unregisterAll();
  settingsWindow.show();
}

app.closeSettings = function() {
  playerWindow.webContents.send("settingsData", databaseManager.userSettings);
  settingsWindow.hide();
  setupGlobalShorcuts();
}

app.deleteTrack = function(trackId) {
  databaseManager.deleteTrack(trackId);
}

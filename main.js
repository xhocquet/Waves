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

setupAppListeners();

function createWindows () {
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

  setupIPCListeners();
  setupPlayerWindow();
  setupPlayerWindowListeners();
  setupSettingsWindowListeners();

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
  })

  databaseManager.loadSettings();
}

function sendInitialLibrary() {
  databaseManager.queryLibrary({page: 0}, function(response) {
    playerWindow.webContents.send("listData", response);
  });
}

function setupPlayerWindow() {
  playerWindow.openSettingsWindow = function() {
    settingsWindow.show();
  }
  playerWindow.refreshLibrary = function() {
    // librarymanager.generate
  }
  playerWindow.playPause = function() {
    playerWindow.webContents.send("playPause", {});
  }
  playerWindow.addToQueue = function(track) {
    playerWindow.webContents.send("addToQueue", { trackID: track });
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

  // Generate library from renderer command.
  ipcMain.on('generateLibrary', function(event, options) {
    if (options.path) {
      databaseManager.generateLibrary(options.path);
    } else {
      // TODO Just make a specific function in the manager for adding user setting folders,
      // OR conditional in the dbmanager and pass along the options
      databaseManager.userSettings.importFolders.forEach(function(element, index, array) {
        databaseManager.generateLibrary(element);
      })
    }
    databaseManager.saveLibraryData();
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
}

function setupPlayerWindowListeners() {
  // Send initial library when the page loads
  playerWindow.webContents.on('did-finish-load', function(e) {
    sendInitialLibrary();
  });

  // When X is clicked, action based on user settings
  playerWindow.on('close', function(e) {
    if (databaseManager.userSettings.minimizeOnClose) {
      e.preventDefault();
      playerWindow.hide();
    }
  });

  playerWindow.on('closed', function() {
    app.quit();
  })

  
}

function setupSettingsWindowListeners() {
  // Fetches the settings when you open the settings window
  // TODO: change this to when it opens, not focus
  settingsWindow.on('focus', function() {
    settingsWindow.webContents.send("settingsData", databaseManager.userSettings);
  });
}

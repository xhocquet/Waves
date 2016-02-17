'use strict';

const electron = require('electron');
const ipcMain = electron.ipcMain;
const app = electron.app;
const fs = require('graceful-fs')
const async = require('async');
const pathTools = require('path');
const BrowserWindow = electron.BrowserWindow;

const MetaData = require('musicmetadata');
const Datastore = require('nedb');
const db = {};
db.songs =  new Datastore({ filename: 'data/songs.json', autoload: true });
db.songs.persistence.setAutocompactionInterval(5000);
db.songs.ensureIndex({ fieldName: 'path', unique: true}, function(err) {
  console.log("Attempted to add duplicate file: ", err);
});
const trackDataWorker = async.queue(function (file, callback) {
  console.log("Worker working on ", file.path);
  createTrackData(file.path, callback);
}, 5);
trackDataWorker.drain = function() {
  console.log("All items have been processed");
};

let playerWindow;

function createWindow () {
  playerWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    center: true,
    title: "Waves",
    autoHideMenuBar: true,
    minHeight: 500,
    minWidth: 500,
  });
  // playerWindow.toggleDevTools();

  playerWindow.on('closed', function() {
    playerWindow = null;
  });

  // To-be generic library search function, parse options to query
  ipcMain.on('getListData', function(event, options) {
    db.songs.find({}).sort({artist: 1}).exec(function(err, docs) {
      if (!err) {
        event.sender.send("listData", docs);
      }
    });
  });

  // Generate library from renderer command.
  ipcMain.on('generateLibrary', function(event, options) {
    generateLibrary("D:/Music/Beirut/");
    db.songs.persistence.compactDatafile();
    // console.log("Generated.");
  });

  playerWindow.webContents.on('did-finish-load', function(e) {
    sendInitialLibrary();
  })
  playerWindow.loadURL('file://' + __dirname + '/views/index.html');
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

function generateLibrary(path) {
  if (!fs.existsSync(path)) {
    console.log(path ,"' does not exist.");
    return;
  }

  let items = fs.readdirSync(path);
  for (let i = 0; i < items.length; i++) {
    console.log(items[i]);
    let curFilePath = pathTools.join(path, items[i]);
    console.log(curFilePath);
    let curFileStats = fs.lstatSync(curFilePath);
    if (curFileStats.isDirectory()) {
      console.log("Going into directory: ", curFilePath);
      generateLibrary(curFilePath);
    } else if (pathTools.extname(curFilePath) === ".mp3") {
      trackDataWorker.push({path: curFilePath}, function(err) {
        console.log('Processed ', curFilePath);
        return;
      });
    }
  }
};

function createTrackData(filePath, callback) {
  let fileStream = fs.createReadStream(filePath);
  MetaData(fileStream, function(err, metaData) {
    metaData.path = filePath;
    metaData.artist = metaData.artist[0];
    metaData.picture = ""; // picture data is huge
    db.songs.insert(metaData, function(err, newDoc) {
      if (!err) {
        console.log("Inserted: " + newDoc.artist[0] + " - " + newDoc.title);
        fileStream ? fileStream.destroy() : null;
        callback();
      }
    });
  });
}

function sendInitialLibrary() {
  db.songs.find({}).sort({artist: 1}).exec(function(err, docs) {
    if (!err) {
      playerWindow.webContents.send("listData", docs);
    }
  });
}

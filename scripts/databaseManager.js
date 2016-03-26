'use strict';

var databaseManager = function() {
  var self = this;

  const app = require('electron').app;

  const MetaData = require('musicmetadata');
  const Datastore = require('nedb');

  const async = require('async');
  const fs = require('graceful-fs');
  const pathTools = require('path');

  let db = {};
  let DEFAULT_SORT = {
    'albumartist': 1,
    'album': 1,
    'track.no': 1
  };
  self.libraryData = '';
  self.userSettings = '';

  db.libraryData =  new Datastore({ filename: './data/libraryData.json', autoload: true });
  db.settings =  new Datastore({ filename: './data/settings.json', autoload: true , corruptAlertThreshold: 1});
  // db.settings.insert({
  //   importFolders: ["D:/Music"],
  //   processTrackImages: false,
  //   minimizeOnClose: true,
  //   playPauseHotkey: "Ctrl+Shift+Up",
  //   previousTrackHotkey: "Ctrl+Shift+Left",
  //   nextTrackHotkey: "Ctrl+Shift+Right"
  // });
  db.songs =  new Datastore({ filename: './data/songs.json', autoload: true });

  db.songs.persistence.setAutocompactionInterval(10000);

  db.songs.ensureIndex({ fieldName: 'path', unique: true}, function(err) {
    if (err) {
      console.log("Attempted to add duplicate file: ", err);
    }
  });

  let trackDataWorker = async.queue(function (file, callback) {
    console.log("Worker working on ", file.path);
    self.createTrackData(file.path, callback);
  }, 5);

  trackDataWorker.drain = function() {
    self.saveLibraryData();
    app.sendLibrary();
    console.log("All tracks have been processed");
  };

  // Returns the specified tracks with options.
  self.queryLibrary = function(options, callback) {
    if (options.page > -1) {
      db.songs.find({}).sort(DEFAULT_SORT).skip(100 * options.page).limit(100).exec(function(err, docs) {
        if (!err) {
          callback(docs);
        } else {
          callback(err);
        }
      });
    } else if (!options.search) {
      db.songs.find({}).sort(DEFAULT_SORT).exec(function(err, docs) {
        if (!err) {
          callback(docs);
        } else {
          callback(err);
        }
      });
    } else {
      let regexValue = new RegExp(options.search, 'i');
      db.songs.find({ title: { $regex: regexValue}}).sort({artist: 1}).exec(function(err, docs) {
        if (!err) {
          callback(docs);
        } else {
          callback(err);
        }
      });
    }
  }

  // Returns the single record in the settings db, the user's settings.
  self.loadSettings = function(callback) {
    db.settings.find({ settingName: 'user' }, function( err, docs) {
      self.userSettings = docs[0];
      callback();
    });
  }

  // Save settings to db
  self.saveSettings = function(settings, callback) {
    db.settings.remove({settingName: 'user'}, { multi: true }, function(err, numRemoved) {
      if (err) {
        callback(err);
      }
    })
    db.settings.insert(settings, function(err, newDoc) {
      if (err) {
        callback(err);
      } else {
        db.settings.persistence.compactDatafile();
        self.userSettings = newDoc; // Update usersettings so it stays up to date.
        callback("Successfully saved settings");
      }
    })
  }

  // Returns the single record in the libraryDataDB, the user's library data
  self.loadLibraryData = function() {
    db.libraryData.find({settingName: 'user'}, function( err, docs) {
      self.libraryData = docs[0];
    })
  }

  // Save library data to db
  self.saveLibraryData = function() {
    db.libraryData.remove({settingName: 'user'}, { multi: true }, function(err, numRemoved) {
      if (err) {
        console.log(err);
      }
    })
    db.libraryData.insert(self.libraryData, function(err, newDoc) {
      if (err) {
        console.log(err);
      } else {
        db.libraryData.persistence.compactDatafile();
        self.libraryData = newDoc; // Update libraryData so it stays up to date.
        console.log("Successfully saved libraryData");
      }
    })
  }

  // Iterate folders and push filepaths to track data workers
  self.generateLibrary = function(path) {
    if (!fs.existsSync(path)) {
      console.log(path ," does not exist.");
      return;
    }
    // Dragging in a single file
    if (pathTools.extname(path) === ".mp3") {
      trackDataWorker.push({path: path}, function(err) {
        if (!err) {
          console.log('Processed ', path);
        } else {
          console.log(err);
        }
        return;
      });
      return;
    }

    let items = fs.readdirSync(path);
    for (let i = 0; i < items.length; i++) {
      let curFilePath = pathTools.join(path, items[i]);
      let curFileStats = fs.lstatSync(curFilePath);
      if (curFileStats.isDirectory()) {
        self.generateLibrary(curFilePath);
      } else if (pathTools.extname(curFilePath) === ".mp3") {
        trackDataWorker.push({path: curFilePath}, function(err) {
          if (!err) {
            console.log('Processed ', curFilePath);
          } else {
            console.log(err);
          }
          return;
        });
      }
    }
  }

  // Calls generateLibrary on all the folders in userSettings.importFolders
  self.generateLibraryFromSettings = function() {
    self.userSettings.importFolders.forEach(function(element, index, array) {
      self.generateLibrary(element);
    });
  }

  self.createTrackData = function(filePath, callback) {
    let fileStream = fs.createReadStream(filePath);
    MetaData(fileStream, { duration: true }, function(err, metaData) {
      metaData.path = filePath;
      metaData.artist = metaData.artist[0];
      metaData.albumartist = metaData.albumartist[0];

      if (self.libraryData.artists.indexOf(metaData.artist) < 0) {
        self.libraryData.artists.push(metaData.artist);
      }
      if (self.libraryData.albums.indexOf(metaData.album) < 0) {
        self.libraryData.albums.push(metaData.album);
      }

      let coverImage = metaData.picture.data;
      metaData.picture = self.userSettings.processTrackImages ? metaData.picture  : '';
      db.songs.insert(metaData, function(err, newDoc) {
        if (!err) {
          console.log("Inserted: " + newDoc.artist + " - " + newDoc.title);
          fileStream ? fileStream.destroy() : null;
          callback();
        } else {
          console.log("Error inserting: " + err);
          callback();
        }
      });
    });
  }
}

module.exports = databaseManager;

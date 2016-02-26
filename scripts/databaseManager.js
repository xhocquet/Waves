'use strict';

var databaseManager = function() {
  var self = this;

  const MetaData = require('musicmetadata');
  const Datastore = require('nedb');

  const async = require('async');
  const fs = require('graceful-fs');
  const pathTools = require('path');

  let db = {};
  let DEFAULT_SORT = {
    artist: 1,
    album: 1
  };
  let userSettings = '';

  db.settings =  new Datastore({ filename: './data/settings.json', autoload: true });
  db.songs =  new Datastore({ filename: './data/songs.json', autoload: true });

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
  self.getSettings = function(callback) {
    db.settings.find({ settingName: 'user' }, function( err, docs) {
      userSettings = docs[0];
      callback(docs[0]);
    })
  }

  // Save settings to db, just replace the file
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
        userSettings = newDoc; // Update usersettings so they're up to date
        callback("Successfully saved settings");
      }
    })
  }

  self.generateLibrary = function(path) {
    if (!fs.existsSync(path)) {
      console.log(path ,"' does not exist.");
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

    // db.songs.persistence.compactDatafile();
  }

  self.createTrackData = function(filePath, callback) {
    let fileStream = fs.createReadStream(filePath);
    MetaData(fileStream, { duration: true }, function(err, metaData) {
      metaData.path = filePath;
      metaData.artist = metaData.artist[0];
      metaData.picture = userSettings.processTrackImages ? metaData.picture  : '';
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

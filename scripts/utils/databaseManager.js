const app = require('electron').app;

const MetaData = require('musicmetadata');
const Datastore = require('nedb');

const async = require('async');
const fs = require('graceful-fs');
const pathTools = require('path');

class databaseManager {
  constructor() {
    this.DEFAULT_SORT = {
      'albumArtist': 1,
      'album': 1,
      'track.no': 1,
      'artist': 1
    };

    this.trackDataWorker = async.queue(function (path, callback) {
      console.log("Worker processing data for ", path);
      self.createTrackData(path, callback);
    }, 5);

    this.libraryDataCleaner = async.queue(function(data, callback) {
      console.log("Worker cleaning library data for " + data.value + " on " + data.index);
      self.confirmLibraryData(data.index, data.value, callback);
    }, 1);

    this.trackDataWorker.drain = function() {
      self.saveLibraryData();
      app.afterNewLibraryData();
      console.log("All tracks in the queue have been processed");
    };

    this.libraryDataCleaner.drain = function() {
      self.saveLibraryData();
      app.afterNewLibraryData();
      console.log("Library data is squeaky clean!");
    };
  }

  initializeDatabases() {
    this.libraryData = '';
    this.userSettings = '';

    this.db = {};
    this.db.libraryData =  new Datastore({ filename: './data/libraryData.json', autoload: true });
    this.db.settings =  new Datastore({ filename: './data/settings.json', autoload: true});
    this.db.songs =  new Datastore({ filename: './data/songs.json', autoload: true });

    this.db.songs.persistence.setAutocompactionInterval(10000);

    this.db.songs.ensureIndex({ fieldName: 'path', unique: true}, function(err) {
      if (err) {
        console.log("Attempted to add duplicate file: ", err);
      }
    });
  }

  // Returns the specified tracks with options.
  queryLibrary(options, callback) {
    if (options.artist) {
      let regexValue = new RegExp(options.artist, 'i');
      this.db.songs.find({ artist: { $regex: regexValue }}).sort(this.DEFAULT_SORT).exec(function(err, docs) {
        if (!err) {
          callback(docs);
        } else {
          callback(err);
        }
      });
    } else if (options.searchAll) {
      let searchTerm = new RegExp(options.searchAll, 'i');
      this.db.songs.find({ $or: [{ title: { $regex: searchTerm } },{ albumArtist: { $regex: searchTerm } },{ album: { $regex: searchTerm } }] }).sort(this.DEFAULT_SORT).exec(function(err, docs) {
        if (!err) {
          callback(docs);
        } else {
          console.log(err)
          callback(err);
        }
      });
    } else if (!options.search) {
      this.db.songs.find({}).sort(this.DEFAULT_SORT).exec(function(err, docs) {
        if (!err) {
          callback(docs);
        } else {
          callback(err);
        }
      });
    } else {
      let regexValue = new RegExp(options.search, 'i');
      this.db.songs.find({ title: { $regex: regexValue}}).sort({artist: 1}).exec(function(err, docs) {
        if (!err) {
          callback(docs);
        } else {
          callback(err);
        }
      });
    }
  }

  // First time user settings setup
  setupInitialSettings(callback) {
    let self = this;
    this.db.settings.insert({
      settingName: 'user',
      importFolders: [],
      minimizeOnClose: false,
      nextTrackHotkey: null,
      previousTrackHotkey: null,
      playPauseHotkey: null,
      volumeUpHotkey: null,
      volumeDownHotkey: null,
      volumeMuteHotkey: null
    }, function(err, newDoc) {
      if (!err) {
        self.userSettings = newDoc;
        callback();
      }
    });
  }

  // Returns the single record in the settings db, the user's settings.
  loadSettings(callback) {
    let self = this;
    this.db.settings.find({ settingName: 'user' }, function( err, docs) {
      if (docs.length === 0) {
        self.setupInitialSettings(callback);
      } else {
        self.userSettings = docs[0];
        callback();
      }
    });
  }

  // Save settings to db
  // TODO: Replace with upsert
  saveSettings(settings, callback) {
    let self = this;
    this.db.settings.remove({settingName: 'user'}, { multi: true }, function(err, numRemoved) {
      if (err) {
        callback(err);
      }
    });

    this.db.settings.insert(settings, function(err, newDoc) {
      if (err) {
        callback(err);
      } else {
        self.db.settings.persistence.compactDatafile();
        self.userSettings = newDoc; // Update usersettings so it stays up to date.
        callback("SUCCESS");
      }
    });
  }

  // Returns the single record in the libraryDataDB, the user's library data
  loadLibraryData(callback) {
    let self = this;
    this.db.libraryData.find({settingName: 'user'}, function( err, docs) {
      if (docs.length === 0) {
        self.setupInitialLibraryData(callback);
      } else {
        self.libraryData = docs[0];
        callback();
      }
    });
  }

  // First time user library data setup
  setupInitialLibraryData(callback) {
    let self = this;
    this.db.libraryData.insert({
      settingName: 'user',
      artists: [],
      albumArtists: [],
      albums: []
    }, function(err, newDoc) {
      if (!err) {
        self.libraryData = newDoc;
        callback();
      }
    });
  }

  // Save library data to db
  saveLibraryData() {
    let self = this;
    this.db.libraryData.remove({settingName: 'user'}, { multi: true }, function(err, numRemoved) {
      if (err) {
        console.log(err);
      }
    })
    this.db.libraryData.insert(self.libraryData, function(err, newDoc) {
      if (err) {
        console.log(err);
      } else {
        self.db.libraryData.persistence.compactDatafile();
        console.log("Successfully saved libraryData");
      }
    })
  }

  // Iterate folders and push filepaths to track data workers
  generateLibrary(path) {
    let self = this;
    if (!fs.existsSync(path)) {
      console.log(path ," does not exist.");
      return;
    }
    // Dragging in a single file
    if (pathTools.extname(path) === ".mp3") {
      this.trackDataWorker.push(path, function(err) {
        if (!err) {
          console.log('Processed ', path);
        } else {
          console.log(err);
        }
      });
      return;
    }

    let items = fs.readdirSync(path);
    for (let i = 0; i < items.length; i++) {
      let curFilePath = pathTools.join(path, items[i]);
      let curFileStats = fs.lstatSync(curFilePath);
      if (curFileStats.isDirectory()) {
        this.generateLibrary(curFilePath);
      } else if (pathTools.extname(curFilePath) === ".mp3") {
        this.trackDataWorker.push(curFilePath, function(err) {
          if (!err) {
            console.log('Processed ', curFilePath);
          } else {
            console.log(err);
          }
        });
      }
    }
  }

  // Calls generateLibrary on all the folders in userSettings.importFolders
  generateLibraryFromSettings() {
    let self = this;
    this.userSettings.importFolders.forEach(function(element, index, array) {
      self.generateLibrary(element);
    });
  }

  // Remove the track and update library data
  deleteTrack(trackId) {
    let self = this;
    this.db.songs.find({_id: trackId}, function( err, docs) {
      if (docs.length === 0) {
        return;
      } else {
        let trackToRemove = docs[0];

        self.db.songs.remove({ _id: trackToRemove._id },{}, function (err, numRemoved) {
          if (!err && numRemoved === 1) {
            console.log(numRemoved + ' record removed, updating library data');

            self.libraryDataCleaner.push({ index: 'artists', value: trackToRemove.artist }, function(err) {
              if (!err) {
                console.log('Removed ' + trackToRemove.artist + ' from artists.');
              } else {
                console.log(err);
              }
            });

            self.libraryDataCleaner.push({ index: 'albumArtists', value: trackToRemove.albumArtist }, function(err) {
              if (!err) {
                console.log('Removed ' + trackToRemove.albumArtist + ' from album artists.');
              } else {
                console.log(err);
              }
            });

            self.libraryDataCleaner.push({ index: 'albums', value: trackToRemove.album }, function(err) {
              if (!err) {
                console.log('Removed ' + trackToRemove.album + ' from albums.');
              } else {
                console.log(err);
              }
            });
          }
        });
      }
    });
  }

  // Check type and value of library data to ensure it still exists in the library.
  // If not, remove from library data. Used in a worker queue because of DB operations.
  confirmLibraryData(index, value, callback) {
    let self = this;
    // No empty values, so we can skip the update
    if (value.length === 0) {
      callback();
      return;
    }
    // A little abstraction to use a variable as a hash index
    let dbIndex = index.slice(0, -1);
    let search = {}
    search[dbIndex] = value;
    
    this.db.songs.find(search, function(err, docs) {
      if (docs.length > 0) {
        console.log(value + ' still present, keeping in library data');
        callback();
      } else {
        console.log('Last instance of ' + value + ", removing from library data.");
        let dataIndex = self.libraryData[index].indexOf(value);
        if (dataIndex > -1) {
          self.libraryData[index].splice(dataIndex, 1);
          callback();
        }
      }
    });
  }

  createTrackData(filePath, callback) {
    let self = this;
    let fileStream = fs.createReadStream(filePath);
    MetaData(fileStream, { duration: true }, function(err, metaData) {
      let songData = {};

      songData.path = filePath;
      songData.title = metaData.title || "";
      songData.artist = metaData.artist[0] || "";
      songData.albumArtist = metaData.albumartist[0] || "";
      songData.album = metaData.album || "";
      songData.year = metaData.year || "";
      songData.track = metaData.track || "";
      songData.genre = metaData.genre || "";
      songData.disk = metaData.disk || "";
      songData.duration = metaData.duration || "";

      // Update library data, don't save empty fields
      self.db.songs.insert(songData, function(err, newDoc) {
        if (!err) {
          if (self.libraryData.artists.indexOf(songData.artist) < 0 && songData.artist.length > 0) {
            self.libraryData.artists.push(songData.artist);
          }
          if (self.libraryData.albumArtists.indexOf(songData.albumArtist) < 0 && songData.albumArtist.length > 0) {
            self.libraryData.albumArtists.push(songData.albumArtist);
          }
          if (self.libraryData.albums.indexOf(songData.album) < 0 && songData.album.length > 0) {
            self.libraryData.albums.push(songData.album);
          }

          console.log("Inserted: " + newDoc.artist + " - " + newDoc.title);
          fileStream ? fileStream.destroy() : null;
          callback();
        } else {
          console.log("Error inserting: " + err);
          fileStream ? fileStream.destroy() : null;
          callback();
        }
      });
    });
  }
}

module.exports = databaseManager;

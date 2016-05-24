const app = require('electron').app;

const MetaData = require('musicmetadata');
const Datastore = require('nedb');

const async = require('async');
const fs = require('graceful-fs');
const pathTools = require('path');

class databaseManager {
  constructor() {
    let self = this;
    this.DEFAULT_SORT = {
      'albumArtist': 1,
      'album': 1,
      'track.no': 1,
      'artist': 1
    };

    this.newTrackProcessor = async.queue(function (path, callback) {
      console.log("Worker processing data for ", path);
      self.processNewTrack(path, callback);
    }, 5);

    this.libraryDataCleaner = async.queue(function(data, callback) {
      console.log("Worker cleaning library data for " + data.value + " on " + data.index);
      self.confirmLibraryData(data.index, data.value, callback);
    }, 1);

    this.newTrackProcessor.drain = function() {
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
    this.playlists = {};

    this.db = {};
    this.db.libraryData =  new Datastore({ filename: './data/libraryData.json', autoload: true });
    this.db.settings =  new Datastore({ filename: './data/settings.json', autoload: true});
    this.db.tracks =  new Datastore({ filename: './data/songs.json', autoload: true });
    this.db.playlists = new Datastore({ filename: './data/playlists.json', autoload: true });

    this.db.tracks.persistence.setAutocompactionInterval(10000);

    this.db.tracks.ensureIndex({ fieldName: 'path', unique: true}, function(err) {
      if (err) {
        console.log("Attempted to add duplicate file: ", err);
      }
    });

    this.db.playlists.ensureIndex({ fieldName: 'name', unique: true}, function(err) {
      if (err) {
        console.log("Attempted to create a duplicate playlist: ", err);
      }
    });
  }

  // Returns the specified tracks with options.
  queryLibrary(options, callback) {
    if (options.artist) {
      let regexValue = new RegExp(options.artist, 'i');
      this.db.tracks.find({ artist: { $regex: regexValue }}).sort(this.DEFAULT_SORT).exec(function(err, docs) {
        if (!err) {
          callback(docs);
        } else {
          callback(err);
        }
      });
    } else if (options.album) {
      let regexValue = new RegExp(options.album, 'i');
      this.db.tracks.find({ album: { $regex: regexValue }}).sort(this.DEFAULT_SORT).exec(function(err, docs) {
        if (!err) {
          callback(docs);
        } else {
          callback(err);
        }
      });
    } else if (options.albumArtist) {
      let regexValue = new RegExp(options.albumArtist, 'i');
      this.db.tracks.find({ albumArtist: { $regex: regexValue }}).sort(this.DEFAULT_SORT).exec(function(err, docs) {
        if (!err) {
          callback(docs);
        } else {
          callback(err);
        }
      });
    // Return playlist tracks
    } else if (options.playlists) {
      let self = this;
      this.db.playlists.find({name: options.playlists}).exec(function(err, docs) {
        if (!err) {
          let trackIds = docs[0].tracks;
          self.db.tracks.find( {_id: { $in: trackIds} } ).exec(function(err, docs) {
            callback(err || docs);
          });
        } else {
          callback(err);
        }
      })
    } else if (options.searchAll) {
      let searchTerm = new RegExp(options.searchAll, 'i');
      this.db.tracks.find({ $or: [{ title: { $regex: searchTerm } },{ albumArtist: { $regex: searchTerm } },{ album: { $regex: searchTerm } }] }).sort(this.DEFAULT_SORT).exec(function(err, docs) {
        if (!err) {
          callback(docs);
        } else {
          callback(err);
        }
      });
    } else if (!options.search) {
      this.db.tracks.find({}).sort(this.DEFAULT_SORT).exec(function(err, docs) {
        if (!err) {
          callback(docs);
        } else {
          callback(err);
        }
      });
    } else {
      let regexValue = new RegExp(options.search, 'i');
      this.db.tracks.find({ title: { $regex: regexValue}}).sort({artist: 1}).exec(function(err, docs) {
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
      currentVolume: 1.0,
      hotkeys: {
        nextTrack: null,
        previousTrack: null,
        playPause: null,
        volumeUp: null,
        volumeDown: null,
        volumeMute: null
      }
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
      albums: [],
      totalDuration: 0,
      totalItems: 0
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
    });

    self.libraryData.artists.sort();
    self.libraryData.albums.sort();
    self.libraryData.albumArtists.sort();

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
      this.newTrackProcessor.push(path, function(err) {
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
        this.newTrackProcessor.push(curFilePath, function(err) {
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
    this.db.tracks.find({_id: trackId}, function( err, docs) {
      if (docs.length === 0) {
        return;
      } else {
        let trackToRemove = docs[0];

        self.db.tracks.remove({ _id: trackToRemove._id },{}, function (err, numRemoved) {
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

            self.libraryData.totalItems -= 1;
            self.libraryData.totalDuration -= trackToRemove.duration;
          }
        });
      }
    });
  }

  loadPlaylists(callback) {
    let self = this;
    this.db.playlists.find({}).sort({ name: 1 }).exec(function(err, playlists) {
      if (!err) {
        self.playlists = playlists.map(playlist => playlist.name);
        callback();
      }
    });
  }

  // Create playlist
  createPlaylist(name) {
    console.log('creating playlist')
    let self = this;
    this.db.playlists.insert({
      name: 'Test1',
      tracks: [],
      count: 0,
      duration: 0
    }, function(err, newDoc) {
      if (!err) {
        self.playlists.push(newDoc.name);
      }
    })
  }

  // Add track to playlist, as well as update metadata
  addToPlaylist(track, playlistName) {
    let self = this;
    // If playlist exists
    if(this.playlists.indexOf(playlistName) > -1) {
      this.db.playlists.find({ name: playlistName }).exec(function(err, docs) {
        if (!err) {
          let newPlaylist = docs[0];
          newPlaylist.tracks.push(track._id);
          newPlaylist.count++;
          newPlaylist.duration += track.duration;
          self.db.playlists.update({ name: playlistName }, newPlaylist, {}, function(err) {
            if (!err) {
              self.db.playlists.persistence.compactDatafile();
              console.log("Track " + track.title + " added to playlist " + playlistName);
            }
          });
        }
      });
    }
  }

  // Fetch playlist data and remove track, as well as update metadata
  removeFromPlaylist(track, playlistName) {
    let self = this;
    // If playlist exists
    if(this.playlists.indexOf(playlistName) > -1) {
      this.db.playlists.find({ name: playlistName }).exec(function(err, docs) {
        if (!err) {
          let newPlaylist = docs[0];
          let trackIndex = newPlaylist.indexOf(track._id);
          if (trackIndex < 0) return;
          newPlaylist.splice(trackIndex,1);
          newPlaylist.count--;
          newPlaylist.duration -= track.duration;
          self.db.playlists.update({ name: playlistName }, newPlaylist, {}, function(err) {
            if (!err) {
              self.db.playlists.persistence.compactDatafile();
              console.log("Track " + track.title + " removed from playlist " + playlistName);
            }
          });
        }
      });
    }
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
    
    this.db.tracks.find(search, function(err, docs) {
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

  processNewTrack(filePath, callback) {
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
      self.db.tracks.insert(songData, function(err, newDoc) {
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
          self.libraryData.totalItems += 1;
          self.libraryData.totalDuration += songData.duration;

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

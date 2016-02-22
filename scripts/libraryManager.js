'use strict';

var libraryManager = function() {
  var self = this;
  const fs = require('graceful-fs')
  const async = require('async');
  const pathTools = require('path');
  const MetaData = require('musicmetadata');
  const Datastore = require('nedb');
  let db = {};

  db.songs =  new Datastore({ filename: './data/songs.json', autoload: true });
  db.songs.persistence.setAutocompactionInterval(5000);
  db.songs.ensureIndex({ fieldName: 'path', unique: true}, function(err) {
    if (err) {
      console.log("Attempted to add duplicate file: ", err);
    }
  });
  db.songs.ensureIndex({ fieldName: 'title', sparse: true}, function(err) {
    if (err) {git
      console.log(err);
    }
  });
  let trackDataWorker = async.queue(function (file, callback) {
    console.log("Worker working on ", file.path);
    console.log(self)
    self.createTrackData(file.path, callback);
  }, 5);

  trackDataWorker.drain = function() {
    console.log("All items have been processed");
  };

  self.queryLibrary = function(options, callback) {
    if (!options.search) {
      db.songs.find({}).sort({artist: 1, album: 1}).exec(function(err, docs) {
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

  // self.generateLibrary = function(path) {
  //   if (!fs.existsSync(path)) {
  //     console.log(path ,"' does not exist.");
  //     return;
  //   }

  //   let items = fs.readdirSync(path);
  //   for (let i = 0; i < items.length; i++) {
  //     let curFilePath = pathTools.join(path, items[i]);
  //     let curFileStats = fs.lstatSync(curFilePath);
  //     if (curFileStats.isDirectory()) {
  //       self.generateLibrary(curFilePath);
  //     } else if (pathTools.extname(curFilePath) === ".mp3") {
  //       trackDataWorker.push({path: curFilePath}, function(err) {
  //         console.log('Processed ', curFilePath);
  //         return;
  //       });
  //     }
  //   }
  // }

  // self.createTrackData = function(filePath, callback) {
  //   let fileStream = fs.createReadStream(filePath);
  //   MetaData(fileStream, { duration: true }, function(err, metaData) {
  //     metaData.path = filePath;
  //     metaData.artist = metaData.artist[0];
  //     metaData.picture = ""; // picture data is huge
  //     db.songs.insert(metaData, function(err, newDoc) {
  //       if (!err) {
  //         console.log("Inserted: " + newDoc.artist + " - " + newDoc.title);
  //         fileStream ? fileStream.destroy() : null;
  //         callback();
  //       }
  //     });
  //   });
  // }
}

module.exports = libraryManager;

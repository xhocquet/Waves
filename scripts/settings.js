'use strict';
const ipcRenderer = require('electron').ipcRenderer;
// const databaseManager = require('databaseManager.js');

let userSettings;
let curWindow = this;
let importFolderTextarea = document.getElementsByClassName("importFolders")[0];
let processImagesCheckbox = document.getElementsByClassName("processImages")[0];
let minimizeOnCloseCheckbox = document.getElementsByClassName("minimizeOnClose")[0];
let hotkeyInputs = document.querySelectorAll(".hotkeyInput");
let playPauseInput = document.getElementsByClassName("playPauseInput")[0];
let previousTrackInput = document.getElementsByClassName("previousTrackInput")[0];
let nextTrackInput = document.getElementsByClassName("nextTrackInput")[0];

// When you receive settings data, populate the form
ipcRenderer.on('settingsData', function(event, response) {
  delete response._id
  userSettings = response;
  fillInCurrentSettings();
});

// Reponse from saving settings
ipcRenderer.on('saveResponse', function(event, response) {
  if (response === 'Success') {
    console.log("SUCCESS")
  } else {
    console.log(response);
  }
});

// Update import folders on keypress
importFolderTextarea.addEventListener("input", function() {
  userSettings.importFolders = importFolderTextarea.value.split('\n');
}, false);

processImagesCheckbox.addEventListener("click", function() {
  userSettings.processTrackImages = processImagesCheckbox.checked;
});

minimizeOnCloseCheckbox.addEventListener("click", function() {
  userSettings.minimizeOnClose = minimizeOnCloseCheckbox.checked;
});

playPauseInput.addEventListener("keydown", function(e) {
  e.preventDefault();
  var accelerator = eventToAcceleratorString(e);
  playPauseInput.value = accelerator;
  userSettings.playPauseHotkey = accelerator;
});

nextTrackInput.addEventListener("keydown", function(e) {
  e.preventDefault();
  var accelerator = eventToAcceleratorString(e);
  nextTrackInput.value = accelerator;
  userSettings.nextTrackHotkey = accelerator;
});

previousTrackInput.addEventListener("keydown", function(e) {
  e.preventDefault();
  var accelerator = eventToAcceleratorString(e);
  previousTrackInput.value = accelerator;
  userSettings.previousTrackHotkey = accelerator;
});

let eventToAcceleratorString = function(e) {
  var accelerator = "";
  e.ctrlKey ? accelerator += "Ctrl+" : null;
  e.shiftKey ? accelerator += "Shift+" : null;
  switch(e.keyCode) {
    case 38: 
      accelerator += "Up";
      break;
    case 40: 
      accelerator += "Down";
      break;
    case 37: 
      accelerator += "Left";
      break;
    case 39: 
      accelerator += "Right";
      break;
    default: 
      accelerator += String.fromCharCode(e.keyCode);
      break;
  }
  return accelerator;
}

// Send updated settings back to main for saving
let saveSettings = function() {
  ipcRenderer.send("saveSettings", { userSettings });
}

// Remote close window
let closeWindow = function() {
  ipcRenderer.send("closeSettings",{});
}

// Fill in forms with current values from file
let fillInCurrentSettings = function() {
  // Import folder list
  importFolderTextarea.value = '';
  userSettings.importFolders.forEach(function(folder, index, array) {
    if (index > 0) { importFolderTextarea.value += "\n"; };
    importFolderTextarea.value += (folder);
  })
  importFolderTextarea.focus();

  processImagesCheckbox.checked = userSettings.processTrackImages
  minimizeOnCloseCheckbox.checked = userSettings.minimizeOnClose

  playPauseInput.value = userSettings.playPauseHotkey;
  previousTrackInput.value = userSettings.previousTrackHotkey;
  nextTrackInput.value = userSettings.nextTrackHotkey;
}

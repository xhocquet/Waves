'use strict';
const ipcRenderer = require('electron').ipcRenderer;
let userSettings;
let curWindow = this;
let importFolderTextarea = document.getElementsByClassName("importFolders")[0];
let processImagesCheckbox = document.getElementsByClassName("processImages")[0];

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
})

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
}

let ipcRenderer = require('electron').ipcRenderer;
let asar = require('asar');
let async = require('async');

let userSettings;
const backupDirectory = __dirname + '/../backup/';
const dataDirectory = __dirname + '/../data/';
let optionTabs = document.querySelectorAll(".settingsTab");
let importFolderTextarea = document.getElementsByClassName("importFolders")[0];
let minimizeOnCloseCheckbox = document.getElementsByClassName("minimizeOnClose")[0];
let hotkeyInputs = document.querySelectorAll(".hotkeyInput");
let trackGroupingMethodSelect = document.getElementsByClassName("trackGroupingMethod")[0];
let exportLibraryButton = document.getElementById("exportLibraryButton");
let importLibraryButton = document.getElementById("importLibraryButton");
let saveButton = document.getElementsByClassName("saveButton")[0];
let closeButton = document.getElementsByClassName("closeButton")[0];

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

ipcRenderer.on('refreshedData', function(event, response) {
  delete response._id
  userSettings = response;
  fillInCurrentSettings();
})

for (let i = 0; i < optionTabs.length; i++) {
  optionTabs[i].addEventListener("click", function(event) {
    document.querySelector('.settingsTabSelected').classList.remove('settingsTabSelected');
    event.target.classList.add('settingsTabSelected');

    document.querySelector('.settingsTabContentsSelected').classList.remove('settingsTabContentsSelected');
    switch (event.target.innerHTML) {
      case 'General':
        document.querySelector('.generalSettings').classList.add('settingsTabContentsSelected');
        break;
      case 'Layout':
        document.querySelector('.layoutSettings').classList.add('settingsTabContentsSelected');
        break;
      case 'Library':
        document.querySelector('.librarySettings').classList.add('settingsTabContentsSelected');
        break;
      case 'Hotkeys':
        document.querySelector('.hotkeySettings').classList.add('settingsTabContentsSelected');
        break;
    }
  });
}


let exportLibraryHandler = function(e) {
  asar.createPackage(dataDirectory, backupDirectory + 'backup.wvs', function() {
    console.log('Saved to ' + backupDirectory + 'backup.wvs');
  });
}

let importLibraryHandler = function(e) {
  let backupPath = this.files[0].path;
  async.waterfall([
    async.asyncify(asar.extractAll(backupPath, dataDirectory)),
    ipcRenderer.send('importedData', {})
  ]);
}

// Save and close button listeners
saveButton.addEventListener("click", function() {
  saveSettings();
});

closeButton.addEventListener("click", function() {
  closeWindow();
})

// Update import folders on keypress
importFolderTextarea.addEventListener("input", function() {
  userSettings.importFolders = importFolderTextarea.value.split('\n');
}, false);

minimizeOnCloseCheckbox.addEventListener("click", function() {
  userSettings.minimizeOnClose = minimizeOnCloseCheckbox.checked;
});

for (let i = 0; i < hotkeyInputs.length; i++) {
  let currentInput = hotkeyInputs[i];
  let currentHotkey = currentInput.classList[1];
  currentInput.addEventListener("keydown", function(e) {
    e.preventDefault();
    let acceleratorString = eventToAcceleratorString(e);
    currentInput.value = acceleratorString;
    userSettings[currentHotkey] = acceleratorString;
  });
}

trackGroupingMethodSelect.addEventListener("change", function(e) {
  e.preventDefault();
  userSettings.trackGroupingMethod = trackGroupingMethodSelect.value;
});

exportLibraryButton.addEventListener("click", exportLibraryHandler, false);
importLibraryButton.addEventListener("change", importLibraryHandler, false);

let eventToAcceleratorString = function(e) {
  let accelerator = "";
  e.ctrlKey ? accelerator += "Ctrl+" : null;
  e.shiftKey ? accelerator += "Shift+" : null;
  e.altKey ? accelerator += "Alt+" : null;
  switch(e.keyCode) {
    case 8:
      accelerator += "BackSpace";
      break;
    case 32:
      accelerator += "Space";
      break;
    case 33:
      accelerator += "PageUp";
      break;
    case 34:
      accelerator += "PageDown";
      break;
    case 35:
      accelerator += "End";
      break;
    case 36:
      accelerator += "Home";
      break;
    case 37:  
      accelerator += "Left";
      break;
    case 38: 
      accelerator += "Up";
      break;
    case 39: 
      accelerator += "Right";
      break;
    case 40: 
      accelerator += "Down";
      break;
    case 45:
      accelerator += "Insert";
      break;
    case 46:
      accelerator += "Delete";
      break;
    case 112: 
      accelerator += "F1";
      break;
    case 113: 
      accelerator += "F2";
      break;
    case 114: 
      accelerator += "F3";
      break;
    case 115: 
      accelerator += "F4";
      break;
    case 116: 
      accelerator += "F5";
      break;
    case 117: 
      accelerator += "F6";
      break;
    case 118: 
      accelerator += "F7";
      break;
    case 119: 
      accelerator += "F8";
      break;
    case 120: 
      accelerator += "F9";
      break;
    case 121: 
      accelerator += "F10";
      break;
    case 122: 
      accelerator += "F11";
      break;
    case 123: 
      accelerator += "F12";
      break;
    default: 
      accelerator += String.fromCharCode(e.keyCode);
      break;
  }
  return accelerator;
}

// Send updated settings back to main for saving
let saveSettings = function() {
  ipcRenderer.send("saveSettings", userSettings);
}

// Remote close window
let closeWindow = function() {
  ipcRenderer.send("closeSettings",{});
}

let refreshDatabase = function() {
  ipcRenderer.send("refreshDatabase",{});
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

  minimizeOnCloseCheckbox.checked = userSettings.minimizeOnClose

  for (let i = 0; i < hotkeyInputs.length; i++) {
    let currentInput = hotkeyInputs[i];
    let currentHotkey = currentInput.classList[1];
    currentInput.value = userSettings[currentHotkey];
  }

  trackGroupingMethodSelect.value = userSettings.trackGroupingMethod;
}

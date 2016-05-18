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
let exportLibraryButton = document.querySelector("#exportLibraryButton");
let importLibraryButton = document.querySelector("#importLibraryButton");
let noticePopup = document.getElementsByClassName("noticePopup")[0];
let saveButton = document.getElementsByClassName("saveButton")[0];
let closeButton = document.getElementsByClassName("closeButton")[0];

setupRendererListeners();
setupInputListeners();

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

function setupRendererListeners() {
  // When you receive settings data, populate the form
  ipcRenderer.on('settingsData', function(event, response) {
    console.log('settingsData Event')
    delete response._id
    userSettings = response;
    fillInCurrentSettings();
  });

  // Reponse from saving settings
  ipcRenderer.on('saveResponse', function(event, response) {
    if (response === 'SUCCESS') {
      console.log('Successfully saved settings.');
      noticePopup.innerHTML = 'Successfully saved settings.';
      noticePopup.style.backgroundColor = 'green';
      noticePopup.classList.add('show');
      setTimeout(function() {
        noticePopup.classList.remove('show');
      }, 3000);
    } else {
      console.log(response);
      noticePopup.innerHTML = 'There was an error saving.';
      noticePopup.style.backgroundColor = 'red';
      noticePopup.classList.add('show');
      setTimeout(function() {
        noticePopup.classList.remove('show');
      }, 3000);
    }
  });
}

function setupInputListeners() {
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

  // Event listeners for all the hotkey inputs
  for (let i = 0; i < hotkeyInputs.length; i++) {
    let currentInput = hotkeyInputs[i];
    let currentHotkey = currentInput.classList[1];
    currentInput.addEventListener("keydown", function(e) {
      e.preventDefault();
      let acceleratorString = eventToAcceleratorString(e);
      currentInput.value = acceleratorString;
      userSettings.hotkeys[currentHotkey] = acceleratorString;
    });
  }

  trackGroupingMethodSelect.addEventListener("change", function(e) {
    e.preventDefault();
    userSettings.trackGroupingMethod = trackGroupingMethodSelect.value;
  });

  exportLibraryButton.addEventListener("click", exportLibraryHandler, false);
  importLibraryButton.addEventListener("change", importLibraryHandler, false);
}

// TODO: Let the user select where to save it
function exportLibraryHandler(e) {
  asar.createPackage(dataDirectory, backupDirectory + 'backup.wvs', function() {
    console.log('Saved to ' + backupDirectory + 'backup.wvs');
  });
}

function importLibraryHandler(e) {
  let backupPath = this.files[0].path;
  async.waterfall([
    async.asyncify(asar.extractAll(backupPath, dataDirectory)),
    ipcRenderer.send('importedData', {})
  ]);
}

function eventToAcceleratorString(e) {
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
function saveSettings() {
  ipcRenderer.send("saveSettings", userSettings);
}

// Remote close window
function closeWindow() {
  ipcRenderer.send("closeSettings",{});
}

function refreshDatabase() {
  ipcRenderer.send("refreshDatabase",{});
}


// Fill in forms with current values from file
function fillInCurrentSettings() {
  // Import folder list
  importFolderTextarea.value = '';

  userSettings.importFolders.forEach(function(folder, index, array) {
    if (index > 0) { importFolderTextarea.value += "\n"; };
    importFolderTextarea.value += folder;
  });
  importFolderTextarea.focus();

  minimizeOnCloseCheckbox.checked = userSettings.minimizeOnClose

  for (let i = 0; i < hotkeyInputs.length; i++) {
    let currentInput = hotkeyInputs[i];
    let currentHotkey = currentInput.classList[1];
    currentInput.value = userSettings.hotkeys[currentHotkey];
  }

  trackGroupingMethodSelect.value = userSettings.trackGroupingMethod;
}

let ipcRenderer = require('electron').ipcRenderer;

let userSettings;
let optionTabs = document.querySelectorAll(".settingsTab");
let importFolderTextarea = document.getElementsByClassName("importFolders")[0];
let minimizeOnCloseCheckbox = document.getElementsByClassName("minimizeOnClose")[0];
let hotkeyInputs = document.querySelectorAll(".hotkeyInput");
let playPauseInput = document.getElementsByClassName("playPauseInput")[0];
let previousTrackInput = document.getElementsByClassName("previousTrackInput")[0];
let nextTrackInput = document.getElementsByClassName("nextTrackInput")[0];

// When you receive settings data, populate the form
ipcRenderer.on('settingsData', function(event, response) {
  delete response._id
  userSettings = response;
  // fillInCurrentSettings();
});

// Reponse from saving settings
ipcRenderer.on('saveResponse', function(event, response) {
  if (response === 'Success') {
    console.log("SUCCESS")
  } else {
    console.log(response);
  }
});

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

// Update import folders on keypress
// importFolderTextarea.addEventListener("input", function() {
//   userSettings.importFolders = importFolderTextarea.value.split('\n');
// }, false);

// minimizeOnCloseCheckbox.addEventListener("click", function() {
//   userSettings.minimizeOnClose = minimizeOnCloseCheckbox.checked;
// });

// playPauseInput.addEventListener("keydown", function(e) {
//   e.preventDefault();
//   var accelerator = eventToAcceleratorString(e);
//   playPauseInput.value = accelerator;
//   userSettings.playPauseHotkey = accelerator;
// });

// nextTrackInput.addEventListener("keydown", function(e) {
//   e.preventDefault();
//   let accelerator = eventToAcceleratorString(e);
//   nextTrackInput.value = accelerator;
//   userSettings.nextTrackHotkey = accelerator;
// });

// previousTrackInput.addEventListener("keydown", function(e) {
//   e.preventDefault();
//   let accelerator = eventToAcceleratorString(e);
//   previousTrackInput.value = accelerator;
//   userSettings.previousTrackHotkey = accelerator;
// });

// TODO: Beef this up to support more keys
let eventToAcceleratorString = function(e) {
  let accelerator = "";
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

  minimizeOnCloseCheckbox.checked = userSettings.minimizeOnClose

  playPauseInput.value = userSettings.playPauseHotkey;
  previousTrackInput.value = userSettings.previousTrackHotkey;
  nextTrackInput.value = userSettings.nextTrackHotkey;
}

const ipcRenderer = require('electron').ipcRenderer;
const React = require('react');
const ExplorerList = require('./explorerList.jsx');
const AlbumArt = require('./albumArt.jsx');

let LeftSidebar = React.createClass({
  getInitialState: function() {
    return {
      nowPlaying: false,
      selected: this.props.selected,
      trackFilepath: "",
      artist: [],
      album: [],
      albumArtist: [],
      displayMethod: 'artist',
      playlists: []
    }
  },

  search:function(event) {
    let searchTerm = event.currentTarget.value;
      if (searchTerm === "") {
        ipcRenderer.send('getListData', {});
      } else {
        ipcRenderer.send('getListData', {
          searchAll: searchTerm
        });
      }
  },

  select: function(event) {
    event.currentTarget.select();
  },

  render: function() {
    return (
      <div className="fullHeightContainer">
        <div id="searchContainer">
          <input id="search" placeholder="Search..." onClick={this.select} onInput={this.search}></input>
        </div>
        <div id="explorerListContainer">
          <ExplorerList 
            playerWindow={this.props.playerWindow}
            musicPlayer={this.props.musicPlayer}
            artist={this.state.artist}
            album={this.state.album}
            albumArtist={this.state.albumArtist}
            displayMethod={this.state.displayMethod}
            playlists={this.state.playlists}
          />
        </div>
        <AlbumArt filePath={this.state.trackFilepath} />
      </div>
    );
  }
});

module.exports = LeftSidebar;

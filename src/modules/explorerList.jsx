const ipcRenderer = require('electron').ipcRenderer;
const React = require('react');
const ExplorerEntry = require('./explorerEntry.jsx');

let explorerList = React.createClass({
  getInitialState: function() {
    return {
      artist: [],
      album: [],
      albumArtist: [],
      displayMethod: 'artist',
      playlists: []
    }
  },

  componentWillReceiveProps : function(nextProps) {
    this.setState({
      artist: nextProps.artist,
      album: nextProps.album,
      albumArtist: nextProps.albumArtist,
      displayMethod: nextProps.displayMethod,
      playlists: nextProps.playlists
    });
  },

  showSelection: function(value, event) {
    let options = {};
    options[this.state.displayMethod] = value;

    if (value === "All") {
      ipcRenderer.send('getListData', {});
    } else {
      ipcRenderer.send('getListData', options);
    }
  },

  playSelection: function() {
    this.props.playerWindow.updateMusicPlayerData();
    this.props.musicPlayer.playSong(this.props.musicPlayer.ids[0]);
  },

  showArtists: function() {
    this.refs.explorerList.scrollTop = 0;
    document.querySelector('.explorerTabSelected').classList.remove('explorerTabSelected');
    this.refs['artist'].classList.add('explorerTabSelected');
    this.setState({
      displayMethod: 'artist'
    });
  },

  showAlbums: function() {
    this.refs.explorerList.scrollTop = 0;
    document.querySelector('.explorerTabSelected').classList.remove('explorerTabSelected');
    this.refs['album'].classList.add('explorerTabSelected');
    this.setState({
      displayMethod: 'album'
    });
  },

  showAlbumArtists: function() {
    this.refs.explorerList.scrollTop = 0;
    document.querySelector('.explorerTabSelected').classList.remove('explorerTabSelected');
    this.refs['albumArtist'].classList.add('explorerTabSelected');
    this.setState({
      displayMethod: 'albumArtist'
    });
  },

  showPlaylists: function() {
    this.refs.explorerList.scrollTop = 0;
    document.querySelector('.explorerTabSelected').classList.remove('explorerTabSelected');
    this.refs['playlists'].classList.add('explorerTabSelected');
    this.setState({
      displayMethod: 'playlists'
    });
  },

  getExplorerEntries: function() {
    let explorerEntries = [];
    let counter = 0;

    // 'All' Entry unless Playlist
    if (this.state.displayMethod != 'playlists') {
      explorerEntries.push(
        <ExplorerEntry
          rowClass={"explorerEntry"}
          key={1}
          onClick={this.showSelection}
          onDoubleClick={this.playSelection}
          value={"All"}
        />
      );
    }

    for (let i = 0; i < this.state[this.state.displayMethod].length; i++) {
      let rowClass = counter % 2 ? "explorerEntry" : "explorerEntryAlternate";
      if (this.state[this.state.displayMethod][i]) {
        counter++;
        explorerEntries.push(
          <ExplorerEntry
            rowClass={rowClass}
            key={"explorerList_"+this.state[this.state.displayMethod][i]}
            onClick={this.showSelection}
            onDoubleClick={this.playSelection}
            value={this.state[this.state.displayMethod][i]}
          />
        );
      }
    }
    return explorerEntries;
  },

  render: function() {
    if (this.state[this.state.displayMethod].length > 0) {
      let explorerEntries = this.getExplorerEntries();
      return (
        <div className="fullHeightContainer">
          <div className="explorerTabsContainer">
            <div className="explorerTab explorerTabSelected" onMouseDown={this.showArtists} ref="artist">Artist</div>
            <div className="explorerTab" onMouseDown={this.showAlbums} ref="album">Album</div>
            <div className="explorerTab" onMouseDown={this.showAlbumArtists} ref="albumArtist">Album Artist</div>
            <div className="explorerTab" onMouseDown={this.showPlaylists} ref="playlists">Playlists</div>
          </div>
          <div  className="explorerList" ref="explorerList">
            {explorerEntries}
          </div>
        </div>
      );
    } else {
      return (
        <div className="fullHeightContainer">
          <div className="explorerTabsContainer">
            <div className="explorerTab explorerTabSelected" onMouseDown={this.showArtists} ref="artist">Artist</div>
            <div className="explorerTab" onMouseDown={this.showAlbums} ref="album">Album</div>
            <div className="explorerTab" onMouseDown={this.showAlbumArtists} ref="albumArtist">Album Artist</div>
            <div className="explorerTab" onMouseDown={this.showPlaylists} ref="playlists">Playlists</div>
          </div>
          <div  className="explorerList explorerListEmpty">
            Add some tracks!
          </div>
        </div>
      );
    }
  }
});

module.exports = explorerList;

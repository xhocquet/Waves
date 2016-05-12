const ipcRenderer = require('electron').ipcRenderer;
const React = require('react');
const ArtistEntry = require('./explorerEntry.jsx');

let explorerList = React.createClass({
  getInitialState: function() {
    return {
      artist: [],
      album: [],
      albumArtist: [],
      displayMethod: 'artist'
    }
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
    this.setState({
      displayMethod: 'artist'
    });
  },

  showAlbums: function() {
    this.refs.explorerList.scrollTop = 0;
    this.setState({
      displayMethod: 'album'
    });
  },

  showAlbumArtists: function() {
    this.refs.explorerList.scrollTop = 0;
    this.setState({
      displayMethod: 'albumArtist'
    });
  },

  getExplorerEntries: function() {
    let explorerEntries = [];
    let counter = 0;

    // 'All' Entry
    explorerEntries.push(
      <ArtistEntry
        rowClass={"artistEntry"}
        key={1}
        onClick={this.showSelection}
        onDoubleClick={this.playSelection}
        value={"All"}
      />
    );

    for (let i = 0; i < this.state[this.state.displayMethod].length; i++) {
      let rowClass = counter % 2 ? "artistEntry" : "artistEntryAlternate";
      if (this.state[this.state.displayMethod][i]) {
        counter++;
        explorerEntries.push(
          <ArtistEntry
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
      let artistEntries = this.getExplorerEntries();
      return (
        <div className="randomAssContainer">
          <div className="explorerTabsContainer">
            <div className="explorerTab" onMouseDown={this.showArtists}>Artist</div>
            <div className="explorerTab" onMouseDown={this.showAlbums}>Album</div>
            <div className="explorerTab" onMouseDown={this.showAlbumArtists}>Album Artist</div>
          </div>
          <div  className="explorerList" ref="explorerList">
            {artistEntries}
          </div>
        </div>
      );
    } else {
      return (
        <div  className="explorerList explorerListEmpty">
          Add some tracks!
        </div>
      );
    }
  }
});

module.exports = explorerList;

const React = require('react');
const ArtistEntry = require('./explorerEntry.jsx');

let explorerList = React.createClass({
  getInitialState: function() {
    return {
      artists: [],
      albums: [],
      albumArtists: [],
      displayMethod: 'artists'
    }
  },

  clickHandler: function(artist, event) {
    this.props.onClick(artist, this.state.displayMethod, event);
  },

  doubleClickHandler: function() {
    this.props.playerWindow.updateMusicPlayerData();
    this.props.musicPlayer.playSong(this.props.musicPlayer.ids[0]);
  },

  showArtists: function() {
    this.setState({
      displayMethod: 'artists'
    });
  },

  showAlbums: function() {
    this.setState({
      displayMethod: 'albums'
    });
  },

  showAlbumArtists: function() {
    this.setState({
      displayMethod: 'albumArtists'
    });
  },

  getExplorerEntries: function() {
    let explorerEntries = [];
    let counter = 0;

    // All Artists entry
    explorerEntries.push(
      <ArtistEntry
        rowClass={"artistEntry"}
        key={1}
        onClick={this.clickHandler}
        onDoubleClick={this.doubleClickHandler}
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
            onClick={this.clickHandler}
            onDoubleClick={this.doubleClickHandler}
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
        <div>
          <div className="explorerTabsContainer">
            <div className="explorerTab" onMouseDown={this.showArtists}>Artist</div>
            <div className="explorerTab" onMouseDown={this.showAlbums}>Album</div>
            <div className="explorerTab" onMouseDown={this.showAlbumArtists}>Album Artist</div>
          </div>
          <div  className="explorerList">
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

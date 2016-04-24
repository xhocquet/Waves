const React = require('react');
const ArtistEntry = require('./artistEntry.jsx');

let artistList = React.createClass({
  getInitialState: function() {
    return {
      artists: []
    }
  },

  clickHandler: function(artist, event) {
    this.props.onClick(artist, event);
  },

  doubleClickHandler: function() {
    this.props.playerWindow.updateMusicPlayerData();
    this.props.musicPlayer.playSong(this.props.musicPlayer.ids[0]);
  },

  getArtistEntries: function() {
    let artistEntries = [];
    let counter = 0;

    // All Artists entry
    artistEntries.push(
      <ArtistEntry
        rowClass={"artistEntry"}
        key={1}
        onClick={this.clickHandler}
        onDoubleClick={this.doubleClickHandler}
        artist={"All"}
      />
    );

    for (let i = 0; i < this.state.artists.length; i++) {
      let rowClass = counter % 2 ? "artistEntry" : "artistEntryAlternate";
      // Only add non-null artists. Prevents issues with undefined and artist searching
      if (this.state.artists[i]) {
        counter++;
        artistEntries.push(
          <ArtistEntry
            rowClass={rowClass}
            key={"artistList_"+this.state.artists[i]}
            onClick={this.clickHandler}
            onDoubleClick={this.doubleClickHandler}
            artist={this.state.artists[i]}
          />
        );
      }
    }
    return artistEntries;
  },

  render: function() {
    if (this.state.artists.length > 0) {
      let artistEntries = this.getArtistEntries();
      return (
        <div  className="artistList">
          {artistEntries}
        </div>
      );
    } else {
      return (
        <div  className="artistList artistListEmpty">
          Add some tracks!
        </div>
      );
    }
  }
});

module.exports = artistList;

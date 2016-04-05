var React = require('react');
var ArtistEntry = require('./artistEntry.jsx');

var artistList = React.createClass({
  getInitialState: function() {
    return {
      artists: []
    }
  },

  clickHandler: function(artist, event) {
    this.props.onClick(artist, event);
  },

  getArtistEntries: function() {
    var artistEntries = [];

    // All Artists entry
    artistEntries.push(
      <ArtistEntry
        rowClass={"artistEntry"}
        key={1}
        onClick={this.clickHandler}
        artist={"All"}
      />
    );

    for (var i = 0; i < this.state.artists.length; i++) {
      var rowClass = i % 2 ? "artistEntry" : "artistEntryAlternate";
      artistEntries.push(
        <ArtistEntry
          rowClass={rowClass}
          key={this.state.artists[i] || "Undefined"}
          onClick={this.clickHandler}
          artist={this.state.artists[i] || "Undefined"}
        />
      );
    }
    return artistEntries;
  },

  render: function() {
    if (this.state.artists.length > 0) {
      var artistEntries = this.getArtistEntries();
      return (
        <div  className="artistList">
          {artistEntries}
        </div>
      );
    } else {
      return (
        <div  className="artistList">
          Add some artists!
        </div>
      );
    }
  }
});

module.exports = artistList;

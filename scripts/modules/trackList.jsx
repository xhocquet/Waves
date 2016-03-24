var React = require('react');
var TrackEntry = require('./trackEntry.jsx');

var trackList = React.createClass({
  // Returns an array of TrackEntry modules
  getTrackEntries: function(){
    if (!this.state) {
      return null;
    }

    var trackEntries = [];
    var counter = 0;

    this.state.tracks.forEach(track => {
      var rowClass = counter % 2 ? "songListItem" : "songListItemAlternate";
      counter += 1;
      trackEntries.push(
        <TrackEntry
          key={track._id}
          track={track}
          className={rowClass}
          onDoubleClick={this.playSong.bind(this, track)}
        />
      );
    })
    return trackEntries;
  },

  playSong: function(track) {
    this.props.musicPlayer.playSong(track._id);
  },

  render: function() {
    var entries = this.getTrackEntries();
    if (entries) {
      return (
        <div className="songList">
          {entries}
        </div>
      );
    } else {
      return null;
    }
  }
});

module.exports = trackList;

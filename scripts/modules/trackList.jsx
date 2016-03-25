var React = require('react');
var TrackEntry = require('./trackEntry.jsx');
var currentlyPlayingNode;

var trackList = React.createClass({
  getInitialState: function() {
    return {
      tracks: [],
      selectedTracks: [],
      playingTrack: null
    }
  },

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
          onClick={this.clickHandler}
          onDoubleClick={this.playSong}
        />
      );
    })
    return trackEntries;
  },

  clickHandler: function(element, event) {
    switch(event.button) {
      case 0: // Left click
        if(event.ctrlKey) {
          this.state.selectedTracks.push(element)
        } else {
          this.state.selectedTracks.forEach(track => {
            track.setState({selected: false});
            track.render();
          });
          this.state.selectedTracks = [element]
        }
        element.setState({selected: true});
        element.render();
        break;
      case 1: // Middle click
        var trackID = element.props.track._id;
        this.props.musicPlayer.queueNext(trackID);
        break;
      case 2: // Right click
      break;
    }
  },

  playSong: function(element, event) {
    var trackID = element.props.track._id;
    this.props.musicPlayer.playSong(trackID);

    playingTrack.setState({
      nowPlaying: false
    })
    playingTrack = element;
    playingTrack.setState({
      nowPlaying: true
    });
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

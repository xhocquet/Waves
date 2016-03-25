var React = require('react');
var TrackEntry = require('./trackEntry.jsx');

var trackList = React.createClass({
  // This goes a bit against pattern, since selected and playing will be manipulated
  // in here. However, eventually the selections/playing could come from the outside,
  // so I want to keep that in mind.
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
          });
          this.state.selectedTracks = [element];
        }
        element.setState({selected: true});
        break;
      case 1: // Middle click
        var trackID = element.props.track._id;
        this.props.musicPlayer.queueNext(trackID);
        break;
      case 2: // Right click
        if(event.ctrlKey) {
          this.state.selectedTracks.push(element)
        } else {
          this.state.selectedTracks.forEach(track => {
            track.setState({selected: false});
          });
          this.state.selectedTracks = [element];
        }
        element.setState({selected: true});
        this.props.trackContextMenu.popup(this.props.playerWindow);
        break;
    }
  },

  playSong: function(element, event) {
    var trackId = element.props.track._id;
    this.props.musicPlayer.playSong(trackId);

    if (this.state.playingTrack) {
      this.state.playingTrack.setState({nowPlaying: false})
      this.state.playingTrack.render();
    }
    this.state.playingTrack = element;
    this.state.playingTrack.setState({nowPlaying: true});
    this.state.playingTrack.render();
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

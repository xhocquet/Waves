var React = require('react');
var ReactDOM = require('react-dom');
var Track = require('./track.jsx');

var trackList = React.createClass({
  getInitialState: function() {
    var recordsPerBody = Math.floor((this.props.height - 2) / this.props.recordHeight);
    return {
      displayEnd: recordsPerBody * 2,
      displayStart: 0,
      playingTrack: null,
      recordHeight: this.props.recordHeight,
      recordsPerBody: recordsPerBody,
      scroll: 0,
      selectedTracks: [],
      total: 0,
      tracks: [],
      visibleEnd: recordsPerBody,
      visibleStart: 0
    }
  },

  onScroll: function(event) {
    this.scrollState(this.refs.scrollable.scrollTop);
  },

  scrollState: function(scroll) {
    var visibleStart = Math.floor(scroll / this.state.recordHeight);
    var visibleEnd = Math.min(visibleStart + this.state.recordsPerBody, this.state.total - 1);

    var displayStart = Math.max(0, Math.floor(scroll / this.state.recordHeight) - this.state.recordsPerBody * 1.5);
    var displayEnd = Math.min(displayStart + (4 * this.state.recordsPerBody), this.state.total - 1);

    this.setState({
      displayEnd: displayEnd,
      displayStart: displayStart,
      visibleEnd: visibleEnd,
      visibleStart: visibleStart
    });

  },

  // Returns the Tracks and filler divs to space out the scrollbar
  getTrackEntries: function(){
    var trackEntries = [];
    var counter = 0;

    var topFillerHeight = this.state.displayStart * this.state.recordHeight;
    var bottomFillerHeight = (this.state.tracks.length - this.state.displayEnd) * this.state.recordHeight;

    // Top filler for scrollbar
    trackEntries.push(<div key={1} style={{height: topFillerHeight}}></div>);

    for (var i = this.state.displayStart; i < this.state.displayEnd; ++i) {
      var track = this.state.tracks[i];
      var rowClass = counter % 2 ? "songListItem" : "songListItemAlternate";
      trackEntries.push(
        <Track
          className={rowClass}
          key={track._id}
          onClick={this.clickHandler}
          onDoubleClick={this.playSong}
          track={track}
        />
      );
      counter += 1;
    }

    // Bottom filler for scrollbar
    trackEntries.push(<div key={2} style={{height: bottomFillerHeight}}></div>);

    return trackEntries;
  },

  clickHandler: function(element, event) {
    switch(event.button) {
      case 0: // Left click
        if(event.ctrlKey) {
          this.state.selectedTracks.push(element)
        } else {
          this.state.selectedTracks.forEach(track => {
            if (track.isMounted()) {
              track.setState({selected: false});
            }
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
  },

  render: function() {
    if (this.state.total > 0) {
      var trackEntries = this.getTrackEntries();
      return (
        <div  className="songList" ref="scrollable" onScroll={this.onScroll}>
          {trackEntries}
        </div>
      );
    } else {
      return (
        <div  className="songList" ref="scrollable" onScroll={this.onScroll}>
          Add some tracks!
        </div>
      );
    }
  }
});

module.exports = trackList;

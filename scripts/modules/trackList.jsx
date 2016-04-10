var React = require('react');
var Track = require('./track.jsx');

var trackList = React.createClass({
  getInitialState: function() {
    var recordsPerBody = Math.floor((this.props.height - 2) / this.props.recordHeight);
    return {
      displayEnd: recordsPerBody * 2,
      displayStart: 0,
      playingTrackComponent: null,
      playingTrackId: null,
      prevTotal: 0,
      recordHeight: this.props.recordHeight,
      recordsPerBody: recordsPerBody,
      scroll: 0,
      selectedTrackComponents: [],
      total: 0,
      tracks: [],
      visibleEnd: recordsPerBody,
      visibleStart: 0
    }
  },

  onScroll: function(event) {
    this.scrollState(this.refs.scrollable.scrollTop);
  },

  // Calculates new visible and display limits based on scroll.
  // Only set the display if the visible is approaching the limit. Reduces number of re-renders.
  scrollState: function(scroll) {
    var recordHeight = this.state.recordHeight;
    var recordsPerBody = this.state.recordsPerBody;
    var total = this.state.total;

    var visibleStart = Math.floor(scroll / recordHeight);
    var visibleEnd = Math.min(visibleStart + recordsPerBody, total - 1);

    var displayStart = Math.max(0, visibleStart - recordsPerBody * 1.5);
    var displayEnd = Math.min(displayStart + (4 * recordsPerBody), total - 1);

    if (visibleEnd - displayEnd < 5 || visibleStart - displayStart < 5) {
      this.setState({
        displayEnd: displayEnd,
        displayStart: displayStart,
        visibleEnd: visibleEnd,
        visibleStart: visibleStart
      });
    } else {
      this.setState({
        visibleEnd: visibleEnd,
        visibleStart: visibleStart
      })
    }
  },

  // Returns the Tracks and filler divs to space out the scrollbar
  getTrackEntries: function(){
    var trackEntries = [];
    var counter = 0;

    var displayStart = this.state.displayStart;
    var displayEnd = this.state.displayEnd > this.state.total - 1 ? Math.min(this.state.recordsPerBody * 2, this.state.total - 1) : this.state.displayEnd;
    
    var topFillerHeight = this.state.displayStart * this.state.recordHeight;
    var bottomFillerHeight = (this.state.tracks.length - this.state.displayEnd) * this.state.recordHeight;

    // Top filler for scrollbar to look the right size
    trackEntries.push(<div key={1} style={{height: topFillerHeight}}></div>);
    
    for (var i = displayStart; i <= displayEnd; i++) {
      var track = this.state.tracks[i];
      var rowClass = counter % 2 ? "songListItem" : "songListItemAlternate";
      var playing = false;
      var selected = this.state.selectedTrackComponents.map(module=>module.props.track._id).indexOf(track._id) > -1;

      // Set playing child properly
      if (this.state.playingTrackId) {
        playing = this.state.playingTrackId === track._id;
      }
      
      trackEntries.push(
        <Track
          className={rowClass}
          key={track._id}
          onClick={this.clickHandler}
          onDoubleClick={this.playSong}
          playing={playing}
          ref={track._id}
          selected={selected}
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
    var clickTrack = element.props.track;
    switch(event.button) {
      case 0: // Left click
        if(event.ctrlKey) {
          this.state.selectedTrackComponents.push(element);
        } else {
          this.state.selectedTrackComponents.forEach(trackComponent => {
            if (trackComponent.isMounted()) {
              trackComponent.setState({selected: false});
            }
          });
          this.state.selectedTrackComponents = [element];
        }
        element.setState({selected: true});
        break;
      case 1: // Middle click
        var trackID = element.props.track._id;
        this.props.musicPlayer.queueNext(trackID);
        break;
      case 2: // Right click
        if(event.ctrlKey) {
          this.state.selectedTrackComponents.push(element)
        } else {
          this.state.selectedTrackComponents.forEach(trackComponent => {
            if (trackComponent.isMounted()) {
              trackComponent.setState({selected: false});
            }
          });
          this.state.selectedTrackComponents = [element];
        }
        element.setState({selected: true});
        // Need to set the selection to the window so the menu can access it
        this.props.playerWindow.selectedTracks = this.state.selectedTrackComponents.map(trackComponent => trackComponent.props.track._id);
        this.props.trackContextMenu.popup(this.props.playerWindow);
        break;
    }
  },

  playSong: function(element, event) {
    var trackId = element.props.track._id;
    var trackComponent = this.refs[trackId];

    this.props.musicPlayer.playSong(trackId);

    this.setState({
      playingTrackId: trackId,
      playingTrackComponent: trackComponent
    });
  },

  render: function() {
    if (this.state.total > 0) {
      var trackEntries = this.getTrackEntries();
      return (
        <div className="songList" ref="scrollable" onScroll={this.onScroll}>
          <div className="songListHeader" key={0}>
            <div className="rowItem rowIndex"></div>
            <div className="rowItem rowPlaying"></div>
            <div className="rowItem rowArtist">Album Artist</div>
            <div className="rowItem rowAlbum">Album</div>
            <div className="rowItem rowTitle">Title</div>
            <div className="rowItem rowDuration">Duration</div>
          </div>
          {trackEntries}
        </div>
      );
    } else {
      return (
        <div className="songList" ref="scrollable" onScroll={this.onScroll}>
          No tracks found.
        </div>
      );
    }
  }
});

module.exports = trackList;

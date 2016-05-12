const React = require('react');
const Track = require('./track.jsx');

let trackList = React.createClass({
  getInitialState: function() {
    let recordsPerBody = Math.floor((this.props.height - 2) / this.props.recordHeight);
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
      visibleStart: 0,
      groupMethod: ""
    }
  },

  //TODO: Prevent a rerender if the only difference is visible
  // shouldComponentUpdate: function(nextProps, nextState) {
  //   return true;
  // },

  onScroll: function(event) {
    this.scrollState(this.refs.scrollable.scrollTop);
  },

  // Calculates new visible and display limits based on scroll.
  // Only set the display if the visible is approaching the limit. Reduces number of re-renders.
  scrollState: function(scroll) {
    let recordHeight = this.state.recordHeight;
    let recordsPerBody = this.state.recordsPerBody;
    let total = this.state.total;

    let visibleStart = Math.floor(scroll / recordHeight);
    let visibleEnd = Math.min(visibleStart + recordsPerBody, total - 1);

    let displayStart = Math.max(0, visibleStart - (recordsPerBody * 0.5));
    let displayEnd = Math.min(displayStart + (2 * recordsPerBody), total - 1);

    if (this.state.displayEnd - visibleEnd < 5 || visibleStart - this.state.displayStart < 5) {
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
    let trackEntries = [];
    let counter = 0;
    let prevGroupMethodValue = ''; 
    let curGroupMethodValue = '';
    let groupMethod = this.state.groupMethod === "" ? "albumArtist" : this.state.groupMethod;

    let displayStart = this.state.displayStart;
    let displayEnd = this.state.displayEnd > this.state.total - 1 ? Math.min(this.state.recordsPerBody * 2, this.state.total - 1) : this.state.displayEnd;

    let topFillerHeight = this.state.displayStart * this.state.recordHeight;
    let bottomFillerHeight = (this.state.total - this.state.displayEnd - 1) * this.state.recordHeight;

    // Top filler for scrollbar to look the right size
    trackEntries.push(<div key={'topFiller'} style={{height: topFillerHeight}}></div>);

    for (let i = displayStart; i <= displayEnd; i++) {
      let track = this.state.tracks[i];
      let rowClass = counter % 2 ? "songListItem" : "songListItemAlternate";
      let playing = false;
      let selected = this.state.selectedTrackComponents.map(module=>module.props.track._id).indexOf(track._id) > -1;

      curGroupMethodValue = track[groupMethod] === "" ? "No " + this.state.groupMethod : track[groupMethod];
      if (prevGroupMethodValue !== curGroupMethodValue) {
        prevGroupMethodValue = curGroupMethodValue;
        trackEntries.push(
          <div className="songListSeparator" key={"separator_"+curGroupMethodValue}>{curGroupMethodValue}</div>
        );
        bottomFillerHeight -= this.state.recordHeight * 2;

      }

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
    bottomFillerHeight = Math.max(0, bottomFillerHeight);
    trackEntries.push(<div key={'bottomFiller'} style={{height: bottomFillerHeight}}></div>);

    return trackEntries;
  },

  clickHandler: function(element, event) {
    let clickTrack = element.props.track;
    switch(event.button) {
      case 0: // Left click
        if(event.ctrlKey) {
          let newComponents = this.state.selectedTrackComponents;
          newComponents.push(element);
          this.props.playerWindow.selectedTracks = newComponents.map(trackComponent => trackComponent.props.track._id);
          this.setState({
            selectedTrackComponents: newComponents
          });
        } else {
          this.state.selectedTrackComponents.forEach(trackComponent => {
            if (trackComponent.isMounted()) {
              trackComponent.setState({selected: false});
            }
          });
          this.props.playerWindow.selectedTracks = [element.props.track._id];
          this.setState({
            selectedTrackComponents: [element]
          });
        }
        element.setState({selected: true});
        break;
      case 1: // Middle click
        let trackID = element.props.track._id;
        this.props.musicPlayer.queueNext(trackID);
        break;
      case 2: // Right click
        event.preventDefault();
        if(event.ctrlKey) {
          let newComponents = this.state.selectedTrackComponents;
          newComponents.push(element);

          this.setState({
            selectedTrackComponents: newComponents
          });
        }
        element.setState({selected: true});
        // Need to set the selection to the window so the menu can access it
        this.props.playerWindow.selectedTracks = this.state.selectedTrackComponents.map(trackComponent => trackComponent.props.track._id);
        this.props.trackContextMenu.popup(this.props.playerWindow);
        break;
    }
  },

  playSong: function(element, event) {
    this.props.playerWindow.updateMusicPlayerData();

    let trackId = element.props.track._id;
    let trackComponent = this.refs[trackId];

    this.props.musicPlayer.playSong(trackId);

    this.setState({
      playingTrackId: trackId,
      playingTrackComponent: trackComponent
    });
  },

  render: function() {
    if (this.state.total > 0) {
      let trackEntries = this.getTrackEntries();
      return (
        <div className="songListContainer">
          <div className="songListHeader" key={0}>
            <div className="rowItem rowIndex"></div>
            <div className="rowItem rowPlaying"></div>
            <div className="rowItem rowArtist">Album Artist</div>
            <div className="rowItem rowAlbum">Album</div>
            <div className="rowItem rowTitle">Title</div>
            <div className="rowItem rowDuration">Duration</div>
          </div>
          <div className="songList" ref="scrollable" onScroll={this.onScroll}>
            {trackEntries}
          </div>
        </div>
      );
    } else {
      return (
        <div className="songList songListEmpty" ref="scrollable" onScroll={this.onScroll}>
          Add some tracks by dragging in a folder, or adding your music folder to the settings!
        </div>
      );
    }
  }
});

module.exports = trackList;

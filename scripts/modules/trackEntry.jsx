var React = require('react');
var ReactDOM = require('react-dom');

var trackEntry = React.createClass({
  getInitialState: function() {
    return {
      nowPlaying: false,
      selected: false
    }
  },

  sanitizeDuration: function(duration) {
    var minutes = Math.floor(duration / 60);
    var remainder = Math.floor(duration % 60);
    return minutes.toString() + ":" + ("0" + remainder).slice(-2)
  },

  // Pass up this element to the list
  clickHandler: function(event) {
    this.props.onClick(this, event.nativeEvent);
  },

  doubleClickHandler: function(event) {
    this.props.onDoubleClick(this, event.nativeEvent);
  },

  getRowClass: function() {
    if (this.state.selected) {
      return this.props.className + " songListItemSelected";
    } else {
      return this.props.className;
    }
  },

  render: function() {
    var nowPlaying = this.state.nowPlaying ? "rowItem rowPlaying rowCurrentlyPlaying" : "rowItem rowPlaying";
    var rowClass = this.getRowClass();

    return (
      <div className={rowClass} onMouseDown ={this.clickHandler} onDoubleClick={this.doubleClickHandler}>
        <div className="rowItem rowIndex"></div>
        <div className={nowPlaying}></div>
        <div className="rowItem rowArtist">{this.props.track.artist}</div>
        <div className="rowItem rowAlbum">{this.props.track.album}</div>
        <div className="rowItem rowTitle">{this.props.track.title}</div>
        <div className="rowItem rowDuration">{this.sanitizeDuration(this.props.track.duration)}</div>
      </div>
    );
  }
});

module.exports = trackEntry;

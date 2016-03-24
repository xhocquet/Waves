var React = require('react');
var ReactDOM = require('react-dom');

var trackEntry = React.createClass({
  sanitizeDuration: function(duration) {
    var minutes = Math.floor(duration / 60);
    var remainder = Math.floor(duration % 60);
    return minutes.toString() + ":" + ("0" + remainder).slice(-2)
  },

  render: function() {
    return (
      <div className={this.props.className} onDoubleClick={this.props.onDoubleClick}>
        <div className="rowItem rowIndex"></div>
        <div className="rowItem rowPlaying"></div>
        <div className="rowItem rowArtist">{this.props.track.artist}</div>
        <div className="rowItem rowAlbum">{this.props.track.album}</div>
        <div className="rowItem rowTitle">{this.props.track.title}</div>
        <div className="rowItem rowDuration">{this.sanitizeDuration(this.props.track.duration)}</div>
      </div>
    );
  }
});

module.exports = trackEntry;

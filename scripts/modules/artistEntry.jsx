const React = require('react');

let artistEntry = React.createClass({
  // Pass up this element to the list
  clickHandler: function(event) {
    this.props.onClick(this.props.artist, event.nativeEvent);
  },

  // Artist should be loaded, so just play
  doubleClickHandler: function(event) {
    this.props.onDoubleClick();
  },

  render: function() {
    return (
      <div className={this.props.rowClass} onMouseDown={this.clickHandler} onDoubleClick={this.doubleClickHandler}>
        {this.props.artist}
      </div>
    );
  }
});

module.exports = artistEntry;

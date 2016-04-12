const React = require('react');

let artistEntry = React.createClass({
  // Pass up this element to the list
  clickHandler: function(event) {
    this.props.onClick(this.props.artist, event.nativeEvent);
  },

  // Play artist
  // doubleClickHandler: function(event) {
  //   this.props.onDoubleClick(this, event.nativeEvent);
  // },

  render: function() {
    return (
      <div className={this.props.rowClass} onMouseDown={this.clickHandler}>
        {this.props.artist}
      </div>
    );
  }
});

module.exports = artistEntry;

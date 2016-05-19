const React = require('react');

let explorerEntry = React.createClass({
  // Pass up this element to the list
  showEntry: function(event) {
    this.props.onClick(this.props.value, event.nativeEvent);
  },

  // Artist should be loaded, so just play
  playEntry: function(event) {
    this.props.onDoubleClick();
  },

  render: function() {
    return (
      <div className={this.props.rowClass} onMouseDown={this.showEntry} onDoubleClick={this.playEntry}>
        {this.props.value}
      </div>
    );
  }
});

module.exports = explorerEntry;

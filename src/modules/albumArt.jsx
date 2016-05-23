const React = require('react');
const MetaData = require('musicmetadata');
const fs = require('graceful-fs');

let AlbumArt = React.createClass({
  getInitialState: function() {
    return({
      src: "../assets/albumArt.png"
    });
  },

  componentWillReceiveProps : function(nextProps) {
    this.getImageSrc(nextProps.filePath, src => {
      this.setState({
        src: src
      });
    });
  },

  getImageSrc: function(filePath, callback) {
    if (filePath) {
      let newFilePath = decodeURI(filePath.slice(8));
      let fileStream = fs.createReadStream(newFilePath);
      MetaData(fileStream, function(err, metaData) {
        let coverImage = metaData.picture[0];
        if (coverImage) {
          let base64String = "";
          for (let i = 0; i < coverImage.data.length; i++) {
            base64String += String.fromCharCode(coverImage.data[i]);
          }
          let base64 = "data:" + coverImage.format + ";base64," + window.btoa(base64String);
          callback(base64);
        } else {
          callback("../assets/albumArt.png");
        }
      });
    } else {
      callback("../assets/albumArt.png");
    }
  },

  render: function() {
    return (
      <div id="albumArt">
        <img id="albumArtImage" src={this.state.src}/>
      </div>
    );
  }
});

module.exports = AlbumArt;

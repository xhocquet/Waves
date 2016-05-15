var webpack = require('webpack');
var webpackTargetElectronRenderer = require('webpack-target-electron-renderer');

var options = {
  context: __dirname,
  entry: {
    index: './src/index',
    settings: './src/settings'
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/builds'
  },
  target: 'electron',
  module: {
    loaders: [
      { 
        test: /\.js$/, 
        loader: 'babel-loader', 
        exclude: /node_modules/, 
        query: {
          presets: ['es2015', 'react']
        }
      },
      { 
        test: /\.json$/, 
        loader: 'babel-loader', 
        exclude: /node_modules/, 
        query: {
          presets: ['es2015', 'react']
        }
      },
      { 
        test: /\.jsx$/, 
        loader: 'babel-loader', 
        exclude: /node_modules/, 
        query: {
          presets: ['es2015', 'react']
        }
      }
    ]
  },

  resolve: {
    extensions: ['','.js', '.jsx']
  },

  externals: [
    (function () {
      var IGNORES = [
        'electron'
      ];
      return function (context, request, callback) {
        if (IGNORES.indexOf(request) >= 0) {
          return callback(null, "require('" + request + "')");
        }
        return callback();
      };
    })()
  ]
};

options.target = webpackTargetElectronRenderer(options)

module.exports = options;

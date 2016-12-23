var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: './src/FinlandYard.js',
    output: {
        path: __dirname + '/dist',
        filename: "bundle.js"
    },
    module: {
        loaders: [
            { test: /\.js/, loader: 'babel-loader' },
            { test: /\.css/, loader: ExtractTextPlugin.extract("css") }
        ],
        noParse: 'openlayers'
    },
    plugins: [
      new ExtractTextPlugin("styles.css")
    ]
};

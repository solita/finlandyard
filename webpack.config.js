var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: './src/FinlandYard.js',
    output: {
        path: __dirname + '/dist',
        filename: "bundle.js"
    },
    module: {
        loaders: [
            { test: /\.css/, loader: ExtractTextPlugin.extract("css") }
        ]
    },
    plugins: [
      new ExtractTextPlugin("styles.css")
    ]
};

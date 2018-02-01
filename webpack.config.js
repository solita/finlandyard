const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  context: path.resolve(__dirname, 'src'),
  entry: [
    './FinlandYard.js',
    './styles.css'
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "bundle.js",
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  devtool: 'source-map',
  plugins: [
    new CopyWebpackPlugin([
      {
        from: 'static',
        to: 'static'
      }
    ])
  ]
};

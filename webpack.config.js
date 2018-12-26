const path = require('path')

module.exports = {
  entry : './src/app.js',
  devtool: 'source-map',
  output : {
    path : path.resolve(__dirname, 'dist'),
    filename : 'atomic.build.js',
    library: 'Atomic',
    libraryTarget: 'umd',
    // auxiliaryComment: 'module'
  },
  // mode: 'development',
  mode: 'production',
  devServer: {
    contentBase: path.join(__dirname),
    compress: true,
    port: 9000
  }
}
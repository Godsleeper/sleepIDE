var webpack = require("webpack");
var path = require("path");
var pathMap = require('./src/pathmap.json');
var srcDir = path.resolve(process.cwd(), 'src');
var nodeModPath = path.resolve(__dirname, './node_modules');

module.exports = {
    entry: {
        index:"./src/js/index.js",
    },//入口js，可为数组
    output: {
        path: path.join(__dirname, "src/dist"),
        filename: "[name]pack.js",
    },
    module: {
        loaders: [
            {test: /\.scss$/, loader: 'style-loader!css-loader!sass-loader'}
        ],
    },
    resolve: {
        extensions: ['.js',"",".css",".scss"],//指明那些文件名是webpack要扫描到的
        root: [srcDir,nodeModPath],
        alias: pathMap,
        publicPath: '/'
    },

}
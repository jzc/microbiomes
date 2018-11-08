module.exports = {
    mode: "development",
    entry: "./build/main.js",
    devtool: 'inline-source-map',
    output: {
        filename: "main.js",
        publicPath: "dist"
    }
}
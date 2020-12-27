
const path = require('path');

module.exports = {
    entry: {
        main: './src/js/main.js'
    },
    output: {
        path: __dirname,
        filename: 'dist/js/[name].js'
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    devServer: {
        contentBase: __dirname,
        compress: true,
        port: 9000
    }
};
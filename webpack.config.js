
const path = require('path');
const { DefinePlugin } = require('webpack');
const Dotenv = require('dotenv-webpack');

module.exports = {
    entry: {
        main: './src/js/main.js',
        remote: './src/js/remote.js'
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
    plugins: [
        new Dotenv({
            path: './.env',
            safe: true
        }),
        new DefinePlugin({
            'process.env.AYAME_SIGNALING_KEY': JSON.stringify(process.env.AYAME_SIGNALING_KEY),
            'process.env.AYAME_ROOM_NAME': JSON.stringify(process.env.AYAME_ROOM_NAME)
        })
    ],
    devServer: {
        contentBase: __dirname,
        compress: true,
        port: 9000
    }
};
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = () => ({
    devtool: 'source-map',
    devServer: {
        port: 8081
    },
    entry: {
        'debug': path.resolve(__dirname, './debug.tsx'),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, './template.debug.html'),
            chunks: ['debug']
        })
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    }
});
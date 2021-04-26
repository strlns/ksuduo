const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {DefinePlugin} = require('webpack');

/**
 * This is not a comprehensive test suite.
 * I just created it after encountering bugs in the Sudoku generator.
 * Still executes in browser context for convenience and consistency.
 */
module.exports = () => ({
    devtool: 'source-map',
    devServer: {
        port: 8082
    },
    entry: {
        'test': path.resolve(__dirname, './tests.ts'),
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
            template: path.join(__dirname, './template.test.html'),
            chunks: ['test']
        }),
        new DefinePlugin({
                IS_DEVELOPMENT: true
            }
        )

    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    }
});
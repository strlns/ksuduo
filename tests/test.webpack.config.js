const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {LOGLEVEL_NORMAL} = require("../webpack.development.config");
const {DefinePlugin} = require('webpack');

/**
 * This is not a comprehensive test suite.
 * I just created it after encountering bugs in the Sudoku generator.
 * Still executes in browser context for convenience and consistency.
 */
module.exports = (
    /**
     * 1 = {@see LOGLEVEL_NORMAL}
     */
    {loglevel = 1},
    {mode = 'development'}
) => {
    console.log(`WEBPACK MODE: ${mode}`);
    const IS_DEVELOPMENT = mode === 'development';
    return {
        devtool: 'source-map',
        devServer: {
            port: 8081
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
                    IS_DEVELOPMENT,
                    'process.env.NODE_ENV': JSON.stringify(mode),
                    LOG_LEVEL: loglevel
                }
            )

        ],
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        }
    }
};
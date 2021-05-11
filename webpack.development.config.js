const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const {HotModuleReplacementPlugin} = require("webpack");
const {DefinePlugin} = require('webpack');
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
            // HMR does not work at the moment..probably because of ts-loader. reload is triggered and that's enough.
            // hot: true,
        },
        entry: {
            'main': path.resolve(__dirname, './src/index.tsx')
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: {
                        loader: 'ts-loader',
                        options: {}
                    },
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/i,
                    exclude: /node_modules/,
                    use: [
                        "style-loader",
                        "css-loader"
                    ],
                },
                {
                    test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    loader: 'file-loader',
                    exclude: /node_modules/,
                    options: {
                        name: '[name].[ext]',
                        outputPath: 'fonts/'
                    },
                },
                {
                    test: /favicon.ico$/,
                    loader: 'file-loader',
                    exclude: /node_modules/,
                    options: {
                        name: '[name].[ext]',
                        outputPath: '/'
                    },
                },
                // worker-loader processes transpiled file, no .ts here
                {
                    test: /\.worker\.(js)$/,
                    use: {loader: "worker-loader"},
                    exclude: /node_modules/,
                },
            ],
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            publicPath: ''
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: path.join(__dirname, 'src', 'template.html')
            }),
            new DefinePlugin({
                    IS_DEVELOPMENT,
                    // JSON.stringify is required here for quoting!
                    'process.env.NODE_ENV': JSON.stringify(mode),
                    LOG_LEVEL: loglevel
                }
            ),
            // new HotModuleReplacementPlugin()
        ],
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
        target: 'web' // https://github.com/webpack/webpack-dev-server/issues/2758
    }
}
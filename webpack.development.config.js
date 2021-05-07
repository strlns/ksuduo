const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {DefinePlugin} = require('webpack');
module.exports = (
    env,
    {mode = 'development'}
) => {
    console.log(`WEBPACK MODE: ${mode}`);
    const IS_DEVELOPMENT = mode === 'development';
    return {
        devtool: 'source-map',
        devServer: {
            hot: true,
            hotOnly: true
        },
        entry: {
            'main': path.resolve(__dirname, './src/index.tsx')
        },
        module: {
            rules: [
                //use babel in production, ts-loader in development
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
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
                    'process.env.NODE_ENV': JSON.stringify(mode)
                }
            ),

        ],
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
    }
}
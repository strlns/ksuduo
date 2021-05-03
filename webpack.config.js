const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {DefinePlugin} = require('webpack');
const CssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
module.exports = (env, argv) => {
    const IS_DEVELOPMENT = argv.mode === 'development';
    return {
        devtool: 'source-map',
        entry: {
            'main': path.resolve(__dirname, './src/index.tsx')
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/i,
                    exclude: /node_modules/,
                    use: [
                        IS_DEVELOPMENT ? "style-loader" : CssExtractPlugin.loader,
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
                {
                    test: /\.worker\.(js)$/,
                    use: {loader: "worker-loader"},
                    exclude: /node_modules/,
                },
            ],
        },

        optimization: {
            minimize: true,
            minimizer: [
                `...`, //merge with existing array, webpack-specific syntax for versions > =5
                new CssMinimizerPlugin(),
            ]
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
                    IS_DEVELOPMENT
                }
            ),
            new CssExtractPlugin()

        ],
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
    }
}
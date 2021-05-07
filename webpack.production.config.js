const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {DefinePlugin} = require('webpack');
const CssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
module.exports = (
    env,
    {mode = 'production'}
) => {
    console.log(`WEBPACK MODE: ${mode}`);
    const IS_DEVELOPMENT = mode === 'development';
    return {
        entry: {
            'main': path.resolve(__dirname, './src/index.tsx')
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx|tsx|ts)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        useBuiltIns: 'usage',
                                        corejs: '3.11'
                                    }
                                ],
                                '@babel/preset-react',
                                '@babel/preset-typescript',
                            ],
                            plugins: [
                                '@babel/plugin-transform-runtime',
                                /**
                                 * Doesn't work? prop types are still in production build with this uncommented.
                                 */
                                // [
                                // 'transform-react-remove-prop-types',
                                // {
                                //     mode: 'remove',
                                //     removeImport: true,
                                // }
                                // ],
                            ],
                        },
                    },
                },
                {
                    test: /\.css$/i,
                    exclude: /node_modules/,
                    use: [
                        CssExtractPlugin.loader,
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
                    IS_DEVELOPMENT,
                    // JSON.stringify is required here for quoting!
                    'process.env.NODE_ENV': JSON.stringify(mode)
                }
            ),
            new CssExtractPlugin()

        ],
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
    }
}
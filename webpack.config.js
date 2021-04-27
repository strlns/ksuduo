const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {DefinePlugin} = require('webpack');
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
                {
                    test: /\.worker\.(js)$/,
                    use: {loader: "worker-loader"},
                    exclude: /node_modules/,
                },
                //This c*** doesn't work. My efforts to switch to babel-loader and @babel/preset-typescript
                //etc didn't work either. It's a huge time sink. Just do not support ancient browsers.

                // ...(IS_DEVELOPMENT ? [] : [
                //     {
                //         test: /\.(js)$/,
                //         use: {
                //             loader: 'babel-loader',
                //             options: {
                //                 presets: [
                //                     [
                //                         "@babel/preset-env",
                //                         {
                //                             corejs: {
                //                                 version: "3.8",
                //                                 proposals: true
                //                             },
                //                             useBuiltIns: "usage",
                //                         },
                //                     ],
                //                     "@babel/preset-react",
                //                 ]
                //             }
                //         }
                //     }
                // ])
            ],
        },

        plugins: [
            new HtmlWebpackPlugin({
                template: path.join(__dirname, 'src', 'template.html')
            }),
            new DefinePlugin({
                    IS_DEVELOPMENT
                }
            )

        ],
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
    }
}
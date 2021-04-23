const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {DefinePlugin} = require('webpack');
module.exports = (env, argv) => ({
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
                use: [
                    "style-loader",
                    "css-loader"
                ]
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'fonts/'
                        }
                    }
                ]
            },
            {
                test: /\.worker\.(js)$/,
                use: {loader: "worker-loader"},
            },
        ],
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'src', 'template.html')
        }),
        new DefinePlugin({
                IS_DEVELOPMENT: argv.mode === 'development'
            }
        )

    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
});
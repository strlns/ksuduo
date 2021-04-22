const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    devtool: 'source-map',
    // devServer: {
    //     contentBase: path.join(__dirname, 'dist'),
    //     compress: true,
    //     hot: true,
    //     hotOnly: true,
    //     liveReload: true,
    //     port: 8080,
    //     watchContentBase: true
    // },
    entry: {
        'main': path.resolve(__dirname, './src/index.tsx')
    },
    mode: "development",
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
                use: { loader: "worker-loader" },
            },
        ],
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'src', 'template.html')
        })
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    // output: {
    //     // This is required so workers are known where to be loaded from
    //     publicPath: "./dist/",
    //     filename: "./bundle.js",
    //     path: path.resolve("dist", __dirname),
    // },
};
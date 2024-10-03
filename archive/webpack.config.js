const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const webpack = require('webpack'); // Add this for HMR support

const isProduction = process.env.NODE_ENV === 'production';

const stylesHandler = isProduction ? MiniCssExtractPlugin.loader : 'style-loader';

const config = {
    entry: {
        app: './src/App.jsx',
        vendor: ['react', 'react-dom'], // Ensure these are only included in vendor
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].bundle.js', // Unique filenames for each entry
    },
    devServer: {
        open: true,
        host: 'localhost',
        port: 8080, // Optional: specify a port for dev server
        hot: true, // Enable Hot Module Replacement
        historyApiFallback: true, // Enable for SPA routing
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html', // Ensure path is correct
        }),
        isProduction && new MiniCssExtractPlugin(),
        !isProduction && new webpack.HotModuleReplacementPlugin(), // HMR plugin for dev mode
        new NodePolyfillPlugin(), // Polyfill Node.js modules
    ].filter(Boolean), // Filter out false values
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [stylesHandler, 'css-loader'],
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                type: 'asset',
            },
            {
                test: /\.(js|jsx|ts|tsx)$/i,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env',
                            '@babel/preset-react',
                            '@babel/preset-typescript',
                        ],
                        plugins: [
                            !isProduction && 'react-refresh/babel', // Enable fast refresh for React in development
                        ].filter(Boolean),
                    },
                },
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', 'cjs'], // Resolve these extensions
    },
    optimization: {
        splitChunks: {
            chunks: 'all', // Optimize chunks to prevent duplication
        },
    },
};

module.exports = () => {
    config.mode = isProduction ? 'production' : 'development';
    return config;
};

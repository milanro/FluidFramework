/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

module.exports = env => {
    const htmlTemplate = "./src/index.html";

    return {
        devtool: "inline-source-map",
        entry: {
            app: "./src/app.ts",
        },
        mode: "development",
        module: {
            rules: [{
                    test: /\.s?css$/,
                    use: ['style-loader', 'css-loader']
                },
                {
                    test: /\.tsx?$/,
                    loader: "ts-loader"
                }
            ]
        },
        output: {
            filename: "[name].[contenthash].js",
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.NODE_DEBUG': undefined,
                'process.env.FLUID_MODE': JSON.stringify(process.env.FLUID_MODE),
                'process.env.SECRET_FLUID_RELAY': JSON.stringify(process.env.SECRET_FLUID_RELAY),
                'process.env.SECRET_FLUID_TENANT':JSON.stringify(process.env.SECRET_FLUID_TENANT),
                'process.env.SECRET_FLUID_TOKEN': JSON.stringify(process.env.SECRET_FLUID_TOKEN)
            }),
            new HtmlWebpackPlugin({
                template: htmlTemplate
            })
        ],
        resolve: {
            extensions: [".ts", ".tsx", ".js"],
        },
    }
}
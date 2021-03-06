const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const webpack = require("webpack");
module.exports = {
  entry: "./src/example/index.tsx",
  mode: "development",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  devServer: {
    contentBase: "./dist",
  },
  plugins: [
    new webpack.ProvidePlugin({
      regeneratorRuntime: "regenerator-runtime/runtime",
    }),
    new HtmlWebpackPlugin({
      templateContent: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Webpack tutorial</title>
            </head>
            <body>
                <div id="react-root"/>
            </body>
            </html>
        `,
    }),
  ],
};

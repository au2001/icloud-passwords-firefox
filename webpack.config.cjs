const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    background: "./src/background.ts",
    popup: "./src/popup/index.tsx",
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
    alias: {
      sjcl: "./sjcl.cjs",
    },
    fallback: {
      crypto: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "./meta",
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: "./src/popup/index.html",
      filename: "./popup.html",
      inject: "body",
      chunks: ["popup"],
    }),
  ],
  devtool: "source-map",
};

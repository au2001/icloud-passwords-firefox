const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    settings: "./src/settings/index.tsx",
    background: "./src/background/index.ts",
    popup: "./src/popup/index.tsx",
    content_script: "./src/content-script/index.ts",
    suggestions: "./src/suggestions/index.tsx",
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
    alias: {
      sjcl: "/lib/sjcl.cjs",
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
        {
          from: "./LICENSE",
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: "./src/settings/index.html",
      filename: "./settings.html",
      inject: "body",
      chunks: ["settings"],
    }),
    new HtmlWebpackPlugin({
      template: "./src/popup/index.html",
      filename: "./popup.html",
      inject: "body",
      chunks: ["popup"],
    }),
    new HtmlWebpackPlugin({
      template: "./src/suggestions/index.html",
      filename: "./suggestions.html",
      inject: "body",
      chunks: ["suggestions"],
    }),
  ],
  devtool: "source-map",
};

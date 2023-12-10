const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    background: "./src/background/index.ts",
    fill_password: "./src/background/fill-password.ts",
    content_script: "./src/background/content-script.ts",
    settings: "./src/ui/settings/index.tsx",
    popup: "./src/ui/popup/index.tsx",
    suggestions: "./src/ui/suggestions/index.tsx",
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
      template: "./src/ui/index.html",
      filename: "./settings.html",
      inject: "body",
      chunks: ["settings"],
    }),
    new HtmlWebpackPlugin({
      template: "./src/ui/index.html",
      filename: "./popup.html",
      inject: "body",
      chunks: ["popup"],
    }),
    new HtmlWebpackPlugin({
      template: "./src/ui/index.html",
      filename: "./suggestions.html",
      inject: "body",
      chunks: ["suggestions"],
    }),
  ],
  devtool: "source-map",
};

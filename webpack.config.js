import CopyWebpackPlugin from "copy-webpack-plugin";

export default {
  mode: "none",
  entry: {
    background: "./src/background.js",
  },
  resolve: {
    fallback: {
      crypto: false
    }
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "./meta",
        },
      ],
    }),
  ],
};

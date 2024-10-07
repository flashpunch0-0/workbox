const path = require("path");

module.exports = {
  entry: "./background.js", // Adjust this to your actual entry point
  output: {
    filename: "backgroundbundled.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
  mode: "production", // or 'development' depending on your environment
};

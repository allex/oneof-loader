module.exports = {
  "presets": [
    [ "@babel/preset-env", {
      "loose": true,
      "useBuiltIns": false,
      "targets": {
        "node": "6.4.0"
      },
      "exclude": [ "transform-typeof-symbol", "transform-function-name", "transform-classes" ]
    } ]
  ],
  "plugins": []
}

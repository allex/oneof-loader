# oneof-loader

Oneof loader for webpack loaders select, the options similar with builtin [oneOf](https://webpack.js.org/configuration/module/#ruleoneof), An array of loaders from which only the first matching loaders is used when the conditions matches.

## Installation

```sh
yarn add oneof-loader -D --production=false
```

## Usage

Within your webpack configuration object, you'll need to add the oneof-loader to the list of modules, like so:

```
module: {
  rules: [
    {
      test: /\.svg$/,
      use: {
        loader: 'oneof-loader',
        options: {
          oneOf: [
            {
              test: /\/src\/assets\/icons\/svg\//,
              loader: 'svg-sprite-loader',
              options: {
                symbolId: 'icon-[name]',
                extract: false
              }
            },
            {
              test: /\/src\//,
              loader: 'vue-svg-loader'
            },
            {
              loader: 'svg-url-loader',
              options: {
                stripdeclarations: true,
                limit: 1024,
                name: 'img/[name].[hash:8].[ext]'
              }
            }
          ]
        }
      }
    }
  ]
}

```

## License

[MIT](http://opensource.org/licenses/MIT) Copyright (c) [Allex Wang][1]

[1]: https://github.com/allex/

webpack-elm-optimizations-plugin
================================

Overview
--------

This plugin optimizes Elm compilation output through the use of custom transformations

Right now there is a single optimization implemented, which transforms this:

```js
var same = i === yRefs.length;
while (same && i--)
{
    same = xRefs[i] === yRefs[i];
}
```

Into this:

```js
var same = i === yRefs.length;
var recheck = [];
while (same && i--)
{
    if (xRefs[i] !== yRefs[i]){
        if (typeof(xRefs[i]) === "object" && !(Array.isArray(xRefs[i])) && xRefs[i]['$'] === undefined){
            recheck.push(i);
        } else {
            same = false;
        }
    }
}
i = recheck.length;
while (same && i--){
    var check = recheck[i];
    for (var key in xRefs[check])
    {
        same = (xRefs[check][key] === yRefs[check][key]);
        if (!same) {break;}
    }
}
```

Usage
-----

This is a webpack loader plugin, so you'll need an existing Webpack configuration, and you'll need webpack
installed.

The plugin itself is written in TypeScript, so you'll also need to compile TypeScript before using the plugin.

So something like:

```sh
npm install # Install dependencies
tsc # Compile TypeScript
```

Your existing webpack configuration likely has a section that looks something like this:

```js
{
    module: {
        rules: [
            {
                test: /\.elm$/,
                use: [
                    {
                        loader: 'elm-webpack-loader',
                        options: {}
                    }
                ]
            }
        ]
    }
}
```

Add the `ElmOptimizationsPlugin` as the first entry in order to use the plugin:

```js
{
    module: {
        rules: [
            {
                test: /\.elm$/,
                use: [
                    {
                        loader: require('path').join(__dirname, './ElmOptimizationsPlugin'),
                        /** @type ElmOptimizationsPluginOptions */
                        options: {
                            htmlLazy: true,
                        }
                    },
                    {
                        loader: 'elm-webpack-loader',
                        options: {}
                    }
                ]
            }
        ]
    }
}
```

**NOTE:** It's very important that `ElmOptimizationsPlugin` plugin is listed _before_ `elm-webpack-loader`, because
Webpack runs loaders in reverse order of how they are listed. `ElmOptimizationsPlugin` only works with the output of the
Elm compilation, not with Elm sourcecode itself.

Example
-------

You can run a build of the example app in this repo with:

```
npm run build-dev
```

And you can have webpack serve the example app in this repo with:

```
npm run serve-dev
```

The webpack configuration options are located in the `elmSupport` function of `webpack.config.js`.

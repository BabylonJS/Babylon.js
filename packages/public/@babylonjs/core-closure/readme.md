# @babylonjs/core-closure

Closure Compiler compatible build of `@babylonjs/core`.

This package is generated from the standard Babylon.js ES6 package. It preserves property names and external data contracts under Closure Compiler `ADVANCED` optimizations without requiring consumer extern files.

Alias the standard package names to their Closure variants in your bundler:

```js
resolve: {
    alias: {
        "@babylonjs/core": "@babylonjs/core-closure",
        "@babylonjs/gui": "@babylonjs/gui-closure",
        "@babylonjs/loaders": "@babylonjs/loaders-closure",
        "@babylonjs/serializers": "@babylonjs/serializers-closure",
    },
}
```

Only alias packages your application uses. Aliases apply to package subpaths, so imports such as `@babylonjs/core/Engines/thinEngine.js` resolve to the matching Closure build. Each module automatically imports the generated Closure extern declarations needed for direct subpath imports.

Normal Babylon.js applications should continue using `@babylonjs/core`; these packages do not change the standard ES6 output.

# Lottie Player Migration

The experimental Babylon.js implementation of `@babylonjs/lottie-player` ended with the v9 line.
Version 10 is a breaking, Lite-backed replacement owned by
[BabylonJS/Babylon-Lite](https://github.com/BabylonJS/Babylon-Lite/tree/main/packages/babylon-lottie-player).

Existing `^9` dependency ranges remain on the experimental implementation and do not silently
upgrade. Consumers moving to v10 must explicitly install `@babylonjs/lottie-player@^10` and migrate
to its worker-first API. There is no runtime compatibility wrapper.

The package has independent SemVer from `@babylonjs/core` and `@babylonjs/lite`, and uses
`@babylonjs/lite-gl` as its runtime rendering dependency.

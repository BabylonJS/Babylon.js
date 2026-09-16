# Lottie Player Migration

The experimental Babylon.js implementation of `@babylonjs/lottie-player` ended with the v9 line.
This monorepo no longer contains, owns, or publishes the package. Version 10 is a breaking replacement
maintained in the canonical standalone repository
[BabylonJS/BabylonLottie](https://github.com/BabylonJS/BabylonLottie).

Existing `^9` dependency ranges remain on the experimental implementation and do not silently
upgrade. Consumers moving to v10 must explicitly install `@babylonjs/lottie-player@^10` and migrate
to its worker-first API. There is no runtime compatibility wrapper.

For current source, documentation, releases, and support, use the standalone repository and
`@babylonjs/lottie-player` v10.

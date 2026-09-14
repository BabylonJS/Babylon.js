# USD loader fixtures

These small synthetic scenes are public test fixtures, not customer assets.
The Sandbox interaction suite loads `instances.usda`, `instances.usdc`, and
`instances.usdz` through the shipped OpenUSD worker and asserts that both
placements share one triangle geometry and retain their transforms.
`material-textures.*` covers a shared packed metallic/roughness map and
independent metallic, roughness, and occlusion maps with channel, color-space,
scale, and bias metadata.
The same fixture includes an asymmetric raw RGBA texture with affine emissive
scale/bias that produces an HDR result above 1.
`bind-pose.usda`, `point-instancer.usda`, and `morph-targets.usda` exercise
the shipped runtime's bind/rest matrices, thin-instance batches, and resolved
morph target animation.

Regenerate the binary fixtures from the checked-in USDA using OpenUSD tools:

```sh
cd packages/tools/babylonServer/public/babylonUsdImporter/testAssets
usdcat instances.usda -o instances.usdc
usdzip instances.usdz instances.usdc
usdcat material-textures.usda -o material-textures.usdc
usdzip material-textures.usdz material-textures.usdc texture.png asymmetric.png
```

Do not flatten: the test intentionally preserves the instanceable references.
`usdzip` produces the uncompressed, aligned ZIP entries required by USDZ.

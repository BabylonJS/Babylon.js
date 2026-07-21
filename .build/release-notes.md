
### Core

- feat(materials): add 2D array texture creation and image-source population - by [ryantrem](https://github.com/ryantrem) ([#18706](https://github.com/BabylonJS/Babylon.js/pull/18706))
- fix(build): resolve TS2304 in bundled .module.d.ts for XRBody and SPZ types - by [RaananW](https://github.com/RaananW) ([#18714](https://github.com/BabylonJS/Babylon.js/pull/18714))
- Fix .pure.ts transitive side-effect regressions (SceneLoader, depth-stencil, WGSL depth shaders) - by [RaananW](https://github.com/RaananW) ([#18717](https://github.com/BabylonJS/Babylon.js/pull/18717))
- Fix NodeMaterial overlighting under HDR from default image-processing config - by [RaananW](https://github.com/RaananW) ([#18704](https://github.com/BabylonJS/Babylon.js/pull/18704))
- Physics Controller shape options - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#18716](https://github.com/BabylonJS/Babylon.js/pull/18716))
- Coerce native dynamic texture dimensions before allocation - by [matthargett](https://github.com/matthargett) ([#18709](https://github.com/BabylonJS/Babylon.js/pull/18709))
- Fix: GaussianSplattingStream misclassified as an ordinary mesh, causing severe rendering slowdowns - by [raymondyfei](https://github.com/raymondyfei) ([#18707](https://github.com/BabylonJS/Babylon.js/pull/18707))
- Fix: IBL shadow procedural textures keep rendering every frame after being toggled off - by [raymondyfei](https://github.com/raymondyfei) ([#18708](https://github.com/BabylonJS/Babylon.js/pull/18708))
- Fix world region crash - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#18705](https://github.com/BabylonJS/Babylon.js/pull/18705))
- Fix physics plugin not releasing empty Havok world regions - by [BarthPaleologue](https://github.com/BarthPaleologue) ([#18699](https://github.com/BabylonJS/Babylon.js/pull/18699))
- feat(flowGraph): edit live scenes from the Flow Graph Editor + Inspector - by [RaananW](https://github.com/RaananW) ([#18695](https://github.com/BabylonJS/Babylon.js/pull/18695))

### GUI

- Fix Line.connectedControl with adaptive scaling - [_Bug Fix_] by [AmoebaChant](https://github.com/AmoebaChant) ([#18703](https://github.com/BabylonJS/Babylon.js/pull/18703))

### Inspector

- fix(inspector): correct malformed gif.worker.js CDN URL - by [RaananW](https://github.com/RaananW) ([#18712](https://github.com/BabylonJS/Babylon.js/pull/18712))
- fix(inspector-v2): don't flood scene explorer with per-frame active camera notifications - by [marns](https://github.com/marns) ([#18700](https://github.com/BabylonJS/Babylon.js/pull/18700))
- feat(flowGraph): edit live scenes from the Flow Graph Editor + Inspector - by [RaananW](https://github.com/RaananW) ([#18695](https://github.com/BabylonJS/Babylon.js/pull/18695))

### Loaders

- Preserve FBX skeletal animations through GLB round trips - [_Bug Fix_] by [alexchuber](https://github.com/alexchuber) ([#18715](https://github.com/BabylonJS/Babylon.js/pull/18715))
- Fix: GaussianSplattingStream misclassified as an ordinary mesh, causing severe rendering slowdowns - by [raymondyfei](https://github.com/raymondyfei) ([#18707](https://github.com/BabylonJS/Babylon.js/pull/18707))

### Viewer

- Fix: GaussianSplattingStream misclassified as an ordinary mesh, causing severe rendering slowdowns - by [raymondyfei](https://github.com/raymondyfei) ([#18707](https://github.com/BabylonJS/Babylon.js/pull/18707))

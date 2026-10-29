
### Core

- Add render-pass command stream batching for native hosts - by [matthargett](https://github.com/matthargett) ([#19075](https://github.com/BabylonJS/Babylon.js/pull/19075))
- Clustered lighting: sheen uses the out-of-scope normalW (WGSL/GLSL compile error) - by [increasinglyHuman](https://github.com/increasinglyHuman) ([#19049](https://github.com/BabylonJS/Babylon.js/pull/19049))
- WebGPU: GPU frame time with timestamp writes, read after the frame's submit - by [enriqxxx](https://github.com/enriqxxx) ([#19066](https://github.com/BabylonJS/Babylon.js/pull/19066))
- Fix WGSL StandardMaterial fresnel blend and area light check - by [RizgarOzan](https://github.com/RizgarOzan) ([#19074](https://github.com/BabylonJS/Babylon.js/pull/19074))
- RenderTargetTexture: a fresh render id before each pass - by [enriqxxx](https://github.com/enriqxxx) ([#19073](https://github.com/BabylonJS/Babylon.js/pull/19073))
- Temporal view data in the scene uniform buffer for WGSL: camera history and TAA jitter - by [enriqxxx](https://github.com/enriqxxx) ([#19038](https://github.com/BabylonJS/Babylon.js/pull/19038))
- Meshes: keep no Vector3 per vertex when a mesh's positions are its geometry's - by [enriqxxx](https://github.com/enriqxxx) ([#19065](https://github.com/BabylonJS/Babylon.js/pull/19065))
- KHR_materials_scatter import/export - [_New Feature_] by [MiiBond](https://github.com/MiiBond) ([#18810](https://github.com/BabylonJS/Babylon.js/pull/18810))
- Materials: keep pipeline names and plugin declarations as flat strings - by [enriqxxx](https://github.com/enriqxxx) ([#19060](https://github.com/BabylonJS/Babylon.js/pull/19060))
- Fix solid particle winding for glTF model meshes - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#19058](https://github.com/BabylonJS/Babylon.js/pull/19058))
- Gaussian Splatting: fix WebGPU texture fetch performance and add opt-in GPU depth sort - [_New Feature_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#19013](https://github.com/BabylonJS/Babylon.js/pull/19013))
- Fix HtmlTexture rendering with current HTML-in-Canvas APIs - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#19052](https://github.com/BabylonJS/Babylon.js/pull/19052))

### Inspector

- Add Inspector Lite skeleton, morph, and particle inspection - by [ryantrem](https://github.com/ryantrem) ([#19071](https://github.com/BabylonJS/Babylon.js/pull/19071))
- fix(inspector-v2): fall back to Unknown class name when getClassName is absent - by [peda-cos](https://github.com/peda-cos) ([#18998](https://github.com/BabylonJS/Babylon.js/pull/18998))

### Loaders

- KHR_materials_scatter import/export - [_New Feature_] by [MiiBond](https://github.com/MiiBond) ([#18810](https://github.com/BabylonJS/Babylon.js/pull/18810))
- Handle omitted glTF morph target attributes - by [bghgary](https://github.com/bghgary) ([#19064](https://github.com/BabylonJS/Babylon.js/pull/19064))
- Gaussian Splatting: fix WebGPU texture fetch performance and add opt-in GPU depth sort - [_New Feature_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#19013](https://github.com/BabylonJS/Babylon.js/pull/19013))

### Serializers

- KHR_materials_scatter import/export - [_New Feature_] by [MiiBond](https://github.com/MiiBond) ([#18810](https://github.com/BabylonJS/Babylon.js/pull/18810))

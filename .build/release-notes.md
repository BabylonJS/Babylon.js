
### Core

- feat: HTML-in-Canvas (WICG) support — HtmlTexture, interaction managers, polyfill installer - by [RaananW](https://github.com/RaananW) ([#18604](https://github.com/BabylonJS/Babylon.js/pull/18604))
- Fix Gaussian Splatting GPU picking and IBL voxelization - by [raymondyfei](https://github.com/raymondyfei) ([#18612](https://github.com/BabylonJS/Babylon.js/pull/18612))
- Flow Graph Editor: playground snippet auto-load, no auto-run on load, and stopped-state variable types - by [RaananW](https://github.com/RaananW) ([#18611](https://github.com/BabylonJS/Babylon.js/pull/18611))
- IBL Shadows frame graph hardening - by [MiiBond](https://github.com/MiiBond) ([#18608](https://github.com/BabylonJS/Babylon.js/pull/18608))
- Report engine.name "Native" and implement updateTextureData - by [bkaradzic-microsoft](https://github.com/bkaradzic-microsoft) ([#18566](https://github.com/BabylonJS/Babylon.js/pull/18566))
- GS + bucket sort + RH - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#18606](https://github.com/BabylonJS/Babylon.js/pull/18606))
- Fix RectAreaLight serialization: position, photometric scale, and emission texture - by [SergioRZMasson](https://github.com/SergioRZMasson) ([#18605](https://github.com/BabylonJS/Babylon.js/pull/18605))
- fix overrides on morphs - by [sebavan](https://github.com/sebavan) ([#18595](https://github.com/BabylonJS/Babylon.js/pull/18595))
- fix(AudioV2): apply play options when resuming a paused sound - by [RaananW](https://github.com/RaananW) ([#18601](https://github.com/BabylonJS/Babylon.js/pull/18601))
- Add canvasTabIndex engine option - by [RaananW](https://github.com/RaananW) ([#18598](https://github.com/BabylonJS/Babylon.js/pull/18598))
- Fix VideoTexture not updating under WebGPU FAST snapshot rendering - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#18591](https://github.com/BabylonJS/Babylon.js/pull/18591))
- Decouple camera inertia glide cutoff from camera.speed - by [georginahalpern](https://github.com/georginahalpern) ([#18589](https://github.com/BabylonJS/Babylon.js/pull/18589))
- GS streaming lod part3 - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#18588](https://github.com/BabylonJS/Babylon.js/pull/18588))
- Add cube render target support to the native engine - by [bkaradzic-microsoft](https://github.com/bkaradzic-microsoft) ([#18561](https://github.com/BabylonJS/Babylon.js/pull/18561))

### GUI

- build(treeshaking): make gui/loaders/serializers side-effect-free (.pure/.types split) - by [RaananW](https://github.com/RaananW) ([#18610](https://github.com/BabylonJS/Babylon.js/pull/18610))

### Loaders

- build(treeshaking): make gui/loaders/serializers side-effect-free (.pure/.types split) - by [RaananW](https://github.com/RaananW) ([#18610](https://github.com/BabylonJS/Babylon.js/pull/18610))
- Fix glTF morph target animation stutter from shader recompiles - [_Bug Fix_] by [PatrickRyanMS](https://github.com/PatrickRyanMS) ([#18596](https://github.com/BabylonJS/Babylon.js/pull/18596))
- fix(OBJ): Guard empty vertex buffers when normals/uvs/colors are absent - by [raymondyfei](https://github.com/raymondyfei) ([#18597](https://github.com/BabylonJS/Babylon.js/pull/18597))
- fix(SPLAT): Fix GSplat PLY misclassified as point cloud when both RGB and f_dc colors present - by [raymondyfei](https://github.com/raymondyfei) ([#18593](https://github.com/BabylonJS/Babylon.js/pull/18593))
- GS streaming lod part3 - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#18588](https://github.com/BabylonJS/Babylon.js/pull/18588))

### Playground

- fix(playground): declare uuid as a direct dependency to fix broken build - by [RaananW](https://github.com/RaananW) ([#18609](https://github.com/BabylonJS/Babylon.js/pull/18609))
- Playground: support importing external resources by absolute URL - by [RaananW](https://github.com/RaananW) ([#18599](https://github.com/BabylonJS/Babylon.js/pull/18599))

### Sandbox

- fix(sandbox): import LoadingScreen side-effect in renderingZone - by [RaananW](https://github.com/RaananW) ([#18614](https://github.com/BabylonJS/Babylon.js/pull/18614))
- Add FBX support to the Sandbox - [_New Feature_] by [PatrickRyanMS](https://github.com/PatrickRyanMS) ([#18607](https://github.com/BabylonJS/Babylon.js/pull/18607))

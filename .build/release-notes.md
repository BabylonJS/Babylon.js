
### Addons

- Fix AtmospherePBRMaterialPlugin breaking PBRMaterial compile for non-irradiance-map envs - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#18385](https://github.com/BabylonJS/Babylon.js/pull/18385))

### Core

- Reduce hot path allocations in core - by [RaananW](https://github.com/RaananW) ([#18397](https://github.com/BabylonJS/Babylon.js/pull/18397))
- ray: per-instance bounding-info culling for thin-instance picking - by [kzhsw](https://github.com/kzhsw) ([#18376](https://github.com/BabylonJS/Babylon.js/pull/18376))
- Add scene options to set default layer masks - by [tholub99](https://github.com/tholub99) ([#18382](https://github.com/BabylonJS/Babylon.js/pull/18382))
- Fix ClusteredLightContainer.maxRange ignored for some lights - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#18395](https://github.com/BabylonJS/Babylon.js/pull/18395))
- fix(scene): include procedural textures in Scene.isReady() - by [VicenteCartas](https://github.com/VicenteCartas) ([#18391](https://github.com/BabylonJS/Babylon.js/pull/18391))
- Inspector: switch picking to GPU picking - [_Bug Fix_] by [ryantrem](https://github.com/ryantrem) ([#18390](https://github.com/BabylonJS/Babylon.js/pull/18390))
- Fix Flow Graph Editor: console log templates, mesh pick events, drag-and-drop, event block UI - by [RaananW](https://github.com/RaananW) ([#18387](https://github.com/BabylonJS/Babylon.js/pull/18387))
- fix(depthRenderer): key Scene._depthRenderer by camera.uniqueId instead of camera.id - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#18384](https://github.com/BabylonJS/Babylon.js/pull/18384))
- OpenPBRMaterial energy compensation - by [MiiBond](https://github.com/MiiBond) ([#18377](https://github.com/BabylonJS/Babylon.js/pull/18377))
- OpenPBR Thin-walled fixes - by [MiiBond](https://github.com/MiiBond) ([#18353](https://github.com/BabylonJS/Babylon.js/pull/18353))
- fix(core): serialize freezeWorldMatrix for Mesh and TransformNode - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#18373](https://github.com/BabylonJS/Babylon.js/pull/18373))
- Fix WebGPU support for non-4x4 ASTC compressed textures - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#18369](https://github.com/BabylonJS/Babylon.js/pull/18369))
- GaussianSplatting: use view-backed retained part sources for compound rebuilds - by [kzhsw](https://github.com/kzhsw) ([#18361](https://github.com/BabylonJS/Babylon.js/pull/18361))
- perf(OpenPBRMaterial): skip inactive SSS uniforms and remove per-frame allocations in bindForSubMesh - by [Popov72](https://github.com/Popov72) ([#18364](https://github.com/BabylonJS/Babylon.js/pull/18364))

### GUI

- Fix InputText not calling preventDefault for printable characters - [_Bug Fix_] by [AmoebaChant](https://github.com/AmoebaChant) ([#18399](https://github.com/BabylonJS/Babylon.js/pull/18399))
- build: migrate tool editors from webpack to Vite dev server - by [RaananW](https://github.com/RaananW) ([#18372](https://github.com/BabylonJS/Babylon.js/pull/18372))

### Inspector

- Inspector: switch picking to GPU picking - [_Bug Fix_] by [ryantrem](https://github.com/ryantrem) ([#18390](https://github.com/BabylonJS/Babylon.js/pull/18390))
- OpenPBR Thin-walled fixes - by [MiiBond](https://github.com/MiiBond) ([#18353](https://github.com/BabylonJS/Babylon.js/pull/18353))

### Loaders

- OpenPBR Thin-walled fixes - by [MiiBond](https://github.com/MiiBond) ([#18353](https://github.com/BabylonJS/Babylon.js/pull/18353))

### Lottie Player

- Lottie: auto-downscale oversized sprites to fit the atlas instead of clipping - [_Bug Fix_] by [VicenteCartas](https://github.com/VicenteCartas) ([#18375](https://github.com/BabylonJS/Babylon.js/pull/18375))
- Lottie player: gradient stroke support, animated property fixes, and improved diagnostics - [_Bug Fix_] by [VicenteCartas](https://github.com/VicenteCartas) ([#18367](https://github.com/BabylonJS/Babylon.js/pull/18367))

### Materials

- Materials Library: add native WGSL shaders for all materials - by [Popov72](https://github.com/Popov72) ([#18393](https://github.com/BabylonJS/Babylon.js/pull/18393))

### Node Editor

- build: migrate tool editors from webpack to Vite dev server - by [RaananW](https://github.com/RaananW) ([#18372](https://github.com/BabylonJS/Babylon.js/pull/18372))

### Node Geometry Editor

- build: migrate tool editors from webpack to Vite dev server - by [RaananW](https://github.com/RaananW) ([#18372](https://github.com/BabylonJS/Babylon.js/pull/18372))

### Node Particle Editor

- build: migrate tool editors from webpack to Vite dev server - by [RaananW](https://github.com/RaananW) ([#18372](https://github.com/BabylonJS/Babylon.js/pull/18372))

### Node Render Graph Editor

- build: migrate tool editors from webpack to Vite dev server - by [RaananW](https://github.com/RaananW) ([#18372](https://github.com/BabylonJS/Babylon.js/pull/18372))

### Playground

- build: migrate tool editors from webpack to Vite dev server - by [RaananW](https://github.com/RaananW) ([#18372](https://github.com/BabylonJS/Babylon.js/pull/18372))

### Sandbox

- build: migrate tool editors from webpack to Vite dev server - by [RaananW](https://github.com/RaananW) ([#18372](https://github.com/BabylonJS/Babylon.js/pull/18372))

### Serializers

- OpenPBRMaterial energy compensation - by [MiiBond](https://github.com/MiiBond) ([#18377](https://github.com/BabylonJS/Babylon.js/pull/18377))
- OpenPBR Thin-walled fixes - by [MiiBond](https://github.com/MiiBond) ([#18353](https://github.com/BabylonJS/Babylon.js/pull/18353))

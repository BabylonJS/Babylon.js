
### Addons

- fix(addons): render atmosphere PBR materials in their creation frame - by [RaananW](https://github.com/RaananW) ([#18670](https://github.com/BabylonJS/Babylon.js/pull/18670))

### Core

- Add an `emitRateControl` setter to `GPUParticleSystem` - by [VicenteCartas](https://github.com/VicenteCartas) ([#18674](https://github.com/BabylonJS/Babylon.js/pull/18674))
- Preserve particle texture settings when serializing by reference - by [VicenteCartas](https://github.com/VicenteCartas) ([#18673](https://github.com/BabylonJS/Babylon.js/pull/18673))
- Fix ParticleSystem.clone() / GPUParticleSystem.clone() changing the particle texture - [_Bug Fix_] by [VicenteCartas](https://github.com/VicenteCartas) ([#18672](https://github.com/BabylonJS/Babylon.js/pull/18672))
- fix: restore side-effect registrations dropped by the 9.15 pure/non-pure split - by [RaananW](https://github.com/RaananW) ([#18671](https://github.com/BabylonJS/Babylon.js/pull/18671))
- fix(AudioV2): propagate live loopStart/loopEnd changes to playing static sounds - by [RaananW](https://github.com/RaananW) ([#18669](https://github.com/BabylonJS/Babylon.js/pull/18669))
- WebGPU projection layer + render target provider - by [RaananW](https://github.com/RaananW) ([#18655](https://github.com/BabylonJS/Babylon.js/pull/18655))
- fix(AudioV2): resume looping static sound from correct position with loopStart/loopEnd - by [RaananW](https://github.com/RaananW) ([#18661](https://github.com/BabylonJS/Babylon.js/pull/18661))
- Fix lighting volume WGSL depth texture binding - by [matthargett](https://github.com/matthargett) ([#18658](https://github.com/BabylonJS/Babylon.js/pull/18658))
- TC39 migration: flip experimentalDecorators to Stage 3 decorators (atomic) - by [RaananW](https://github.com/RaananW) ([#18647](https://github.com/BabylonJS/Babylon.js/pull/18647))
- fix(core): shrink thin-engine bundle (remove fileTools force-link + thin-closure stubs) - by [RaananW](https://github.com/RaananW) ([#18656](https://github.com/BabylonJS/Babylon.js/pull/18656))
- WebGPU-compatible XR session + XRGPUBinding plumbing - by [RaananW](https://github.com/RaananW) ([#18650](https://github.com/BabylonJS/Babylon.js/pull/18650))
- WebGPU-XR Phase 0: decouple WebXR from WebGL with API-agnostic seams - by [RaananW](https://github.com/RaananW) ([#18645](https://github.com/BabylonJS/Babylon.js/pull/18645))

### GUI

- TC39 migration: flip experimentalDecorators to Stage 3 decorators (atomic) - by [RaananW](https://github.com/RaananW) ([#18647](https://github.com/BabylonJS/Babylon.js/pull/18647))

### Inspector

- Add support for loading .babylonproj files in Sandbox - [_New Feature_] by [georginahalpern](https://github.com/georginahalpern) ([#18666](https://github.com/BabylonJS/Babylon.js/pull/18666))
- feat(inspector): expose PBR metallic texture channel mapping (glTF ORM) - by [ryantrem](https://github.com/ryantrem) ([#18667](https://github.com/BabylonJS/Babylon.js/pull/18667))

### Loaders

- KHR_gaussian_splatting gltf extension - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#18659](https://github.com/BabylonJS/Babylon.js/pull/18659))

### Materials

- TC39 migration: flip experimentalDecorators to Stage 3 decorators (atomic) - by [RaananW](https://github.com/RaananW) ([#18647](https://github.com/BabylonJS/Babylon.js/pull/18647))

### Node Editor

- TC39 migration: flip experimentalDecorators to Stage 3 decorators (atomic) - by [RaananW](https://github.com/RaananW) ([#18647](https://github.com/BabylonJS/Babylon.js/pull/18647))

### Node Geometry Editor

- TC39 migration: flip experimentalDecorators to Stage 3 decorators (atomic) - by [RaananW](https://github.com/RaananW) ([#18647](https://github.com/BabylonJS/Babylon.js/pull/18647))

### Node Particle Editor

- TC39 migration: flip experimentalDecorators to Stage 3 decorators (atomic) - by [RaananW](https://github.com/RaananW) ([#18647](https://github.com/BabylonJS/Babylon.js/pull/18647))

### Node Render Graph Editor

- TC39 migration: flip experimentalDecorators to Stage 3 decorators (atomic) - by [RaananW](https://github.com/RaananW) ([#18647](https://github.com/BabylonJS/Babylon.js/pull/18647))

### Playground

- TC39 migration: flip experimentalDecorators to Stage 3 decorators (atomic) - by [RaananW](https://github.com/RaananW) ([#18647](https://github.com/BabylonJS/Babylon.js/pull/18647))

### Sandbox

- Add support for loading .babylonproj files in Sandbox - [_New Feature_] by [georginahalpern](https://github.com/georginahalpern) ([#18666](https://github.com/BabylonJS/Babylon.js/pull/18666))

### Serializers

- TC39 migration: flip experimentalDecorators to Stage 3 decorators (atomic) - by [RaananW](https://github.com/RaananW) ([#18647](https://github.com/BabylonJS/Babylon.js/pull/18647))

### Smart Filters

- TC39 migration: flip experimentalDecorators to Stage 3 decorators (atomic) - by [RaananW](https://github.com/RaananW) ([#18647](https://github.com/BabylonJS/Babylon.js/pull/18647))

### Viewer

- TC39 migration: flip experimentalDecorators to Stage 3 decorators (atomic) - by [RaananW](https://github.com/RaananW) ([#18647](https://github.com/BabylonJS/Babylon.js/pull/18647))
- Viewer: Treat OpenPBRMaterial as PBR for light setup - by [MiiBond](https://github.com/MiiBond) ([#18622](https://github.com/BabylonJS/Babylon.js/pull/18622))
- Upgrade Vite to 8.1.3 (Rolldown) for faster tool builds - by [RaananW](https://github.com/RaananW) ([#18649](https://github.com/BabylonJS/Babylon.js/pull/18649))

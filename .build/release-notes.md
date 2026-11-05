
### Core

- Shader preprocessor: #if !X is #if !defined(X) - by [enriqxxx](https://github.com/enriqxxx) ([#19098](https://github.com/BabylonJS/Babylon.js/pull/19098))
- Flow Graph Editor: add sound reactions and diagnostics - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#19102](https://github.com/BabylonJS/Babylon.js/pull/19102))
- WebGPU: invalidate cached draws when vertex buffers change - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#19051](https://github.com/BabylonJS/Babylon.js/pull/19051))
- WebGPU: createRenderPipelineAsync prewarms the front face the draws of the mesh use - by [enriqxxx](https://github.com/enriqxxx) ([#19108](https://github.com/BabylonJS/Babylon.js/pull/19108))
- Add bent-normal reflection occlusion - by [sebavan](https://github.com/sebavan) ([#19069](https://github.com/BabylonJS/Babylon.js/pull/19069))
- WebGPU: createRenderPipelineAsync can prewarm the pipeline of draws that bind depth or unfilterable float textures - by [enriqxxx](https://github.com/enriqxxx) ([#19107](https://github.com/BabylonJS/Babylon.js/pull/19107))
- WebGPU: maxFramesInFlight, a limit on the frames the GPU has in flight (opt-in) - by [enriqxxx](https://github.com/enriqxxx) ([#19093](https://github.com/BabylonJS/Babylon.js/pull/19093))
- Skip zero-count Buffer.updateDirectly uploads - by [RizgarOzan](https://github.com/RizgarOzan) ([#19100](https://github.com/BabylonJS/Babylon.js/pull/19100))
- Copy assigned by-value parameters when inlining shader functions - [_Bug Fix_] by [bkaradzic-microsoft](https://github.com/bkaradzic-microsoft) ([#19077](https://github.com/BabylonJS/Babylon.js/pull/19077))
- Fix DirectionalLight fixed-frustum shadows under reverse depth - by [christabone](https://github.com/christabone) ([#19056](https://github.com/BabylonJS/Babylon.js/pull/19056))
- Fix HDR texture support in volumetric light scattering - by [BarthPaleologue](https://github.com/BarthPaleologue) ([#19036](https://github.com/BabylonJS/Babylon.js/pull/19036))
- Fix duplicate depth texture entry in the WebGPU MRT texture cache - by [Bboissen](https://github.com/Bboissen) ([#19045](https://github.com/BabylonJS/Babylon.js/pull/19045))
- Preserve direct draws without native command batching - by [Popov72](https://github.com/Popov72) ([#19076](https://github.com/BabylonJS/Babylon.js/pull/19076))

### Inspector

- Add bent-normal reflection occlusion - by [sebavan](https://github.com/sebavan) ([#19069](https://github.com/BabylonJS/Babylon.js/pull/19069))

### Loaders

- Fix FBX animation refinement growing across bones - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#19050](https://github.com/BabylonJS/Babylon.js/pull/19050))
- Load glTF Gaussian splats compressed with KHR_gaussian_splatting_compression_spz - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#19106](https://github.com/BabylonJS/Babylon.js/pull/19106))

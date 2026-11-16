
### Core

- Native: only filter depth textures that use a comparison function - [_Bug Fix_] by [bkaradzic-microsoft](https://github.com/bkaradzic-microsoft) ([#19153](https://github.com/BabylonJS/Babylon.js/pull/19153))
- Native: support alpha-to-coverage - [_Bug Fix_] by [bkaradzic-microsoft](https://github.com/bkaradzic-microsoft) ([#19148](https://github.com/BabylonJS/Babylon.js/pull/19148))
- Gaussian Splatting: back streaming atlases with render targets on Native - [_Bug Fix_] by [bkaradzic-microsoft](https://github.com/bkaradzic-microsoft) ([#19144](https://github.com/BabylonJS/Babylon.js/pull/19144))
- Native: sort Gaussian splat ranges and compound parts with sortSplatIndices - [_Bug Fix_] by [bkaradzic-microsoft](https://github.com/bkaradzic-microsoft) ([#19141](https://github.com/BabylonJS/Babylon.js/pull/19141))
- Support ALPHA_MIN/ALPHA_MAX on NativeEngine - [_Bug Fix_] by [bkaradzic-microsoft](https://github.com/bkaradzic-microsoft) ([#19139](https://github.com/BabylonJS/Babylon.js/pull/19139))
- Decode meshopt on the main thread when Worker is unavailable - [_Bug Fix_] by [bkaradzic-microsoft](https://github.com/bkaradzic-microsoft) ([#19138](https://github.com/BabylonJS/Babylon.js/pull/19138))
- Apply glTF normalized override when Draco decodes without workers - [_Bug Fix_] by [bkaradzic-microsoft](https://github.com/bkaradzic-microsoft) ([#19137](https://github.com/BabylonJS/Babylon.js/pull/19137))
- Fix undefined shader math in SSAO2 and IBL shadow tracing - [_Bug Fix_] by [bkaradzic-microsoft](https://github.com/bkaradzic-microsoft) ([#19136](https://github.com/BabylonJS/Babylon.js/pull/19136))
- WebGPU snapshot: encode unchanged draws again from their recorded commands - by [enriqxxx](https://github.com/enriqxxx) ([#19089](https://github.com/BabylonJS/Babylon.js/pull/19089))
- Deprecate HTML-in-Canvas polyfill installer in favor of up-to-date polyfills - by [RaananW](https://github.com/RaananW) ([#19132](https://github.com/BabylonJS/Babylon.js/pull/19132))
- Texture.replaceImage: take the image of another texture, already loaded - by [enriqxxx](https://github.com/enriqxxx) ([#19099](https://github.com/BabylonJS/Babylon.js/pull/19099))
- Fix JSDoc defaults that disagree with the code - by [ZainnQureshii](https://github.com/ZainnQureshii) ([#19126](https://github.com/BabylonJS/Babylon.js/pull/19126))
- Fix TAA reprojection with instances: previous world matrices for the linear velocity prepass - by [enriqxxx](https://github.com/enriqxxx) ([#19024](https://github.com/BabylonJS/Babylon.js/pull/19024))
- Fix WebGPU draws using the destroyed gpu texture after InternalTexture.updateSize - by [serdarucel](https://github.com/serdarucel) ([#19123](https://github.com/BabylonJS/Babylon.js/pull/19123))
- AutoReleaseWorkerPool: keep idle workers for an idle time setTimeout cannot hold - by [enriqxxx](https://github.com/enriqxxx) ([#19083](https://github.com/BabylonJS/Babylon.js/pull/19083))
- SubMesh.setIndirectDrawBuffer: draw a sub mesh with arguments written on the GPU, per render pass (WebGPU) - by [enriqxxx](https://github.com/enriqxxx) ([#19097](https://github.com/BabylonJS/Babylon.js/pull/19097))
- Retain, replay and report render-pass command stream batches - by [matthargett](https://github.com/matthargett) ([#19084](https://github.com/BabylonJS/Babylon.js/pull/19084))

### GUI

- Fix JSDoc defaults that disagree with the code - by [ZainnQureshii](https://github.com/ZainnQureshii) ([#19126](https://github.com/BabylonJS/Babylon.js/pull/19126))

### Inspector

- Update @babylonjs/lite to 1.39.1 - by [RaananW](https://github.com/RaananW) ([#19133](https://github.com/BabylonJS/Babylon.js/pull/19133))

### Loaders

- Stabilize Windows CI unit tests - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#19134](https://github.com/BabylonJS/Babylon.js/pull/19134))

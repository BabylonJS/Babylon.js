
### Core

- Native parity fixes: shaders, compute, particles, codecs, clustered lights - [_Bug Fix_] by [bkaradzic-microsoft](https://github.com/bkaradzic-microsoft) ([#19043](https://github.com/BabylonJS/Babylon.js/pull/19043))
- Allow WebGPUEngine.dispose() when initialization did not complete - by [Bboissen](https://github.com/Bboissen) ([#19046](https://github.com/BabylonJS/Babylon.js/pull/19046))
- KTX2: transfer a loaded file to the worker, and free the levels once uploaded - by [enriqxxx](https://github.com/enriqxxx) ([#19059](https://github.com/BabylonJS/Babylon.js/pull/19059))
- Integrate native canvas texture updates and font metrics - by [bkaradzic-microsoft](https://github.com/bkaradzic-microsoft) ([#19041](https://github.com/BabylonJS/Babylon.js/pull/19041))
- Rebuild scene geometries when the WebGPU engine restores its buffers - by [christabone](https://github.com/christabone) ([#19055](https://github.com/BabylonJS/Babylon.js/pull/19055))
- Fix early shader compilation notifications with parallel WebGL compilation - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#19057](https://github.com/BabylonJS/Babylon.js/pull/19057))
- CSM: cascades in a per-generator uniform buffer for WGSL receivers - by [enriqxxx](https://github.com/enriqxxx) ([#19037](https://github.com/BabylonJS/Babylon.js/pull/19037))
- Fix disposed Gaussian splat meshes staying in memory with their splat data - by [Arthur031221](https://github.com/Arthur031221) ([#19047](https://github.com/BabylonJS/Babylon.js/pull/19047))
- Fix WGSL preLightingInfo struct when iridescence and area lights are both used - by [Bboissen](https://github.com/Bboissen) ([#19044](https://github.com/BabylonJS/Babylon.js/pull/19044))
- Fix MirrorTexture.dispose leaking its imageProcessing observer - by [christabone](https://github.com/christabone) ([#19035](https://github.com/BabylonJS/Babylon.js/pull/19035))

### GUI

- Fix GUI editor loading slowdown with adaptive scaling - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#19012](https://github.com/BabylonJS/Babylon.js/pull/19012))

### Inspector

- Inspector Lite: add Flow Graphs explorer parity (P8c) - [_New Feature_] by [ryantrem](https://github.com/ryantrem) ([#19040](https://github.com/BabylonJS/Babylon.js/pull/19040))

### Loaders

- Fix FBX import running out of memory on rigs with inherited bone scale - by [Arthur031221](https://github.com/Arthur031221) ([#19042](https://github.com/BabylonJS/Babylon.js/pull/19042))

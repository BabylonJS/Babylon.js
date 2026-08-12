
### Core

- GPU particles: re-bake gradient lookup textures in place for value edits - by [increasinglyHuman](https://github.com/increasinglyHuman) ([#18787](https://github.com/BabylonJS/Babylon.js/pull/18787))
- Fix Zstd-compressed UASTC textures failing to load (bytesPlane = 0) - by [alexchuber](https://github.com/alexchuber) ([#18793](https://github.com/BabylonJS/Babylon.js/pull/18793))
- Fix NativeEngine command scope leaking when a render throws - by [bkaradzic-microsoft](https://github.com/bkaradzic-microsoft) ([#18789](https://github.com/BabylonJS/Babylon.js/pull/18789))
- Fix WebGPU vertex layout pipeline cache collisions - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#18791](https://github.com/BabylonJS/Babylon.js/pull/18791))
- Feat: Stream Gaussian Splatting LOD as a part of a compound mesh - by [raymondyfei](https://github.com/raymondyfei) ([#18774](https://github.com/BabylonJS/Babylon.js/pull/18774))
- Fix: texture view leak on WebGPU backend - by [raymondyfei](https://github.com/raymondyfei) ([#18784](https://github.com/BabylonJS/Babylon.js/pull/18784))
- KHR_interactivity: importer update to the latest spec (refs, events, pointer selection, math ops) - by [SergioRZMasson](https://github.com/SergioRZMasson) ([#18615](https://github.com/BabylonJS/Babylon.js/pull/18615))
- feat(XR): support CPU depth sensing on WebGPU - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#18782](https://github.com/BabylonJS/Babylon.js/pull/18782))
- Fix GreasedLine corrupting the shared TmpVectors scratch slot and Vector3.UpReadOnly - by [bkaradzic-microsoft](https://github.com/bkaradzic-microsoft) ([#18781](https://github.com/BabylonJS/Babylon.js/pull/18781))
- Disable Space Warp before session creation - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#18780](https://github.com/BabylonJS/Babylon.js/pull/18780))
- feat(XR): add WebGPU quad layer path - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#18779](https://github.com/BabylonJS/Babylon.js/pull/18779))
- fix(XR): clear WebGPU AR projection textures - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#18778](https://github.com/BabylonJS/Babylon.js/pull/18778))
- Fix Tools.LoadScript treating ES module source as a URL on Babylon Native - by [bkaradzic-microsoft](https://github.com/bkaradzic-microsoft) ([#18776](https://github.com/BabylonJS/Babylon.js/pull/18776))

### Inspector

- Fix Reflector bridge relay dropping and crashing on client messages - [_Bug Fix_] by [ryantrem](https://github.com/ryantrem) ([#18800](https://github.com/BabylonJS/Babylon.js/pull/18800))
- Inspector v2: sort particle gradients before refresh - [_Bug Fix_] by [VicenteCartas](https://github.com/VicenteCartas) ([#18794](https://github.com/BabylonJS/Babylon.js/pull/18794))

### Loaders

- Make the glTF loader's unique root url actually unique - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#18798](https://github.com/BabylonJS/Babylon.js/pull/18798))
- Feat: Stream Gaussian Splatting LOD as a part of a compound mesh - by [raymondyfei](https://github.com/raymondyfei) ([#18774](https://github.com/BabylonJS/Babylon.js/pull/18774))
- KHR_interactivity: importer update to the latest spec (refs, events, pointer selection, math ops) - by [SergioRZMasson](https://github.com/SergioRZMasson) ([#18615](https://github.com/BabylonJS/Babylon.js/pull/18615))

### Sandbox

- KHR_interactivity: importer update to the latest spec (refs, events, pointer selection, math ops) - by [SergioRZMasson](https://github.com/SergioRZMasson) ([#18615](https://github.com/BabylonJS/Babylon.js/pull/18615))

### Viewer

- Enable Babylon Lite device-lost recovery in the Lite Viewer - [_New Feature_] by [ryantrem](https://github.com/ryantrem) ([#18785](https://github.com/BabylonJS/Babylon.js/pull/18785))

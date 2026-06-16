
### Core

- Add NullEngine multiview render-state testability - by [matthargett](https://github.com/matthargett) ([#18576](https://github.com/BabylonJS/Babylon.js/pull/18576))
- Fix GeospatialCamera zoom-while-rotating and updateFlyToDestination - [_Bug Fix_] by [georginahalpern](https://github.com/georginahalpern) ([#18582](https://github.com/BabylonJS/Babylon.js/pull/18582))
- Fix camera frozen in UMD build (inertia undefined): use local field instead of super.inertia accessor - by [georginahalpern](https://github.com/georginahalpern) ([#18580](https://github.com/BabylonJS/Babylon.js/pull/18580))
- Fix FreeCamera/FlyCamera input regression: apply active input below the legacy epsilon glide cutoff - [_Bug Fix_] by [georginahalpern](https://github.com/georginahalpern) ([#18578](https://github.com/BabylonJS/Babylon.js/pull/18578))
- Coalesce shared delay-loaded geometry/mesh file requests - [_Bug Fix_] by [georginahalpern](https://github.com/georginahalpern) ([#18570](https://github.com/BabylonJS/Babylon.js/pull/18570))
- GS Streaming - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#18563](https://github.com/BabylonJS/Babylon.js/pull/18563))
- fix(core): restore Buffers/buffer.align side effect for Native engine - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#18565](https://github.com/BabylonJS/Babylon.js/pull/18565))
- Fix(GreasedLine): guard grl_offsets behind GREASED_LINE_USE_OFFSETS in GLSL shaders (match WGSL) - by [bkaradzic-microsoft](https://github.com/bkaradzic-microsoft) ([#18571](https://github.com/BabylonJS/Babylon.js/pull/18571))
- Port framerate-independent camera movement and configurable input to FreeCamera and FlyCamera - by [georginahalpern](https://github.com/georginahalpern) ([#18573](https://github.com/BabylonJS/Babylon.js/pull/18573))
- Move scissor to core as an opt-in engine extension - by [AmoebaChant](https://github.com/AmoebaChant) ([#18547](https://github.com/BabylonJS/Babylon.js/pull/18547))

### Inspector

- GS Streaming - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#18563](https://github.com/BabylonJS/Babylon.js/pull/18563))

### Loaders

- GS Streaming - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#18563](https://github.com/BabylonJS/Babylon.js/pull/18563))

### Serializers

- Fix USDZ export for cached unsupported texture formats - [_Bug Fix_] by [alexchuber](https://github.com/alexchuber) ([#18559](https://github.com/BabylonJS/Babylon.js/pull/18559))

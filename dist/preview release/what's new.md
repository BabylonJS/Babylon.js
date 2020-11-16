# 5.0.0

## Major updates

## Updates

### General

- Added static CenterToRef for vectors 2/3/4  ([aWeirdo](https://github.com/aWeirdo))
=======
- Refactored React refs from old string API to React.createRef() API ([belfortk](https://github.com/belfortk))
- Scale on one axis for `BoundingBoxGizmo` ([cedricguillemet](https://github.com/cedricguillemet))
- Simplified code contributions by fully automating the dev setup with gitpod ([nisarhassan12](https://github.com/nisarhassan12))
- Add a `CascadedShadowMap.IsSupported` method and log an error instead of throwing an exception when CSM is not supported ([Popov72](https://github.com/Popov72))
- Added initial code for DeviceInputSystem ([PolygonalSun](https://github.com/PolygonalSun))
- Added support for `material.disableColorWrite` ([Deltakosh](https://github.com/deltakosh))
- The Mesh Asset Task also accepts File as sceneInput ([RaananW](https://github.com/RaananW))
- Added support preserving vert colors for CSG objects ([PirateJC](https://github.com/PirateJC))
- Added `boundingBoxRenderer.onBeforeBoxRenderingObservable` and `boundingBoxRenderer.onAfterBoxRenderingObservable` ([Deltakosh](https://github.com/deltakosh))
- Added initial code for user facing DeviceSourceManager ([PolygonalSun](https://github.com/PolygonalSun))
- Added a Simple and advanced timer, based on observables ([RaananW](https://github.com/RaananW))

### Engine

- Improved world matrix caching engine by using dirty mechanism on vector3 and quaternion ([Deltakosh](https://github.com/deltakosh))
- Allow logging of shader code when a compilation error occurs ([Popov72](https://github.com/Popov72))
- Add back support for selecting textures based on engine capabilities ([bghgary](https://github.com/bghgary))
- Fix Draco decoder when running on IE11 ([bghgary](https://github.com/bghgary))
- Change default camera calculations to only include visible and enabled meshes ([bghgary](https://github.com/bghgary))
- Optimized frozen instances ([Deltakosh](https://github.com/deltakosh))
- Add support for detail maps in both the standard and PBR materials ([Popov72](https://github.com/Popov72))
- Added abstractMesh method to get all particle systems that use the mesh as an emitter ([PirateJC](https://github.com/PirateJC))

### NME

- Frames are now resizable from the corners ([belfortk](https://github.com/belfortk))
- Can now rename and re-order frame inputs and outputs ([belfortk](https://github.com/belfortk))
- Can now edit Node port names ([belfortk](https://github.com/belfortk))
- Updated which node ports are shown on frames by default so that only node ports connected to outside nodes are by default exposed on the frame ([belfortk](https://github.com/belfortk))
- Added a modulo block ([ageneau](https://github.com/ageneau))
- Fix bug where frame port labels would be the names of incorrect nodes ([belfortk](https://github.com/belfortk))
- Fix bug where long comments on collapsed frames broke port alignment ([belfortk](https://github.com/belfortk))
- Add the `FragCoord` and `ScreenSize` blocks ([Popov72](https://github.com/Popov72))
- Particle systems: add the `ParticlePositionWorld` block ([Popov72](https://github.com/Popov72))
- Add isExposedOnFrame property to connection points ([belfortk](https://github.com/belfortk))
- Add support for exporting frames ([belfortk](https://github.com/belfortk))
- Add support for importing frames and their nodes (unconnected) and exposed frame ports ([belfortk](https://github.com/belfortk))

### Inspector

- Handle PBR colors as colors in linear space ([Popov72](https://github.com/Popov72))
- Allow removing textures ([Popov72](https://github.com/Popov72))
- Edit all textures (anisotropic, clear coat, sheen, ...) for the PBR materials ([Popov72](https://github.com/Popov72))
- Added right click options to create PBR and Standard Materials ([Deltakosh](https://github.com/deltakosh))
- Added support for recording GIF ([Deltakosh](https://github.com/deltakosh))
- Popup Window available (To be used in Curve Editor) ([pixelspace](https://github.com/devpixelspace))
- Add support to update inspector when switching to a new scene ([belfortk](https://github.com/belfortk))

### Cameras

- Fixed up vector not correctly handled with stereoscopic rig ([cedricguillemet](https://github.com/cedricguillemet))
- handle reattachment of panning button for `ArcRotateCamera` ([cedricguillemet](https://github.com/cedricguillemet))
- Added flag to TargetCamera to invert rotation direction and multiplier to adjust speed ([Exolun](https://github.com/Exolun))
- Added upwards and downwards keyboard input to `FreeCamera` ([Pheater](https://github.com/pheater))
- Handle scales in camera matrices ([Popov72](https://github.com/Popov72))

### Sprites

- Added support for 'sprite.useAlphaForPicking` to enable precise picking using sprite alpha ([Deltakosh](https://github.com/deltakosh))

### Physics

- Fixed time steps or delta time with sub time step for Oimo.js and Cannon.js ([cedricguillemet](https://github.com/cedricguillemet))
- Ammo.js collision group and mask supported by impostor parameters ([cedricguillemet](https://github.com/cedricguillemet))
- Ammo.js IDL exposed property update and raycast vehicle stablization support ([MackeyK24](https://github.com/MackeyK24))
- Recast.js plugin nav mesh and crowd agent to ref performance optimizations. ([MackeyK24](https://github.com/MackeyK24))
- Added `scene.physicsEnabled` boolean ([Deltakosh](https://github.com/deltakosh))

### Loaders

- Added support for glTF mesh instancing extension ([#7521](https://github.com/BabylonJS/Babylon.js/issues/7521)) ([drigax](https://github.com/Drigax))
- Get the list of cameras retrieved from a gLTF file when loaded through the asset container ([Popov72](https://github.com/Popov72))
- Fixed SceneLoader.ImportAnimations. Now targets nodes based on "targetProperty" ([#7931](https://github.com/BabylonJS/Babylon.js/issues/7931)) ([phenry20](https://github.com/phenry20))
- Renamed KHR_mesh_instancing extension to EXT_mesh_gpu_instancing ([#7945](https://github.com/BabylonJS/Babylon.js/issues/7945)) ([drigax](https://github.com/Drigax))
- Added support for KHR_materials_ior for glTF loader. ([Sebavan](https://github.com/sebavan/))
- Added support for KHR_materials_specular for glTF loader. ([Sebavan](https://github.com/sebavan/))
- Added support for KHR_xmp for glTF loader. ([Sebavan](https://github.com/sebavan/))
- Added support for KHR_materials_variants for glTF loader. ([MiiBond](https://github.com/MiiBond/))
- Added support for KHR_materials_transmission for glTF loader. ([MiiBond](https://github.com/MiiBond/))
- Improved progress handling in glTF loader. ([bghgary](https://github.com/bghgary))

### Navigation

- export/load prebuilt binary navigation mesh ([cedricguillemet](https://github.com/cedricguillemet))

### Materials

- Added an `OcclusionMaterial` to simplify depth-only rendering of geometry ([rgerd](https://github.com/rgerd))

## Bugs

- Fix issue with the Promise polyfill where a return value was expected from resolve() ([Deltakosh](https://github.com/deltakosh))
- Fix an issue with keyboard control (re)attachment. ([#9411](https://github.com/BabylonJS/Babylon.js/issues/9411)) ([RaananW](https://github.com/RaananW))

## Breaking changes

- Use both `mesh.visibility` and `material.alpha` values to compute the global alpha value used by the soft transparent shadow rendering code. Formerly was only using `mesh.visibility` ([Popov72](https://github.com/Popov72))

# 4.0.0

## Major updates

- Added support for [parallel shader compilation](https://www.khronos.org/registry/webgl/extensions/KHR_parallel_shader_compile/) ([Deltakosh](https://github.com/deltakosh))
@NEED DEMO- Added FlyCamera for free navigation in 3D space, with a limited set of settings ([Phuein](https://github.com/phuein))
@NEED DEMO- Added Object Based Motion Blur post-process ([julien-moreau](https://github.com/julien-moreau))
@NEED DEMO- WebXR ([TrevorDev](https://github.com/TrevorDev))
  - Add customAnimationFrameRequester to allow sessions to hook into engine's render loop ([TrevorDev](https://github.com/TrevorDev))
  - camera customDefaultRenderTarget to allow cameras to render to a custom render target (eg. xr framebuffer) instead of the canvas ([TrevorDev](https://github.com/TrevorDev))
  - webXR camera which can be updated by a webXRSession ([TrevorDev](https://github.com/TrevorDev))
  - webXRSessionManager to bridge xrSession to babylon's engine/camera ([TrevorDev](https://github.com/TrevorDev))
  - webXRExperienceHelper to setup a default XR experience ([TrevorDev](https://github.com/TrevorDev))

## Updates

### GUI

- Added `button.image` and `button.textBlock` to simplify access to button internal parts ([Deltakosh](https://github.com/deltakosh))

### Core Engine

- Refactored of the SolidParticleSystem code for performance and code quality improvement ([barroij](https://github.com/barroij))
- Added utility function `Tools.BuildArray` for array initialisation ([barroij](https://github.com/barroij))
- Introduced a new `IOfflineSupport` interface to hide IndexedDB ([Deltakosh](https://github.com/deltakosh))
- `PBRMaterial` and `StandardMaterial` now use hot swapping feature for shaders. This means they can keep using a previous shader while a new one is being compiled ([Deltakosh](https://github.com/deltakosh))
- Performance oriented changes ([barroij](https://github.com/barroij))
  - Prevented avoidable matrix inversion or square root computation
  - Enabled a removal in O(1) from the `transformNodes` array and `materials` array of the `Scene`. As a consequence, the order of the element within these arrays might change during a removal
  - Enabled a removal in O(1) from the `instances` array of a `Mesh`. As a consequence, the order of the element within this array might change during a removal
  - Stopped calling `Array.splice` on the `scene.meshes` array and on the `engine._uniformBuffer` when removing an element. As a consequence, the order of the element within these arrays might change during a removal
  - Added an option `useMaterialMeshMap` in the `Scene` constructor options. When set to true, each `Material` isntance will have and will keep up-to-date a map of its bound meshes. This is to avoid browsing all the meshes of the scene to retrieve the ones bound to the current material when disposing the Material. Disabled by default
  - Added an option `useClonedMeshhMap` in the `Scene` constructor options. When set to true, each `Mesh` will have and will keep up-to-date a map of cloned meshes. This is to avoid browsing all the meshes of the scene to retrieve the ones that have the current mesh as source mesh. Disabled by default
  - Added `blockfreeActiveMeshesAndRenderingGroups` property in the `Scene`, following the same model as `blockMaterialDirtyMechanism`. This is to avoid calling `Scene.freeActiveMeshes` and `Scene.freeRenderingGroups` for each disposed mesh when we dispose several meshes in a row. One have to set `blockfreeActiveMeshesAndRenderingGroups` to `true` just before disposing the meshes, and set it back to `false` just after
  - Prevented code from doing useless and possible time consuming computation when disposing the `ShaderMaterial` of a `LinesMesh`
- Align `BoundingBox` and `BoundingSphere` API and behavior for clarity and simplicity. As a consequence, the `BoundingBox`'s method `setWorldMatrix` has been removed and the underlying world matrix cannot be modified but by calling `reConstruct` or `update`. ([barroij](https://github.com/barroij))

### glTF Loader

### glTF Serializer

### Viewer

### Materials Library

## Bug fixes
- Add missing effect layer to asset container ([TrevorDev](https://github.com/TrevorDev))

### Core Engine
- Fixed a bug with `mesh.alwaysSelectAsActiveMesh` preventing layerMask to be taken in account ([Deltakosh](https://github.com/deltakosh))
- Fixed a bug with pointer up being fire twice ([Deltakosh](https://github.com/deltakosh))
- Fixed a bug with particle systems being update once per camera instead of once per frame ([Deltakosh](https://github.com/deltakosh))
- Handle properly the `LinesMesh` `intersectionThreshold` by using its value directly when the intersection against a `Ray` is checked, instead of extending the `BoundingInfo` accordingly ([barroij](https://github.com/barroij))
- Fixed the `LineEdgesRenderer` used for edge rendering of `LinesMesh` handle properly LinesMesh made of disconnected lines + Make it work for instance of `LinesMesh` ([barroij](https://github.com/barroij))
- Fixed `Matrix.toNormalMatrix`function ([barroij](https://github.com/barroij))
### Viewer

### Loaders

## Breaking changes

- `Database.IDBStorageEnabled` is now false by default ([Deltakosh](https://github.com/deltakosh))
- `Database.openAsync` was renamed by `Database.open` ([Deltakosh](https://github.com/deltakosh))
- `scene.database` was renamed to `scene.offlineProvider` ([Deltakosh](https://github.com/deltakosh))
- `BoundingBox.setWorldMatrix` was removed. `BoundingBox.getWorldMatrix` now returns a `Readonly<Matrix>` ([barroij](https://github.com/barroij))

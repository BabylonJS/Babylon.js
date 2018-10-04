# 4.0.0

## Major updates

- Added support for [parallel shader compilation](https://www.khronos.org/registry/webgl/extensions/KHR_parallel_shader_compile/) ([Deltakosh](https://github.com/deltakosh))
- Added FlyCamera for free navigation in 3D space, with a limited set of settings ([Phuein](https://github.com/phuein))
- Added Object Based Motion Blur post-process ([julien-moreau](https://github.com/julien-moreau))
- WebXR ([TrevorDev](https://github.com/TrevorDev))
  - customAnimationFrameRequester to allow sessions to hook into engine's render loop ([TrevorDev](https://github.com/TrevorDev))

## Updates

### GUI

### Core Engine

- Refactor of the SolidParticleSystem code for performance and code quality improvement ([barroij](https://github.com/barroij))
- Added utility function `Tools.BuildArray` for array initialisation ([barroij](https://github.com/barroij))
- Introduced a new `IOfflineSupport` interface to hide IndexedDB ([Deltakosh](https://github.com/deltakosh))
- `PBRMaterial` and `StandardMaterial` now use hot swapping feature for shaders. This means they can keep using a previous shader while a new one is being compiled ([Deltakosh](https://github.com/deltakosh))
- Performance oriented changes ([barroij](https://github.com/barroij))
  - prevent avoidable matrix inversion or square root computation.
  - enable a removal in O(1) from the `transformNodes`array of the Scene.

### glTF Loader

### glTF Serializer

### Viewer

### Materials Library

## Bug fixes

### Core Engine



### Viewer

### Loaders

## Breaking changes

- `Database.IDBStorageEnabled` is now false by default ([Deltakosh](https://github.com/deltakosh))
- `Database.openAsync` was renamed by `Database.open`

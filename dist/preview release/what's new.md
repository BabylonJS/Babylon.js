# 3.1.0:

## Major updates
- Added support for non-pow2 textures when in WebGL2 mode ([deltakosh](https://github.com/deltakosh))
- Engine can now be initialized with an existing webgl context ([deltakosh](https://github.com/deltakosh))
- Introduced behaviors. (Doc here)[http://doc.babylonjs.com/overviews/behaviors] ([deltakosh](https://github.com/deltakosh))
- New behaviors for ArcRotateCamera:
 - AutoRotation ([deltakosh](https://github.com/deltakosh))
 - Framing ([deltakosh](https://github.com/deltakosh))
 - Bouncing ([deltakosh](https://github.com/deltakosh))

## Updates
- POW2 textures rescale is now done by shaders (It was done using canvas before) ([deltakosh](https://github.com/deltakosh))
- Added `SceneLoader.CleanBoneMatrixWeights` to force the loader to normalize matrix weights when loading bones (off by default) ([deltakosh](https://github.com/deltakosh)) 
- Added `camera.onViewMatrixChangedObservable` and `camera.onProjectionMatrixChangedObservable` ([deltakosh](https://github.com/deltakosh))
- Added support for folders when drag'n'dropping into the sandbox ([deltakosh](https://github.com/deltakosh))
- Better serialization support ([deltakosh](https://github.com/deltakosh))
- Introduced `performanceMonitor` class to get better FPS analysis ([deltakosh](https://github.com/deltakosh))
- GUI: Added support for pointer move events on projected UI ([deltakosh](https://github.com/deltakosh))
- Normals are generated automatically by StandardMaterial if meshes do not have normals ([deltakosh](https://github.com/deltakosh))
- Added `mesh.onMaterialChangedObservable` to notify when a new material is set ([deltakosh](https://github.com/deltakosh))

## Bug fixes
- Fixed a bug with PBR on iOS ([sebavan](https://github.com/sebavan))

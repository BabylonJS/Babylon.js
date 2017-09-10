# 3.1.0:

## Major updates
- Added support for webgl context lost and restored events. [Doc here](http://doc.babylonjs.com/tutorials/optimizing_your_scene#handling-webgl-context-lost) ([deltakosh](https://github.com/deltakosh))
- Added support for non-pow2 textures when in WebGL2 mode ([deltakosh](https://github.com/deltakosh))
- Engine can now be initialized with an existing webgl context ([deltakosh](https://github.com/deltakosh))
- Introduced behaviors. [Doc here](http://doc.babylonjs.com/overviews/behaviors) ([deltakosh](https://github.com/deltakosh))
- Added support for WebGL Occlusion queries. [Doc here](http://doc.babylonjs.com/overviews/occlusionquery) ([Ibraheem Osama](https://github.com/IbraheemOsama))
- New behaviors for ArcRotateCamera [Doc here](http://doc.babylonjs.com/overviews/behaviors): 
  - AutoRotation ([deltakosh](https://github.com/deltakosh))
  - Framing ([deltakosh](https://github.com/deltakosh))
  - Bouncing ([deltakosh](https://github.com/deltakosh))
- New InputText for Babylon.GUI. [Doc here](http://doc.babylonjs.com/overviews/gui#inputtext) ([deltakosh](https://github.com/deltakosh))
- New VirtualKeyboard for Babylon.GUI. [Doc here](http://doc.babylonjs.com/overviews/gui#virtualkeyboard) ([deltakosh](https://github.com/deltakosh) / [adam](https://github.com/abow))
- Added support for depth pre-pass rendering. [Doc here](http://doc.babylonjs.com/tutorials/transparency_and_how_meshes_are_rendered#depth-pre-pass-meshes) ([deltakosh](https://github.com/deltakosh))

## Updates
- New `camera.storeState()` and `camera.restoreState()` functions to store / restore cameras position / rotation / fov. (Doc here)[http://doc.babylonjs.com/tutorials/cameras#state] ([deltakosh](https://github.com/deltakosh))
- POW2 textures rescale is now done by shaders (It was previously done using canvas) ([deltakosh](https://github.com/deltakosh))
- Added `SceneLoader.CleanBoneMatrixWeights` to force the loader to normalize matrix weights when loading bones (off by default) ([deltakosh](https://github.com/deltakosh)) 
- Added `camera.onViewMatrixChangedObservable` and `camera.onProjectionMatrixChangedObservable` ([deltakosh](https://github.com/deltakosh))
- Added support for folders when drag'n'dropping into the sandbox ([deltakosh](https://github.com/deltakosh))
- Better serialization support ([deltakosh](https://github.com/deltakosh))
- Introduced `performanceMonitor` class to get better FPS analysis ([deltakosh](https://github.com/deltakosh))
- GUI: Added support for pointer move events on projected UI ([deltakosh](https://github.com/deltakosh))
- Normals are generated automatically by StandardMaterial if meshes do not have normals ([deltakosh](https://github.com/deltakosh))
- Added `mesh.onMaterialChangedObservable` to notify when a new material is set ([deltakosh](https://github.com/deltakosh))
- Improved the SPS perfs for dead or invisible solid particles ([jerome](https://github.com/jbousquie))  

## Bug fixes
- Fixed a bug with PBR on iOS ([sebavan](https://github.com/sebavan))

## Breaking changes
- `Gamepads` was removed in favor of `scene.gamepadManager`

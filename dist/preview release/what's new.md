# 3.1.0:

## Major updates
- Viewer (TODO)
- Added BackgroundMaterial [Doc here](https://doc.babylonjs.com/how_to/backgroundmaterial)
- Added EnvironmentHelper [Doc here](https://doc.babylonjs.com/babylon101/environment#skybox-and-ground)
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
- Added support for `material.separateCullingPass`. [Doc here](http://doc.babylonjs.com/tutorials/transparency_and_how_meshes_are_rendered#things-to-do-and-not-to-do) ([sebavan](https://github.com/sebavan))
- Added support for Windows Motion Controllers ([Lewis Weaver](https://github.com/leweaver))
- Added support for Particle animation in ParticleSystem. [Doc here](http://doc.babylonjs.com/tutorials/particles#particle-animation) ([Ibraheem Osama](https://github.com/IbraheemOsama))
- More robust TypeScript code with *strictNullChecks*, *noImplicitAny*, *noImplicitThis* and *noImplicitReturns* compiler options ([deltakosh](https://github.com/deltakosh))
- Introduced `NullEngine` which can be used to use Babylon.js in headless mode. [Doc here](http://doc.babylonjs.com/generals/nullengine) ([deltakosh](https://github.com/deltakosh))
- New instrumentations tools. [Doc here](http://doc.babylonjs.com/how_to/optimizing_your_scene#instrumentation) ([deltakosh](https://github.com/deltakosh))
- Complete rework of Unity3D exporter. [Doc here](http://doc.babylonjs.com/resources/intro) ([MackeyK24](https://github.com/MackeyK24))

## Updates
- Introduced `TransformNode` class as a parent of `AbstractMesh`. This class was extensively asked by the community to hold only tranformation for a node ([deltakosh](https://github.com/deltakosh))
- Added `boundingInfo.centerOn` to recreate the bounding info to be centered around a specific point given a specific extend ([deltakosh](https://github.com/deltakosh))
- Added `mesh.normalizeToUnitCube` to uniformly scales the mesh to fit inside of a unit cube (1 X 1 X 1 units) ([deltakosh](https://github.com/deltakosh))
- Added `scene.onDataLoadedObservable` which is raised when SceneLoader.Append or SceneLoader.Load or SceneLoader.ImportMesh were successfully executed ([deltakosh](https://github.com/deltakosh))
- Support for adaptiveKernelBlur on MirrorTexture ([deltakosh](https://github.com/deltakosh))
- Support for non uniform scaling. Normals are now correctly computed ([deltakosh](https://github.com/deltakosh))
- Added `MultiObserver`. [Doc here](http://doc.babylonjs.com/overviews/observables#multiobserver) ([deltakosh](https://github.com/deltakosh))
- Added `shadowGenerator.addShadowCaster` and `shadowGenerator.removeShadowCaster` helper functions ([deltakosh](https://github.com/deltakosh))
- Several inspector improvements ([temechon](https://github.com/temechon))
- New observables for actions: `onBeforeExecuteObservable` for all actions and `onInterpolationDoneObservable` for `InterpolateValueAction` ([deltakosh](https://github.com/deltakosh))
- New observables for gamepads: `onButtonDownObservable`, `onButtonUpObservable`, `onPadDownObservable`, `onPadUpObservable` ([deltakosh](https://github.com/deltakosh))
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
- Added `enableDepthSort` parameter to the SPS in order to sort the particles from the camera position ([jerome](https://github.com/jbousquie)) 
- Added `pivot` property to the SPS solid particles ([jerome](https://github.com/jbousquie)) 
- Added the mesh facet depth sort to FacetData  ([jerome](https://github.com/jbousquie)) 
- Added `LineSystem` and `LineMesh` per point colors ([jerome](https://github.com/jbousquie))  
- Added `AdvancedDynamicTexture.renderScale` to allow users to render at higher DPI ([deltakosh](https://github.com/deltakosh))

## Bug fixes
- Fixed a bug with PBR on iOS ([sebavan](https://github.com/sebavan))

## Breaking changes
- `Gamepads` was removed in favor of `scene.gamepadManager`
- `DynamicFloatArray`, `MapTexture` and `RectPakingMap` were removed because there were not used anymore
- `IAssetTask` was removed in favor of `AbstractAssetTask` class

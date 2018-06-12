# 3.3.0

## Major updates

- Added a ParticleHelper class to create some pre-configured particle systems in a one-liner method style ([DevChris](https://github.com/yovanoc))
- Added new `MixMaterial` to the Materials Library allowing to mix up to 8 textures ([julien-moreau](https://github.com/julien-moreau))
- Added new `PhotoDome` object to display 360 photos. [Demo](https://www.babylonjs-playground.com/#14KRGG#0) ([SzeyinLee](https://github.com/SzeyinLee))
- New GUI 3D controls toolset. [Complete doc + demos](http://doc.babylonjs.com/how_to/gui3d) ([Deltakosh](https://github.com/deltakosh))
- Added [Environment Texture Tools](https://doc.babylonjs.com/how_to/physically_based_rendering#creating-a-compressed-environment-texture) to reduce the size of the usual .DDS file ([sebavan](http://www.github.com/sebavan))
- New GUI control: the [Grid](http://doc.babylonjs.com/how_to/gui#grid) ([Deltakosh](https://github.com/deltakosh))
- New `serialize` and `Parse` functions to serialize and parse all procedural textures from the Procedural Textures Library ([julien-moreau](https://github.com/julien-moreau))

## Updates

- All NPM packages have `latest`and `preview` streams [#3055](https://github.com/BabylonJS/Babylon.js/issues/3055) ([RaananW](https://github.com/RaananW))
- Added New Tools Tab in the inspector (env texture and screenshot tools so far) ([sebavan](http://www.github.com/sebavan))

### Core Engine

- Added new `Animatable.waitAsync` function to use Promises with animations. Demo [Here](https://www.babylonjs-playground.com/#HZBCXR) ([Deltakosh](https://github.com/deltakosh))
- Added the choice of [forming a closed loop](http://doc.babylonjs.com/how_to/how_to_use_curve3#catmull-rom-spline) to the catmull-rom-spline curve3 ([johnk](https://github.com/babylonjsguide))
- Added support for specifying the center of rotation to textures ([bghgary](http://www.github.com/bghgary))
- Added webVR support for Oculus Go ([TrevorDev](https://github.com/TrevorDev))
- Added ability to not generate polynomials harmonics upon prefiltered texture creation ([sebavan](http://www.github.com/sebavan))
- Added predicate function to customize the list of mesh included in the computation of bounding vectors in the ```getHierarchyBoundingVectors``` method ([sebavan](http://www.github.com/sebavan))
- Added webVR constructor options: disable laser pointer toggle, teleportation floor meshes ([TrevorDev](https://github.com/TrevorDev))
- Get a root mesh from an asset container, load a mesh from a file with a single string url ([TrevorDev](https://github.com/TrevorDev))
- UtilityLayer class to render another scene as a layer on top of an existing scene ([TrevorDev](https://github.com/TrevorDev))
- AnimationGroup has now onAnimationGroupEnd observable ([RaananW](https://github.com/RaananW))
- PointerDragBehavior, SixDofDragBehavior and MultiPointerScaleBehavior to enable drag and drop/scaling with mouse or 6dof controller on a mesh ([TrevorDev](https://github.com/TrevorDev))
- Gizmo and GizmoManager classes used to manipulate meshes in a scene. Position, rotation, scale, and bounding box gizmos ([TrevorDev](https://github.com/TrevorDev))
- Added a new `mesh.ignoreNonUniformScaling` to turn off non uniform scaling compensation ([Deltakosh](https://github.com/deltakosh))
- AssetsManager tasks will only run when their state is INIT. It is now possible to remove a task from the assets manager ([RaananW](https://github.com/RaananW))
- Added sprite isVisible field ([TrevorDev](https://github.com/TrevorDev))
- Added support for `minScaleX`, `minScaleY`, `maxScaleX`, `maxScaleY` for particles ([Deltakosh](https://github.com/deltakosh))
- Added support for `radiusRange` for sphere particle emitter ([Deltakosh](https://github.com/deltakosh))

### glTF Loader

- Added support for KHR_texture_transform ([bghgary](http://www.github.com/bghgary))
- Added `onNodeLODsLoadedObservable` and `onMaterialLODsLoadedObservable` to MSFT_lod loader extension ([bghgary](http://www.github.com/bghgary))
- Added glTF loader settings to the GLTF tab in the debug layer ([bghgary](http://www.github.com/bghgary))
- Added debug logging and performance counters ([bghgary](http://www.github.com/bghgary))

### Viewer

- No fullscreen button on small devices ([RaananW](https://github.com/RaananW))
- Nav-Bar is now displayed on fullscreen per default ([RaananW](https://github.com/RaananW))
- Viewer configuration supports deprecated values using the new configurationCompatibility processor  ([RaananW](https://github.com/RaananW))
- Shadows will only render while models are entering the scene or animating ([RaananW](https://github.com/RaananW))
- Support for model drag and drop onto the canvas ([RaananW](https://github.com/RaananW))
- New lab feature - global light rotation [#4347](https://github.com/BabylonJS/Babylon.js/issues/4347) ([RaananW](https://github.com/RaananW))
- New NPM package - babylonjs-viewer-assets, to separate the binary assets and the code of the viewer ([RaananW](https://github.com/RaananW))
- A new HD-Toggler button allows setting a better hardware scaling rate ([RaananW](https://github.com/RaananW))

### Documentation

- Added all code comments for GUI

## Bug fixes

- VR experience helper will now fire pointer events even when no mesh is currently hit ([TrevorDev](https://github.com/TrevorDev))
- RawTexture.CreateAlphaTexture no longer fails to create a usable texture ([TrevorDev](https://github.com/TrevorDev))
- SceneSerializer.SerializeMesh now serializes all materials kinds (not only StandardMaterial) ([julien-moreau](https://github.com/julien-moreau))
- WindowsMotionController's trackpad field will be updated prior to it's onTrackpadChangedObservable event ([TrevorDev](https://github.com/TrevorDev))

### Core Engine

- Fixed ```shadowEnabled``` property on lights. Shadows are not visible anymore when disabled ([sebavan](http://www.github.com/sebavan))
- Physics `unregisterOnPhysicsCollide` didn't remove callback correctly [#4291](https://github.com/BabylonJS/Babylon.js/issues/4291) ([RaananW](https://github.com/RaananW))
- Added missing getter and setter for global exposure in ColorCurves ([RaananW](https://github.com/RaananW))
- Fixed an issue with view matrix when `ArcRotateCamera` was used with collisions ([Deltakosh](https://github.com/deltakosh))
- Fixed a bug with setting `unlit` on `PBRMaterial` after the material is ready (Wrong dirty flags) ([bghgary](http://www.github.com/bghgary))
- Fixed `HighlightLayer` support on browsers not supporting HalfFloat ([sebavan](http://www.github.com/sebavan))
- Fixed support for R and RG texture formats ([sebavan](http://www.github.com/sebavan))
- Fixed `updatable` parameter setting in the SPS ([jerome](https://github.com/jbousquie))
- Angular and linear velocity were using the wrong method to copy values to the physics engine ([RaananW](https://github.com/RaananW))

### Viewer

- Fix Navbar Interaction on Mozilla/Firefox ([SzeyinLee](https://github.com/SzeyinLee))
- Fix Animation Slider Interaction on Mozilla/Firefox ([sebavan](http://www.github.com/sebavan))
- Fix Animation Slider Clickable area size Cross Plat ([sebavan](http://www.github.com/sebavan))
- Ground material didn't take the default main color is no material definition was provided ([RaananW](https://github.com/RaananW))
- Model configuration was not extended correctly if loaded more than one model ([RaananW](https://github.com/RaananW))
- It wasn't possible to disable camera behavior(s) using configuration  [#4348](https://github.com/BabylonJS/Babylon.js/issues/4348) ([RaananW](https://github.com/RaananW))
- Animation blending was always set to true, ignoring configuration [#4412](https://github.com/BabylonJS/Babylon.js/issues/4412) ([RaananW](https://github.com/RaananW))
- Animation navbar now updates correctly when a new model is loaded [#4441](https://github.com/BabylonJS/Babylon.js/issues/4441) ([RaananW](https://github.com/RaananW))
- Non-normalized meshes didn't center and focus correctly ([RaananW](https://github.com/RaananW))
- Meshes with skeletons could have incorrect animations ([RaananW](https://github.com/RaananW))

### Loaders

- STL Loader only supported binary downloads and no data: urls [#4473](https://github.com/BabylonJS/Babylon.js/issues/4473) ([RaananW](https://github.com/RaananW))

## Breaking changes

- Fixing support for R and RG texture formats made us remove TextureFormat_R32F and TextureFormat_RG32F as they were mixing formats and types. Please, use the respective TextureFormat_R and TextureFormat_RG with the Float types ([sebavan](http://www.github.com/sebavan))

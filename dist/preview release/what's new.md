# 3.3.0

## Major updates

- Added new `MixMaterial` to the Materials Library allowing to mix up to 8 textures ([julien-moreau](https://github.com/julien-moreau))
- Added new `PhotoDome` object to display 360 photos. [Demo](https://www.babylonjs-playground.com/#14KRGG#0) ([SzeyinLee](https://github.com/SzeyinLee))
- New GUI 3D controls toolset. [Complete doc + demos](http://doc.babylonjs.com/how_to/gui3d) ([Deltakosh](https://github.com/deltakosh))
- Added [Environment Texture Tools](https://doc.babylonjs.com/how_to/physically_based_rendering#creating-a-compressed-environment-texture) to reduce the size of the usual .DDS file ([sebavan](http://www.github.com/sebavan))
- New GUI control: the [Grid](http://doc.babylonjs.com/how_to/gui#grid) ([Deltakosh](https://github.com/deltakosh))
- Gizmo and GizmoManager classes used to manipulate meshes in a scene. Gizmo types include: position, scale, rotation and bounding box. [Doc](http://doc.babylonjs.com/how_to/gizmo) ([TrevorDev](https://github.com/TrevorDev))
- New behaviors: PointerDragBehavior, SixDofDragBehavior and MultiPointerScaleBehavior to enable smooth drag and drop/scaling with mouse or 6dof controller on a mesh. [Doc](http://doc.babylonjs.com/how_to/meshbehavior) ([TrevorDev](https://github.com/TrevorDev))
- Particle system improvements ([Deltakosh](https://github.com/deltakosh))
  - Added a ParticleHelper class to create some pre-configured particle systems in a one-liner method style. [Doc](https://doc.babylonjs.com/How_To/ParticleHelper) ([Deltakosh](https://github.com/deltakosh)) / ([DevChris](https://github.com/yovanoc))
  - Improved CPU particles rendering performance (up to x2 on low end devices)
  - Added support for `isBillboardBased`. [Doc](http://doc.babylonjs.com/babylon101/particles#alignment)
  - Added support for billboard mode. [Doc](https://doc.babylonjs.com/babylon101/particles#alignment)
  - Added support for `minScaleX`, `minScaleY`, `maxScaleX`, `maxScaleY`. [Doc](https://doc.babylonjs.com/babylon101/particles#size)
  - Added support for `radiusRange` for sphere emitter. [Doc](https://doc.babylonjs.com/babylon101/particles#sphere-emitter)
  - Added support for `radiusRange` and `heightRange` for cone emitter. [Doc](https://doc.babylonjs.com/babylon101/particles#cone-emitter)
  - Added support for `ParticleSystem.BLENDMODE_ADD` alpha mode. [Doc](https://doc.babylonjs.com/babylon101/particles#particle-blending)
  - Added support for color gradients. [Doc](https://doc.babylonjs.com/babylon101/particles#particle-colors)
  - Added support for pre-warming. [Doc](https://doc.babylonjs.com/babylon101/particles#pre-warming)
  - Added support for `minInitialRotation` and `maxInitialRotation`. [Doc](https://doc.babylonjs.com/babylon101/particles#rotation)
  - Added support for size gradients. [Doc](https://doc.babylonjs.com/babylon101/particles#size)
  - Added support for life time gradients. [Doc](https://doc.babylonjs.com/babylon101/particles#lifetime)
  - Added support for angular speed gradients. [Doc](https://doc.babylonjs.com/babylon101/particles#rotation)
  - Added support for noise textures. [Doc](http://doc.babylonjs.com/babylon101/particles#noise-texture)
- Added SceneComponent to help decoupling Scene from its components. ([sebavan](http://www.github.com/sebavan))
- Playground can now be used with TypeScript directly!. [Demo](https://www.babylonjs-playground.com/ts.html) ([Deltakosh](https://github.com/deltakosh), [NasimiAsl](https://github.com/NasimiAsl))
- New GUI control: [InputPassword](https://doc.babylonjs.com/how_to/gui#inputpassword) ([theom](https://github.com/theom))
- Added dead key support and before key add observable to InputText. [Doc](https://doc.babylonjs.com/how_to/gui#using-onbeforekeyaddobservable-for-extended-keyboard-layouts-and-input-masks)([theom](https://github.com/theom))
- GUI and Inspector are now ES-Modules ([RaananW](https://github.com/RaananW))
- Added support for noise procedural textures. [Doc](http://doc.babylonjs.com/how_to/how_to_use_procedural_textures#noise-procedural-texture) ([Deltakosh](https://github.com/deltakosh))

## Updates

- All NPM packages have `latest`and `preview` streams [#3055](https://github.com/BabylonJS/Babylon.js/issues/3055) ([RaananW](https://github.com/RaananW))
- Added New Tools Tab in the inspector (env texture and screenshot tools so far) ([sebavan](http://www.github.com/sebavan))
- Added `TextBlock.computeExpectedHeight`, added `TextWrapping.Ellipsis` as `TextBlock.wordWrapping` possible value ([adrientetar](https://github.com/adrientetar))

### Core Engine

- Added new `BoundingInfo.scale()` function to let users control the size of the bounding info ([Deltakosh](https://github.com/deltakosh))
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
- New `serialize` and `Parse` functions to serialize and parse all procedural textures from the Procedural Textures Library ([julien-moreau](https://github.com/julien-moreau))
- Added a new `mesh.ignoreNonUniformScaling` to turn off non uniform scaling compensation ([Deltakosh](https://github.com/deltakosh))
- AssetsManager tasks will only run when their state is INIT. It is now possible to remove a task from the assets manager ([RaananW](https://github.com/RaananW))
- Added sprite isVisible field ([TrevorDev](https://github.com/TrevorDev))
- EnvironmentHelper will recreate ground and skybox meshes if force-disposed ([RaananW](https://github.com/RaananW))
- Added viewport caching mechanism in engine ([sebavan](http://www.github.com/sebavan))
- Added unpackFlipY caching mechanism in engine ([sebavan](http://www.github.com/sebavan))
- Added rebind optimization of video texture ([sebavan](http://www.github.com/sebavan))
- Fix Background Material effect caching ([sebavan](http://www.github.com/sebavan))
- Prevent texture ```getSize``` to generate garbage collection ([sebavan](http://www.github.com/sebavan))
- Prevent ```lodGenerationScale``` and ```lodGenerationOffset``` to force rebind ([sebavan](http://www.github.com/sebavan))
- Added poster property on VideoTexture ([sebavan](http://www.github.com/sebavan))
- Added ```onUserActionRequestedObservable``` to workaround and detect autoplay video policy restriction on VideoTexture ([sebavan](http://www.github.com/sebavan))
- `Sound` now accepts `MediaStream` as source to enable easier WebAudio and WebRTC integrations ([menduz](https://github.com/menduz))
- Vector x, y and z constructor parameters are now optional and default to 0 ([TrevorDev](https://github.com/TrevorDev))
- New vertical mode for sliders in 2D GUI. [Demo](https://www.babylonjs-playground.com/#U9AC0N#53) ([Saket Saurabh](https://github.com/ssaket))
- Added and removed camera methods in the default pipeline ([TrevorDev](https://github.com/TrevorDev))
- Added internal texture `format` support for RenderTargetCubeTexture ([PeapBoy](https://github.com/NicolasBuecher))
- Added canvas toBlob polyfill in tools ([sebavan](http://www.github.com/sebavan))
- Added `RawCubeTexture` class with RGBD and mipmap support ([bghgary](http://www.github.com/bghgary))
- Added effect layer per rendering group addressing [Issue 4463](https://github.com/BabylonJS/Babylon.js/issues/4463) ([sebavan](http://www.github.com/sebavan))
- Added predicate function `targetMask` argument to `scene.beginWeightedAnimation`, `scene.beginAnimation`, `scene.stopAnimation`, and `animatable.stop` to allow for selective application of animations.  ([fmmoret](http://github.com/fmmoret))
- Oculus GO and GearVR 3dof controllers will now rotate with the user's head if they turn around in their room ([TrevorDev](https://github.com/TrevorDev))
- Added onPoseUpdatedFromDeviceObservable to webVRCamera to detect when the camera's pose has been updated ([TrevorDev](https://github.com/TrevorDev))
- Added attachToBoxBehavior to attach UI to a bounding box ([TrevorDev](https://github.com/TrevorDev))
- Gizmo manager's internal gizmos are now public ([TrevorDev](https://github.com/TrevorDev))
- Ability to customize meshes on gizmos ([TrevorDev](https://github.com/TrevorDev))

### glTF Loader

- Added support for KHR_texture_transform ([bghgary](http://www.github.com/bghgary))
- Added `onNodeLODsLoadedObservable` and `onMaterialLODsLoadedObservable` to MSFT_lod loader extension ([bghgary](http://www.github.com/bghgary))
- Added glTF loader settings to the GLTF tab in the debug layer ([bghgary](http://www.github.com/bghgary))
- Added debug logging and performance counters ([bghgary](http://www.github.com/bghgary))
- Added support for EXT_lights_imageBased ([bghgary](http://www.github.com/bghgary))

### Viewer

- No fullscreen button on small devices ([RaananW](https://github.com/RaananW))
- Nav-Bar is now displayed on fullscreen per default ([RaananW](https://github.com/RaananW))
- Viewer configuration supports deprecated values using the new configurationCompatibility processor  ([RaananW](https://github.com/RaananW))
- Shadows will only render while models are entering the scene or animating ([RaananW](https://github.com/RaananW))
- Support for model drag and drop onto the canvas ([RaananW](https://github.com/RaananW))
- New lab feature - global light rotation [#4347](https://github.com/BabylonJS/Babylon.js/issues/4347) ([RaananW](https://github.com/RaananW))
- New NPM package - babylonjs-viewer-assets, to separate the binary assets and the code of the viewer ([RaananW](https://github.com/RaananW))
- A new HD-Toggler button allows setting a better hardware scaling rate ([RaananW](https://github.com/RaananW))
- An initial support for WebVR is implemented ([RaananW](https://github.com/RaananW))
- It is now possible to choose the element that goes fullscreen in the default viewer ([RaananW](https://github.com/RaananW))
- The default viewer has a plugin system with which new buttons can be added externally ([RaananW](https://github.com/RaananW))
- The extended configuration is now the default when not providing the "extended" parameter ([RaananW](https://github.com/RaananW))
- viewer.updateConfiguration also accepts a URL to download configuration remotely ([RaananW](https://github.com/RaananW))
- Viewer supports 3D printing on windows 10 ([RaananW](https://github.com/RaananW))
- The viewer's environment map is using the new .env feature ([RaananW](https://github.com/RaananW))

### Documentation

- Added all code comments for GUI

## Bug fixes

- VR experience helper will now fire pointer events even when no mesh is currently hit ([TrevorDev](https://github.com/TrevorDev))
- RawTexture.CreateAlphaTexture no longer fails to create a usable texture ([TrevorDev](https://github.com/TrevorDev))
- SceneSerializer.SerializeMesh now serializes all materials kinds (not only StandardMaterial) ([julien-moreau](https://github.com/julien-moreau))
- WindowsMotionController's trackpad field will be updated prior to it's onTrackpadChangedObservable event ([TrevorDev](https://github.com/TrevorDev))
- VR experience helper's controllers will not fire pointer events when laser's are disabled, instead the camera ray pointer event will be used ([TrevorDev](https://github.com/TrevorDev))
- Node's setParent(node.parent) will no longer throw an exception when parent is undefined and will behave the same as setParent(null) ([TrevorDev](https://github.com/TrevorDev))
- Mesh.MergeMeshes flips triangles on meshes with negative scaling ([SvenFrankson](http://svenfrankson.com))
- Avoid firing button events multiple times when calling vrController.attachMesh() ([TrevorDev](https://github.com/TrevorDev))
- Parse geometry when load binary mesh ([SinhNQ](https://github.com/quocsinh))
- Removing observers during observable notify should not skip over valid observers ([TrevorDev](https://github.com/TrevorDev))
- Initializing gamepadManager should register the gamepad update events ([TrevorDev](https://github.com/TrevorDev))
- Do not generate mipmaps for RawCubeTexture if OES_texture_float_linear and/or EXT_color_buffer_float extensions are not supported ([PeapBoy](https://github.com/NicolasBuecher))

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
- Fixed env texture generation in Byte Mode ([sebavan](http://www.github.com/sebavan))
- Oimo.js now receives quaternion and not euler when a body is being constructed ([RaananW](https://github.com/RaananW))

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
- Removed element IDs from viewer's templates to allow muitiple viewers in a single page [#4500](https://github.com/BabylonJS/Babylon.js/issues/4500) ([RaananW](https://github.com/RaananW))
- Viewer is not using Engine.LastCreatedScene anymore, to support multiple viewers in a single page [#4500](https://github.com/BabylonJS/Babylon.js/issues/4500) ([RaananW](https://github.com/RaananW))
- Template location was ignored if html was defined ([RaananW](https://github.com/RaananW))
- Drag and Drop only worked if a model was already loaded before ([RaananW](https://github.com/RaananW))
- It was not possible to add new custom optimizers, only use existing ones ([RaananW](https://github.com/RaananW))

### Loaders

- STL Loader only supported binary downloads and no data: urls [#4473](https://github.com/BabylonJS/Babylon.js/issues/4473) ([RaananW](https://github.com/RaananW))
- OBJ Loader is now an async loader [#4571](https://github.com/BabylonJS/Babylon.js/issues/4571) ([RaananW](https://github.com/RaananW))

## Breaking changes

- Fixing support for R and RG texture formats made us remove TextureFormat_R32F and TextureFormat_RG32F as they were mixing formats and types. Please, use the respective TextureFormat_R and TextureFormat_RG with the Float types ([sebavan](http://www.github.com/sebavan))
- Replacing `scene.onRenderingGroupObservable` by `onBeforeRenderingGroupObservable` and `onAfterRenderingGroupObservable` to prevent the stage check ([sebavan](http://www.github.com/sebavan))

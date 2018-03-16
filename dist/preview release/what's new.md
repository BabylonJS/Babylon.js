# 3.2.0

## Major updates

- Support for [GPU particles](https://doc.babylonjs.com/babylon101/particles#gpu-particles). Demo [here](https://www.babylonjs-playground.com/frame.html#PU4WYI#2) ([deltakosh](https://github.com/deltakosh))
- Improved building process: We now run a full visual validation test for each pull request. Furthermore, code comments and what's new updates are now mandatory ([sebavan](https://github.com/sebavan))
- Babylon.js now uses Promises in addition to callbacks. We created several `xxxAsync` functions all over the framework (`SceneLoader.AppendAsync` for instance, which returns a Promise). A polyfill is also integrated to support older browsers ([deltakosh](https://github.com/deltakosh))
- Introduced texture binding atlas. This optimization allows the engine to reuse texture bindings instead of rebinding textures when they are not on constant sampler indexes ([deltakosh](https://github.com/deltakosh))
- New [AnimationGroup class](http://doc.babylonjs.com/how_to/group) to control simultaneously multiple animations with different targets ([deltakosh](https://github.com/deltakosh))
- `WebVRCamera`: added basic support for Daydream and Gear VR ([brianzinn](https://github.com/brianzinn))
- Introduced [Projection Texture on SpotLight](http://doc.babylonjs.com/babylon101/lights#projection-texture). Demo [here](https://www.babylonjs-playground.com/frame.html#CQNGRK) ([lostink](https://github.com/lostink))
- Introduced support for [local cubemaps](http://doc.babylonjs.com/how_to/reflect#using-local-cubemap-mode). Demo [here](https://www.babylonjs-playground.com/frame.html#RNASML#4) ([deltakosh](https://github.com/deltakosh))
- Added [VideoDome](http://doc.babylonjs.com/how_to/360videodome) class to easily support 360 videos. Demo [here](https://www.babylonjs-playground.com/frame.html#1E9JQ8#7) ([DavidHGillen](https://github.com/DavidHGillen))
- Added [GlowLayer](https://doc.babylonjs.com/how_to/glow_layer) to easily support glow from emissive materials. Demo [here](http://www.babylonjs.com/demos/GlowLayer/) ([sebavan](https://github.com/sebavan))
- New [AssetContainer](http://doc.babylonjs.com/how_to/how_to_use_assetcontainer) class and loading methods ([trevordev](https://github.com/trevordev))
- Added [depth of field](https://www.babylonjs-playground.com/frame.html#8F5HYV#5), sharpening, MSAA, chromatic aberration and grain effect to the default pipeline ([trevordev](https://github.com/trevordev))
- Added support for [animation weights](http://doc.babylonjs.com/babylon101/animations#animation-weights). Demo [here](https://www.babylonjs-playground.com/#IQN716#8) ([deltakosh](https://github.com/deltakosh))
- Added [sub emitters for particle system](http://doc.babylonjs.com/babylon101/particles#sub-emitters) which will spawn new particle systems when particles dies. Demo [here](https://www.babylonjs-playground.com/frame.html#9NHBCC#1) ([IbraheemOsama](https://github.com/IbraheemOsama))
- New [Babylon.js](http://doc.babylonjs.com/resources/maya) and [glTF](http://doc.babylonjs.com/resources/maya_to_gltf) exporter for Autodesk Maya ([Noalak](https://github.com/Noalak))
- New glTF [serializer](https://github.com/BabylonJS/Babylon.js/tree/master/serializers/src/glTF/2.0). You can now export glTF or glb files directly from a Babylon scene ([kcoley](https://github.com/kcoley))
- New [glTF exporter](http://doc.babylonjs.com/resources/3dsmax_to_gltf) for Autodesk 3dsmax ([Noalak](https://github.com/Noalak))
- Physics - Latest production version of Oimo.js is being used - 1.0.9 ([RaananW](https://github.com/RaananW))

## Updates

- Tons of functions and classes received the code comments they deserved (All the community)
- New [particle system emitter shapes](http://doc.babylonjs.com/babylon101/particles#particles-shapes): cone and sphere ([IbraheemOsama](https://github.com/IbraheemOsama))
- Added support for 16bits TGA ([deltakosh](https://github.com/deltakosh))
- New `AnimationPropertiesOverride` class used to simplify setting animation properties on child animations. [Documentation](http://doc.babylonjs.com/babylon101/animations#overriding-properties) ([deltakosh](https://github.com/deltakosh))
- New `Texture.UseSerializedUrlIfAny` static property to let textures serialize complete URL instead of using side by side loading ([deltakosh](https://github.com/deltakosh))
- Added `particleSystem.reset()` to clear a particle system ([deltakosh](https://github.com/deltakosh))
- Added support for all RGBA orders (BGR, RGB, etc..) for the DDS loader ([deltakosh](https://github.com/deltakosh))
- Improved [SceneOptimizer](http://doc.babylonjs.com/how_to/how_to_use_sceneoptimizer) to provide better adaptability ([deltakosh](https://github.com/deltakosh))
- Improved `scene.isReady()` function which now takes in account shadows and LOD ([deltakosh](https://github.com/deltakosh))
- New watcher configuration for VSCode. Now the task only compiles changed files ([sebavan](https://github.com/sebavan))
- Added new draw modes to engine (points, lines, linesloop, linestrip, trianglestrip, trianglefan) ([benaadams](https://github.com/benaadams))
- Added GUI Textblock.lineSpacing setter and getter to configure vertical space between lines in pixels or percentage values when working with text wrapping ([carloslanderas](https://github.com/carloslanderas))
- VRHelper now has onSelectedMeshUnselected observable that will notify observers when the current selected mesh gets unselected
  ([carloslanderas](https://github.com/carloslanderas))
- VRHelper now has onBeforeCameraTeleport and onAfterCameraTeleport observables that will be notified before and after camera teleportation is triggered.
  ([carloslanderas](https://github.com/carloslanderas))
- VRHelper now has the public property teleportationEnabled to enable / disable camera teleportation.
   ([carloslanderas](https://github.com/carloslanderas))
- VRHelper now exposes onNewMeshPicked observable that will notify a PickingInfo object after meshSelectionPredicate evaluation
   ([carloslanderas](https://github.com/carloslanderas))
- `AssetsManager` will now clear its `tasks` lsit from all successfully loaded tasks ([deltakosh](https://github.com/deltakosh))
- Added documentation to WebVRCamera and VRExperienceHelper ([trevordev](https://github.com/trevordev))
- Introduced `isStroke` on `HighlightLayerOptions` which makes the highlight solid ([PixelsCommander](https://github.com/pixelscommander))
- (Viewer) There is now an option to paste payload instead of a URL for configuration ([RaananW](https://github.com/RaananW))
- (Viewer) Models can be loaded async using JavaScript ([RaananW](https://github.com/RaananW))
- VRHelper will notify now onSelectedMeshUnselected observable to subscribers when the applied ray selection predicate does not produce a hit and a mesh compliant with the meshSelectionPredicate was previously selected
   ([carloslanderas](https://github.com/carloslanderas))
- (Viewer) initScene and initEngine can now be extended. onProgress during model loading is implemented as observable. ([RaananW](https://github.com/RaananW))
- glTF loader now supports the KHR_lights extension ([MiiBond](https://github.com/MiiBond))
- The observable can now notify observers using promise-based callback chain. ([RaananW](https://github.com/RaananW))
- Added base64 helper functions to `Tools` ([bghgary](https://github.com/bghgary))
- Added `createDefaultCamera` and `createDefaultLight` functions to `Scene` ([bghgary](https://github.com/bghgary))
- Gulp process now supports multiple outputs when using webpack. ([RaananW](https://github.com/RaananW))
- (Viewer) Scene Optimizer intergrated in viewer. ([RaananW](https://github.com/RaananW))
- (Viewer) The viewer supports custom shaders in the configuration. ([RaananW](https://github.com/RaananW))
- Documented PostProcessRenderEffect, DefaultRenderingPipeline, BlurPostProcess, DepthOfFieldEffect, PostProcess, PostProcessManager, Effect classes ([trevordev](https://github.com/trevordev))
- SPS internal storage of each solid particle rotation matrix ([jbousquie](https://github.com/jbousquie))
- SPS particle parenting feature ([jbousquie](https://github.com/jbousquie))
- (Viewer) Introducing the viewer labs - testing new features. ([RaananW](https://github.com/RaananW))
- KeepAssets class and AssetContainer.moveAllFromScene ([HoloLite](http://www.html5gamedevs.com/profile/28694-hololite/) [trevordev](https://github.com/trevordev))
- (Viewer) It is now possible to update parts of the configuration without rcreating the objects. Extra configuration can be loaded sync (if provided) ([RaananW](https://github.com/RaananW))
- (Gulp) extra/external declarations can be prepended to final declarations during build. ([RaananW](https://github.com/RaananW))
- (Viewer) Model can be normalized using configuration, camera is dynamically configured. ([RaananW](https://github.com/RaananW))
- (Gulp) extra/external declarations can be prepended to final NPM declarations during build. ([RaananW](https://github.com/RaananW))
- GUI.Line can have its world position set from one end or the other ([SvenFrankson](https://github.com/SvenFrankson))
- Added FOV system to background material for zoom effects in skyboxes without adjusting camera FOV ([DavidHGillen](https://github.com/DavidHGillen))
- Improved glTF loader by using promises for asynchronous operations. ([bghgary](https://github.com/bghgary)]
- Improved glTF loader performance by compiling materials in parallel with downloading external resources. ([bghgary](https://github.com/bghgary)]
- Added unit tests for the glTF 2.0 loader. ([bghgary](https://github.com/bghgary)]
- Added promise-based async functions to the SceneLoader, Scene.whenReadyAsync, and material.forceCompilationAsync. ([bghgary](https://github.com/bghgary)]
- Added checks to VertexData.merge to ensure data is valid before merging. ([bghgary](https://github.com/bghgary)]
- Ability to set a mesh to customize the webVR gaze tracker ([trevordev](https://github.com/trevordev))
- Added promise-based async functions for initWebVRAsync and useStandingMatrixAsync ([trevordev](https://github.com/trevordev))
- Add stroke (outline) options on GUI text control ([SvenFrankson](https://github.com/SvenFrankson))
- Add isThumbClamped option on GUI slider control ([JeanPhilippeKernel](https://github.com/JeanPhilippeKernel))
- Add floating point texture support for RenderTargetCubeTexture ([PeapBoy](https://github.com/NicolasBuecher))
- Support for mutli-touch when interacting with multiple gui elements simultaneously ([trevordev](https://github.com/trevordev))
- (Viewer) Declaration file published, ready for npm. ([RaananW](https://github.com/RaananW))
- Added Draco mesh compression support to glTF 2.0 loader. ([bghgary](https://github.com/bghgary))
- Support multiple simultaneous webVR controller gui interactions in WebVRExperienceHelper ([trevordev](https://github.com/trevordev))
- (Viewer) XHR requests not use Tools.LoadFile and are disposed correctly - [#3671](https://github.com/BabylonJS/Babylon.js/issues/3671) ([RaananW](https://github.com/RaananW))
- Added `Tools.WorkerPool` class for web worker management. ([bghgary](https://github.com/bghgary))
- Support depth maps for multiple active cameras for post processes like depth of field ([trevordev](https://github.com/trevordev))
- Integrates depth texture support in the engine ([sebavan](https://github.com/sebavan))
- NPM package now has a dependency system, updated during build. ([RaananW](https://github.com/RaananW))
- WebVRExperienceHelper will create an empty controller model so that controller interactions can be used while the actual model is still loading ([trevordev](https://github.com/trevordev))
- Default fragment shader will clamp negative values to avoid underflow, webVR post processing will render to eye texture size ([trevordev](https://github.com/trevordev))
- Supports Environment Drag and Drop in Sandbox ([sebavan](https://github.com/sebavan))
- EnvironmentHelper has no an onError observable to handle errors when loading the textures ([RaananW](https://github.com/RaananW))
- (Viewer) Viewer supports model animations and multi-model loading ([RaananW](https://github.com/RaananW))
- Tests for sharpen, chromatic aberration, default pipeline and enable/disable post processes ([trevordev](https://github.com/trevordev))
- onPointer* callbacks have now the event type as a 3rd variable ([RaananW](https://github.com/RaananW))
- Lightmap texture in PBR material follow the gammaSpace Flag of the texture ([sebavan](https://github.com/sebavan))
- Added setTextureFromPostProcessOutput to bind the output of a postprocess into an effect ([trevordev](https://github.com/trevordev))
- Added support for primitive modes to glTF 2.0 loader. ([bghgary](https://github.com/bghgary)]
- Cannon and Oimo are optional dependencies ([RaananW](https://github.com/RaananW))

## Bug fixes

- `setPivotMatrix` ws not setting pivot correctly. This is now fixed. We also introduced a new `setPreTransformMatrix` to reproduce the sometimes needed behavior of the previous `setPivotMatrix` function ([deltakosh](https://github.com/deltakosh))
- SPS solid particle `.pivot` property now also behaves like the standard mesh pivot. Former behavior (particle translation) can be kept with the particle property `.translateFromPivot` set to true ([jbousquie](https://github.com/jbousquie))
- Texture extension detection in `Engine.CreateTexture` ([sebavan](https://github.com/sebavan))
- SPS internal temporary vector3 instead of Tmp.Vector3 to avoid possible concurrent uses ([jbousquie](https://github.com/jbousquie))
- Fixed a bug when calling load on an empty assets manager - [#3739](https://github.com/BabylonJS/Babylon.js/issues/3739) ([RaananW](https://github.com/RaananW))
- Enabling teleportation in the vr helper class caused a redundant post process to be added ([trevordev](https://github.com/trevordev))
- (Viewer) Fixed a bug where loading another mesh positioned it incorrectly ([RaananW](https://github.com/RaananW))
- Scale vr controllers by deviceScale when it is set in VRExperienceHelper ([trevordev](https://github.com/trevordev))
- (Viewer) Disabling templates now work correctly ([RaananW](https://github.com/RaananW))
- AMD "define" declaration is no longer anonymous ([RaananW](https://github.com/RaananW))
- Collision worker didn't initialize instanced meshes correctly - [#3819](https://github.com/BabylonJS/Babylon.js/issues/3819) ([RaananW](https://github.com/RaananW))
- postMessage calls in webworkers were fixed. ([RaananW](https://github.com/RaananW))
- Fixed WebCam Texture on Firefox and Edge - [#3825](https://github.com/BabylonJS/Babylon.js/issues/3825) ([sebavan](https://github.com/sebavan))
- Add onLoadObservable on VideoTexture - [#3845](https://github.com/BabylonJS/Babylon.js/issues/3845) ([sebavan](https://github.com/sebavan))
- beforeRender is now triggered after the camera updated its state - [#3873](https://github.com/BabylonJS/Babylon.js/issues/3873) ([RaananW](https://github.com/RaananW))
- Tools.DeepCopy no longer copying getter-only elements - [#3929](https://github.com/BabylonJS/Babylon.js/issues/3929) ([RaananW](https://github.com/RaananW))

## Breaking changes

- Removed the unused PostProcessRenderPass class and extended postProcessingRenderingEffect to support multiple PostProcesses ([trevordev](https://github.com/trevordev))
- VertexData.merge no longer supports merging of data that do not have the same set of attributes. ([bghgary](https://github.com/bghgary)]
- glTF 2.0 loader now creates a mesh for each primitive instead of merging the primitives together into one mesh. If a mesh only has one primitive, the behavior is the same as before. This change only affects meshes that have multiple primitives. ([bghgary](https://github.com/bghgary)]
- Engine's onCanvasPointerOutObservable will now return a PointerEvent instead of the Engine. ([trevordev](https://github.com/trevordev))

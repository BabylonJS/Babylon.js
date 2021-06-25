# 5.0.0

## Major updates

- Infinite Morph Targets: When supported (WebGL2+) you are no more limited to 4 morph targets per mesh ([Deltakosh](https://github.com/deltakosh))
- Added support for ConditionalBlock for NodeMaterial ([Deltakosh](https://github.com/deltakosh))
- Improved performance when using the shadow / cascacaded shadow generator ([Popov72](https://github.com/Popov72))
- Add support for up to 6 uv sets in the standard, PBR and node materials ([Popov72](https://github.com/Popov72))

## Updates

### General

- Added zoomToMouseLocation on ArcRotateCamera ([lovettchris](https://github.com/lovettchris))
- Added static CenterToRef for vectors 2/3/4 ([aWeirdo](https://github.com/aWeirdo))
- Added ability to view images (ktx2, png, jpg) to the sandbox. ([bghgary](https://github.com/bghgary))
- Added optional smoothed normals for extruded procedural polygons. ([snagy](https://github.com/snagy))
- Added support for infinite perspective cameras ([Deltakosh](https://github.com/deltakosh))
- Added ability to enable/disable ArcRotateCamera zoom on multiTouch event ([NicolasBuecher](https://github.com/NicolasBuecher))
- Moving button to shared uI folder.([msDestiny14](https://github.com/msDestiny14))
- Added `collisionRetryCount` to improved collision detection ([CedricGuillemet](https://github.com/CedricGuillemet))
- Moved sharedUI component to shared UI folder. ([msDestiny14](https://github.com/msDestiny14))
- Added encapsulate and encapsulateBoundingInfo methods to BoundingInfo. ([Tolo789](https://github.com/Tolo789))
- Added onLoadObservable to the textureDome class(es) ([RaananW](https://github.com/RaananW))
- Modified InputManager to use DeviceInputSystem ([PolygonalSun](https://github.com/PolygonalSun))
- Added a [helper class](https://doc.babylonjs.com/typedoc/classes/babylon.debug.directionallightfrustumviewer) to display the frustum of a directional light ([Popov72](https://github.com/Popov72))
- Improved collision detection performance ([ottoville](https://github.com/ottoville/))
- Added new helper functions for Quaternion.FromLookDirection and Matrix.LookDirection ([Alex-MSFT](https://github.com/Alex-MSFT))
- Added support for clip planes to the edge renderer ([#10053](https://github.com/BabylonJS/Babylon.js/issues/10053)) ([Popov72](https://github.com/Popov72))
- Added support for [cannon-es](https://github.com/pmndrs/cannon-es) to the cannonJSPlugin. ([frankieali](https://github.com/frankieali))
- Added check for duplicates in addShadowCaster ([ivankoleda](https://github.com/ivankoleda))
- Added observable for PointerDragBehavior enable state ([cedricguillemet](https://github.com/cedricguillemet))
- spelling of function/variables `xxxByID` renamed to `xxxById` to be consistent over the project. Old `xxxByID` reamain as deprecated that forward to the correspondgin `xxxById` ([barroij](https://github.com/barroij))
- Added new reflector tool that enable remote inspection of scenes. ([bghgary](https://github.com/bghgary))
- Update `createPickingRay` and `createPickingRayToRef` matrix parameter to be nullable. ([jlivak](https://github.com/jlivak))
- Added `applyVerticalCorrection` and `projectionPlaneTilt` to perspective cameras to correct perspective projections ([CraigFeldspar](https://github.com/CraigFeldspar))

### Engine

- Moved all instance data from Geometry to Mesh such that the same Geometry objects can be used by many meshes with instancing. Reduces memory consumption on CPU/GPU. ([breakin](https://github.com/breakin)
- Added NativeEngine configuration object parameter. ([drigax](https://github.com/drigax))
- Added NativeEngine support for signed byte and unsigned short vertex buffer attribute types ([Alex-MSFT](https://github.com/Alex-MSFT))
- Added support for sRGB buffers, native in WebGL2 / WebGPU and through the `EXT_sRGB` extension in WebGL1. There's a new parameter to the `Texture` constructor that enables this feature ([Popov72](https://github.com/Popov72))
- Added IAudioEngineOptions interface to provide the audio engine with a pre-defined Audio Context and audio destination node. ([Vandy](https://github.com/svanderbeck11))

### Loaders

- Added support for EXT_meshopt_compression for glTF loader. ([zeux](https://github.com/zeux))
- Increased KHR_materials_transmission render target texture default size. ([Drigax](https://github.com/drigax))
- Changed glTF loader to remove empty animation groups if there are no animation channels loaded with the given options. ([bghgary](https://github.com/bghgary))
- Update glTF validator to `2.0.0-dev.3.3`. ([bghgary](https://github.com/bghgary))
- Added support for KHR_xmp_json_ld for glTF loader. ([Sebavan](https://github.com/sebavan/), [bghgary](https://github.com/bghgary))
- Added a `OptimizeNormals` option to the OBJ loader to smooth lighting ([Popov72](https://github.com/Popov72))
- Added a `Prefiltered` option to the `CubeTextureAssetTask` ([MackeyK24](https://github.com/MackeyK24))
- Added support for more uv sets to glTF loader. ([bghgary](https://github.com/bghgary))
- Added support for KHR_materials_volume for glTF loader. ([MiiBond](https://github.com/MiiBond/))
- Added support for custom timeout in WebRequest. ([jamidwyer](https://github.com/jamidwyer/))
- Improved support for MSFT_lod, now LOD levels are loaded and accurately displayed according to screen coverage ([CraigFeldspar](https://github.com/CraigFeldspar))
- Added support for direct loading [base64 data URLs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs) for all loader ([CoPrez](https://github.com/CoPrez))
- Added DO_NOT_ALTER_FILE_COORDINATES flag to STL loader ([AlbertoPa](https://github.com/AlbertoPa))

### Navigation

- Added support for thin instances in navigation mesh creation ([CedricGuillemet](https://github.com/CedricGuillemet))
- Added recast.d.ts definition file for recast.js ([CedricGuillemet](https://github.com/CedricGuillemet))
- Added obstacle support ([CedricGuillemet](https://github.com/CedricGuillemet))

### Materials

- Added an `OcclusionMaterial` to simplify depth-only rendering of geometry ([rgerd](https://github.com/rgerd))
- PrePass can now be used in `RenderTargets` speeding up effects like SSAO2 or MotionBlur ([CraigFeldspar](https://github.com/CraigFeldspar))
- Added support for morph targets to `ShaderMaterial` ([Popov72](https://github.com/Popov72))
- Added support for clip planes to the `ShaderMaterial` ([Popov72](https://github.com/Popov72))
- Added support for local cube map to refraction cube texture ([Popov72](https://github.com/Popov72))
- Added the `cullBackFaces` property to `Material` ([Popov72](https://github.com/Popov72))
- Added the `stencil` object property to `Material` ([Popov72](https://github.com/Popov72))
- Set the `metadata` property on `Material` to be serializable, so that it can be properly loaded from .babylon files ([jlivak](https://github.com/jlivak))
- Add `mesh.visibility` support to grid material ([bghgary](https://github.com/bghgary))

### Meshes

- `LineMesh` now allows assigning custom material via `material` setter. ([FullStackForger](https://github.com/FullStackForger)
- `InstancedMesh` can now be sorted from back to front before rendering if the material is transparent ([Popov72](https://github.com/Popov72))
- Add option to decompose the `newWorldMatrix` when passed into `TransformNode.freezeWorldMatrix`. ([bghgary](https://github.com/bghgary))
- Added `mesh.onMeshReadyObservable` to get notified when a mesh is ready ([RaananW](https://github.com/RaananW))
- Added support for morph targets to the mesh `BoundingInfo` refresh. ([EricBeetsOfficial-Opuscope](https://github.com/EricBeetsOfficial-Opuscope))

### Inspector

- Increased float precision to 4 ([msDestiny14](https://github.com/msDestiny14))
- Added support for sounds in the inspector ([Deltakosh](https://github.com/deltakosh))
- Added a debug option to show the frustum of a directional light ([Popov72](https://github.com/Popov72))
- Added support for the material stencil properties ([Popov72](https://github.com/Popov72))
- Added space + LMB panning to texture inspector to improve accessibility ([darraghjburke](https://github.com/darraghjburke))

### NME

- Increased float precision to 4 ([msDestiny14](https://github.com/msDestiny14))
- Added ability to make input node's properties visible in the properties of a custom frame ([msDestiny14](https://github.com/msDestiny14))
- NME `TextureBlock`: add an output for the texture level and a switch to disable the internal multiplication (level * texture) ([#10192](https://github.com/BabylonJS/Babylon.js/pull/10192)) ([rassie](https://github.com/rassie))
- Added support for parallax / parallax occlusion to the `PerturbNormal` block ([Popov72](https://github.com/Popov72))
- Added a `SceneDepth` block to access the scene depth buffer ([Popov72](https://github.com/Popov72))

### GUIEditor

- Added GUI Editor project to master. ([msDestiny14](https://github.com/msDestiny14))
- Moving GUI property tab components into GUIEditor. ([msDestiny14](https://github.com/msDestiny14))
- Added basic saving and loading funtionality. ([msDestiny14](https://github.com/msDestiny14))
- Added more GUI controls. ([msDestiny14](https://github.com/msDestiny14))
- Added snippet server from url functionality ([msDestiny14](https://github.com/msDestiny14))
- Added scrolling and zooming functionality ([msDestiny14](https://github.com/msDestiny14))
- Added resizable canvas ([msDestiny14](https://github.com/msDestiny14))
- Added parenting system for scene explorer ([msDestiny14](https://github.com/msDestiny14))
- Added ability to change zorder ([msDestiny14](https://github.com/msDestiny14))
- Added highlighting on selection ([msDestiny14](https://github.com/msDestiny14))
- Creating default values for controls ([msDestiny14](https://github.com/msDestiny14))
- Bug fix to panning ([msDestiny14](https://github.com/msDestiny14))
- Added black bar and scene explorer view ([msDestiny14](https://github.com/msDestiny14))
- Added navigation hotkeys ([msDestiny14](https://github.com/msDestiny14))

### GUI

- Added a `FocusableButton` gui control to simplify creating menus with keyboard navigation ([Flux159](https://github.com/Flux159))
- Added `focus()` and `blur()` functions for controls that implement `IFocusableControl` ([Flux159](https://github.com/Flux159))
- Added `ToggleButton` GUI control ([kintz09](https://github.com/kintz09))
- Added shorthand methods which set all padding values at once, named `setPadding` and `setPaddingInPixels`, to the control class ([kintz09](https://github.com/kintz09))
- Added two touch-enabled GUI controls, `TouchMeshButton3D` and `TouchHolographicButton`, added option on the WebXR hand tracking feature for enabling touch collisions ([rickfromwork](https://github.com/rickfromwork), [satyapoojasama](https://github.com/satyapoojasama))
- Added `imageWidth()` and `imageHeight()` to access the source image dimensions of `Image` ([Queatz](https://github.com/Queatz))
- Added a `FluentButtonMaterial` to give the `TouchHolographicButton` the same look and feel as the HoloLens 2 shell ([rgerd](https://github.com/rgerd))
- Added property `renderToIntermediateTexture` to `Container` which when set to true, will render children to an intermediate texture rather than direct to host allowing for DOM style alpha blending ([BlindingHues](https://github.com/blindinghues))
- Added `HolographicSlate` GUI control ([CraigFeldspar](https://github.com/CraigFeldspar))
- Added `HolographicBackplate` to serve as a flexible panel in GUI controls using the MRTK design language ([rgerd](https://github.com/rgerd))
- Added `NearMenu` GUI control ([CraigFeldspar](https://github.com/CraigFeldspar))
- Added `HandMenu`, a simple menu that uses `HandConstraintBehavior` ([CraigFeldspar](https://github.com/CraigFeldspar))

### Behaviors

- Added `FollowBehavior`, a behavior that makes the assigned mesh hover around a camera, while facing it ([CraigFeldspar](https://github.com/CraigFeldspar))
- Added `SurfaceMagnetismBehavior`, a behavior that makes the assigned mesh stick on surfaces of other meshes ([CraigFeldspar](https://github.com/CraigFeldspar))
- Added `DefaultBehavior`, a behavior that will be common to several 3D GUI controls, orchestrating `SixDoFDragBehavior`, `FollowBehavior` and `SurfaceMagnetismBehavior` ([CraigFeldspar](https://github.com/CraigFeldspar))
- Added `draggableMeshes` property in `SixDoFDragBehavior` list in order to have only a subset of descendant meshes take pointer events into account ([CraigFeldspar](https://github.com/CraigFeldspar))
- `SixDoFDragBehavior` can now handle multiple pointers at the same time to scale/rotate the owner mesh ([CraigFeldspar](https://github.com/CraigFeldspar))
- Added `HandConstraintBehavior`, to make the assigned mesh follow the hand pose. This behavior requires to be linked to a XR experience with the `HandTracking` feature activated. ([CraigFeldspar](https://github.com/CraigFeldspar))

### WebXR

- A browser error preventing the emulator to render scene is now correctly dealt with ([RaananW](https://github.com/RaananW))
- Added a way to extend the XRSessionInit Object from inside of a feature ([RaananW](https://github.com/RaananW))
- Added image tracking feature ([RaananW](https://github.com/RaananW))
- Pointer Events of WebXR controllers have pointerType `xr` ([RaananW](https://github.com/RaananW))
- better support for custom hand meshes ([RaananW](https://github.com/RaananW))
- Allow disabling of the WebXRControllerPointerSelection feature as part of the WebXR Default Experience ([rgerd](https://github.com/rgerd))
- Added two touch-enabled GUI controls, `TouchMeshButton3D` and `TouchHolographicButton`, added option on the WebXR hand tracking feature for enabling touch collisions ([rickfromwork](https://github.com/rickfromwork), [satyapoojasama](https://github.com/satyapoojasama))
- Added initial support for the `sessiongranted` event ([#9860](https://github.com/BabylonJS/Babylon.js/issues/9860)) ([RaananW](https://github.com/RaananW))
- Remove the warning for input source not found when in (touch)screen mode ([#9938](https://github.com/BabylonJS/Babylon.js/issues/9938)) ([RaananW](https://github.com/RaananW))
- Fixed an issue with resources disposal when exiting XR ([#10012](https://github.com/BabylonJS/Babylon.js/issues/10012)) ([RaananW](https://github.com/RaananW))
- Added observable to target mesh position update for teleportation ([#9402](https://github.com/BabylonJS/Babylon.js/issues/9402)) ([RaananW](https://github.com/RaananW))
- Prevent the XR render target texture from rescaling when using the scene optimizer ([#10135](https://github.com/BabylonJS/Babylon.js/issues/10135)) ([RaananW](https://github.com/RaananW))
- Force https when using WebXR except for when hostname is localhost ([#10154](https://github.com/BabylonJS/Babylon.js/issues/10154)) ([RaananW](https://github.com/RaananW))
- Use the newly-introduced physics velocities of controllers/headset where available ([#10118](https://github.com/BabylonJS/Babylon.js/issues/10118)) ([RaananW](https://github.com/RaananW))
- Added support for `xr-dom-overlay` ([#8996](https://github.com/BabylonJS/Babylon.js/issues/8996)) ([brianzinn](https://github.com/brianzinn))
- Added near interaction events (hover, grab, and near-pick) ([satyapoojasama](https://github.com/satyapoojasama))
- Added XR Movement Controller feature for ([#7442](https://github.com/BabylonJS/Babylon.js/issues/7442)) ([brianzinn](https://github.com/brianzinn))

### Gizmos

- Exposed `scaleDragSpeed` and added `axisFactor` for BoundingBoxGizmo ([CedricGuillemet](https://github.com/CedricGuillemet))
- Provide additional attributes `_customRotationQuaternion` to customize the posture of the gizmo ([ecojust](https://github.com/ecojust))
- Exposed `scaleRatio` for GizmoManager ([CedricGuillemet](https://github.com/CedricGuillemet))
- Added constructor parameters to customize colors for rotation gizmos on RotationGizmo ([jekelija](https://github.com/jekelija))
- Added constructor parameters to allow turning off updateScale on RotationGizmo ([jekelija](https://github.com/jekelija))

### Viewer

- Fixed an issue with dual callback binding in case of a forced redraw ([#9608](https://github.com/BabylonJS/Babylon.js/issues/9608)) ([RaananW](https://github.com/RaananW))

### Math

- Faster scalar's WithinEpsilon with Math.abs ([nekochanoide](https://github.com/nekochanoide))
- Added decomposeToTransformNode ([RaananW](https://github.com/RaananW))

### Serializers

- Added the `exportUnusedUVs` property to the `IExportOptions` interface that will prevent any unused vertex uv attributes from being stripped during the glTF export. ([ericbroberic](https://github.com/ericbroberic))
- glTF serializer now supports KHR_materials_clearcoat ([drigax](https://github.com/drigax))

## Bugs

- Fix CubeTexture extension detection when rootUrl has a query string ([civa86](https://github.com/civa86))
- Fix issue with the Promise polyfill where a return value was expected from resolve() ([Deltakosh](https://github.com/deltakosh))
- Fix ArcRotateCamera panning with axis decomposition ([CedricGuillemet](https://github.com/CedricGuillemet))
- Fix an issue with keyboard control (re)attachment. ([#9411](https://github.com/BabylonJS/Babylon.js/issues/9411)) ([RaananW](https://github.com/RaananW))
- Fix issue when scaling is reapplied with BoundingBoxGizmo and GizmoManager ([CedricGuillemet](https://github.com/CedricGuillemet)
- Fix direct loading of a glTF string that has base64-encoded URI. ([bghgary](https://github.com/bghgary))
- Fix capsule impostor size computation for ammojs ([CedricGuillemet](https://github.com/CedricGuillemet)
- Fix crash of some node materials using instances on iOS ([Popov72](https://github.com/Popov72))
- Fix the code generated for the NME gradient block ([Popov72](https://github.com/Popov72))
- Fix ssao2RenderingPipeline for orthographic cameras ([Kesshi](https://github.com/Kesshi))
- Fix mipmaps creation in the KTX2 decoder for non square textures ([Popov72](https://github.com/Popov72))
- Fix detail map not working in WebGL1 ([Popov72](https://github.com/Popov72))
- Fix ArcRotateCamera behaviour when panning is disabled on multiTouch event ([NicolasBuecher](https://github.com/NicolasBuecher))
- Fix vertically interlaced stereoscopic rendering (`RIG_MODE_STEREOSCOPIC_INTERLACED`) not working (follow-up [#7425](https://github.com/BabylonJS/Babylon.js/issues/7425), [#8000](https://github.com/BabylonJS/Babylon.js/issues/8000)) ([foxxyz](https://github.com/foxxyz))
- Fix accessibility of BaseCameraMouseWheelInput and BaseCameraPointersInput. They appear in documentation but were not available for include. ([mrdunk](https://github.com/mrdunk))
- Fix function creation inside regularly called freeCameraMouseWheelInput method leading to excessive GC load. ([mrdunk](https://github.com/mrdunk))
- Fix clip plane not reset to the rigth value when using mirrors ([Popov72](https://github.com/Popov72))
- Fix lens flares not working in right handed system ([Popov72](https://github.com/Popov72))
- Fix canvas not resized correctly in a multi-canvas scenario ([Popov72](https://github.com/Popov72))
- Fix NaN values returned by `GetAngleBetweenVectors` when vectors are the same or directly opposite ([Popov72](https://github.com/Popov72))
- Fix 404 occurring on some pictures in some cases when using particle systems ([Popov72](https://github.com/Popov72))
- Fix PrePass bugs with transparency ([CraigFeldspar](https://github.com/CraigFeldspar))
- Fix PrePass bugs with layers ([CraigFeldspar](https://github.com/CraigFeldspar))
- Fix SSAO2 with PrePass sometimes causing colors brighter than they should be ([CraigFeldspar](https://github.com/CraigFeldspar))
- Fix PostProcess sharing between cameras/renderTargets, that would create/destroy a texture on every frame ([CraigFeldspar](https://github.com/CraigFeldspar))
- Fix for DualSense gamepads being incorrectly read as DualShock gamepads ([PolygonalSun](https://github.com/PolygonalSun))
- Fix for warning in chrome about passive wheel events ([#9777](https://github.com/BabylonJS/Babylon.js/pull/9777)) ([kaliatech](https://github.com/kaliatech))
- Fix crash when cloning material in `AssetContainer.instantiateModelsToScene` when mesh is an instanced mesh ([Popov72](https://github.com/Popov72))
- Fix Normalized quaternion when updating the node components ([CedricGuillemet](https://github.com/CedricGuillemet))
- Fix update absolute position before use in PointerDragBehavior ([CedricGuillemet](https://github.com/CedricGuillemet))
- Fix issue with NinePatch displaying half pixel gaps between slices on Firefox browsers. ([Pryme8](https://github.com/Pryme8))
- Fix issue when canvas loses focus while holding a pointer button ([PolygonalSun](https://github.com/PolygonalSun))
- Fix issue where camera controls stay detached if PointerDragBehavior is disabled prematurely ([PolygonalSun](https://github.com/PolygonalSun))
- Fix uncatchable exception that could be thrown when initializing the environment textures ([CoPrez](https://github.com/CoPrez))
- Fix the triplanar material when the position of the mesh it is applied to is not (0,0,0) ([Popov72](https://github.com/Popov72))
- Fix bones serialization to include their ids. This allows to retrieve bones (animation groups, etc.) once the scene has been re-serialized ([julien-moreau](https://github.com/julien-moreau))
- Fix an issue with hand-detachment when using hand tracking in WebXR ([#9882](https://github.com/BabylonJS/Babylon.js/issues/9882)) ([RaananW](https://github.com/RaananW))
- Fix issue with cursor and 'doNotHandleCursors' on GUI ([msDestiny14](https://github.com/msDestiny14))
- Fix issue with multi-views when using a transparent scene clear color ([Popov72](https://github.com/Popov72))
- Fix issue with multi-views when using a hardware scaling level different from 1 ([Popov72](https://github.com/Popov72))
- Fix thin instances + animated bones not rendered in the depth renderer ([Popov72](https://github.com/Popov72))
- Fix issue with WebXR teleportation logic which would cause positional headlocking on teleporation frames ([syntheticmagus](https://github.com/syntheticmagus))
- Fix for GUI renderAtIdealSize ([msDestiny14](https://github.com/msDestiny14))
- Fix the strength input parameter of the NME `PerturbNormal` block that was handled as a 1/strength value ([Popov72](https://github.com/Popov72))
- Fix an issue with audio engine not being garbage-collected when engine is disposed ([RaananW](https://github.com/RaananW))
- Fix the NME `NormalBlend` block ([Popov72](https://github.com/Popov72))
- Fix Compatibility with NPM 7 ([Sebavan](https://github.com/sebavan))
- Fix for cloning meshes for 3D GUIs ([msDestiny14](https://github.com/msDestiny14))
- Fix computation of min/max values in glTF loader when using normalized integers ([#10112](https://github.com/BabylonJS/Babylon.js/issues/10112)) ([Popov72](https://github.com/Popov72))
- Fix instance picking when in billboard mode ([Popov72](https://github.com/Popov72))
- Fix NME generation code missing `target` and `visibleInInspector` properties ([Popov72](https://github.com/Popov72))
- Fix transmission mask being accidently used in glTF volume materials ([MiiBond](https://github.com/MiiBond/))
- Fix `Scene.getPointerOverMesh` returning disposed mesh ([Popov72](https://github.com/Popov72))
- Fix NME `TextureBlock` to use correct transformed UV coordinates when reading from the texture ([#10176](https://github.com/BabylonJS/Babylon.js/issues/10176)) ([Popov72](https://github.com/Popov72))
- Fix context lost handling ([#10163](https://github.com/BabylonJS/Babylon.js/issues/10163)) ([Popov72](https://github.com/Popov72))
- Fix for GUI slider step values greater than one ([msDestiny14](https://github.com/msDestiny14))
- Fix Instances wrongly rendered with motion blur ([CraigFeldspar](https://github.com/CraigFeldspar))
- Fix for wrongly rendered GUI rectangle on resize with adaptWidthToChildren ([msDestiny14](https://github.com/msDestiny14))
- Fix glTF loader promise stuck when runs on non-json data ([mrlika](https://github.com/mrlika))
- Fix for namepsace sharing in .scss files; PropertyTab, SceneExplorer ([msDestiny14](https://github.com/msDestiny14))
- Fix sprites not displayed in certain cases ([Popov72](https://github.com/Popov72))
- Fix undefined camera pose in WebXR in Babylon Native ([CraigFeldspar](https://github.com/CraigFeldspar))
- Fix some different behaviours between `ParticleSystem` and `GPUParticleSystem` when using the cylinder emitter. Also added `WebGL2ParticleSystem` (for WebGL2 support) and `ComputeShaderParticleSystem` (for WebGPU support) ([Popov72](https://github.com/Popov72))
- Fix the `StandardMaterial` not using the tangent attribute when available ([Popov72](https://github.com/Popov72))
- Fix code for handling getting DeviceType/DeviceSlot in DeviceInputSystem to work better with MouseEvents ([PolygonalSun](https://github.com/PolygonalSun))
- Fix vector2/3/4 and quaternion toString formatting ([rgerd](https://github.com/rgerd))
- Fix cloning skeleton when mesh is an instanced mesh ([Popov72](https://github.com/Popov72))
- Fix a bug where pointer up/move events were not sent to 3D controls when no mesh in the `UtilityLayerRenderer` is hit by the picking ray. ([CraigFeldspar](https://github.com/CraigFeldspar))
- Fix issue with DeviceInputSystem where Mouse was being deregistered on Safari/MacOS ([PolygonalSun](https://github.com/PolygonalSun))
- Fix for disabledColor not working for Button ([msDestiny14](https://github.com/msDestiny14))
- Fix NativeEngine not setting default depth test function to LEQUAL ([rgerd](https://github.com/rgerd))
- Fix an exception where loading a very small STL file could result in attempting to read outside the files range ([CoPrez](https://github.com/CoPrez))
- Fix support of `useReverseDepthBuffer` throughout the engine ([Popov72](https://github.com/Popov72))
- Fix issue with handling of negative Pointer IDs in DeviceInputSystem ([PolygonalSun](https://github.com/PolygonalSun))

## Breaking changes

- [List of breaking changes introduced by our compatibility with WebGPU](https://doc.babylonjs.com/advanced_topics/webGPU/webGPUBreakingChanges)
  - [ReadPixels and ProceduralTexture.getContent are now async](https://doc.babylonjs.com/advanced_topics/webGPU/webGPUBreakingChanges#readpixels-is-now-asynchronous)
  - [Shader support differences](https://doc.babylonjs.com/advanced_topics/webGPU/webGPUBreakingChanges#shader-code-differences)
- Use both `mesh.visibility` and `material.alpha` values to compute the global alpha value used by the soft transparent shadow rendering code. Formerly was only using `mesh.visibility` ([Popov72](https://github.com/Popov72))
- Depth renderer: don't render mesh if `infiniteDistance = true` or if `material.disableDepthWrite = true` ([Popov72](https://github.com/Popov72))
- Mesh.createInstance no longer make a unique Geometry for the Mesh so updating one Geometry can affect more meshes than before. Use Mesh.makeUniqueGeometry for old behaviour. ([breakin](https://github.com/breakin))
- Ammo.js needs to be initialized before creating the plugin with `await Ammo();` since Ammo introduced an async init in their library. ([sebavan](https://github.com/sebavan))
- Fixed spelling of EventState.initialize() ([seritools](https://github.com/seritools))
- `SkeletonViewer` is now enabled by default ([Deltakosh](https://github.com/deltakosh))
- `BindEyePosition` has been moved from `Material` to `Scene` to avoid a circular dependency problem and is now a non-static method (`bindEyePosition`) ([Popov72](https://github.com/Popov72))
- The depth renderer was not generating correct values for orthographic cameras when **storeNonLinearDepth = false** ([Popov72](https://github.com/Popov72))
- `dataBuffer.ts` and `buffer.ts` have been moved from `Meshes/` to `Buffers/` ([Popov72](https://github.com/Popov72))
- By default, the glTF loader now uses sRGB buffers for gamma encoded textures (when supported by the GPU), which is more accurate than using regular buffers. However, it can lead to small visual differences. You can disable usage of sRGB buffers by setting `glTFFileLoader.useSRGBBuffers` to `false` ([Popov72](https://github.com/Popov72))
- 4th (`isAnimationSheetEnabled`) and 5th (`customEffect`) parameters of `GPUParticleSystem` constructor have been inverted to match `ParticleSystem` constructor ([Popov72](https://github.com/Popov72))
- `PBRSubSurfaceConfiguration.useGltfStyleThicknessTexture` has been renamed to `PBRSubSurfaceConfiguration.useGltfStyleTextures` ([Popov72](https://github.com/Popov72))

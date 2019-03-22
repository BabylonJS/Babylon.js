# 4.0.0

## Major updates
- New [fancy forum](https://forum.babylonjs.com)!! ([Deltakosh](https://github.com/deltakosh))
- [Inspector v2.0](https://doc.babylonjs.com/features/playground_debuglayer). [Dev log](https://medium.com/@babylonjs/dev-log-creating-the-new-inspector-b15c50900205) ([Deltakosh](https://github.com/deltakosh))
- Added support for [parallel shader compilation](https://www.khronos.org/registry/webgl/extensions/KHR_parallel_shader_compile/) ([Deltakosh](https://github.com/deltakosh))
- Added [Object Based Motion Blur](http://doc.babylonjs.com/how_to/using_motionblurpostprocess) post-process ([julien-moreau](https://github.com/julien-moreau))
- Added [support for AmmoJS](https://doc.babylonjs.com/how_to/using_the_physics_engine) as a physics plugin (Composite objects, motors, joints) ([TrevorDev](https://github.com/TrevorDev))
  - Added support for soft bodies, which are 3D softbody, 2D cloth and 1D rope, in Ammo physics plugin. [Doc](https://doc.babylonjs.com/how_to/soft_bodies) ([JohnK](https://github.com/BabylonJSGuide))
  - Added support for [Convex Hull Impostor][https://github.com/kripken/ammo.js/blob/master/bullet/src/BulletCollision/CollisionShapes/btConvexHullShape.h] using Ammo.js plugin ([MackeyK24](https://github.com/mackeyk24))
  - Added AmmoJSPlugin scene file loader [MackeyK24](https://github.com/mackeyk24))
- Added support for [WebXR](https://doc.babylonjs.com/how_to/webxr) ([TrevorDev](https://github.com/TrevorDev))
  - Add customAnimationFrameRequester to allow sessions to hook into engine's render loop ([TrevorDev](https://github.com/TrevorDev))
  - camera customDefaultRenderTarget to allow cameras to render to a custom render target (eg. xr framebuffer) instead of the canvas ([TrevorDev](https://github.com/TrevorDev))
  - webXR camera which can be updated by a webXRSession ([TrevorDev](https://github.com/TrevorDev))
  - webXRSessionManager to bridge xrSession to babylon's camera/engine ([TrevorDev](https://github.com/TrevorDev))
  - webXRExperienceHelper to setup a default XR experience ([TrevorDev](https://github.com/TrevorDev))
  - WebXREnterExitUI and WebXRManagedOutputCanvas classes to configure the XR experience ([TrevorDev](https://github.com/TrevorDev))
  - WebXRInput manage controllers for the XR experience ([TrevorDev](https://github.com/TrevorDev))
  - WebXR camera rotation using parent container ([TrevorDev](https://github.com/TrevorDev))
- GUI:
  - Added `control.useBitmapCache` to optimize re-rendering of complex controls by keeping a cached version ([Deltakosh](https://github.com/deltakosh))
  - Added new [ImageBasedSlider](http://doc.babylonjs.com/how_to/gui#imagebasedslider) to let users customize sliders using images ([Deltakosh](https://github.com/deltakosh))
  - Added support for clipboard events to let users perform `cut`, `copy` and `paste` events ([Saket Saurabh](https://github.com/ssaket))
  - Added new [ScrollViewer](https://doc.babylonjs.com/how_to/scrollviewer) with mouse wheel scrolling for larger containers to be viewed using Sliders ([JohnK](https://github.com/BabylonJSGuide/) / [Deltakosh](https://github.com/deltakosh))
  - Moved to a measure / draw mechanism ([Deltakosh](https://github.com/deltakosh))
  - Added support for [nine patch stretch](https://www.babylonjs-playground.com/#G5H9IN#2) mode for images. ([Deltakosh](https://github.com/deltakosh))
  - InvalidateRect added to AdvancedDynamicTexture to improve perf for heavily populated GUIs, works with shadows ([TrevorDev](https://github.com/TrevorDev)) **** NEED DEMO or DOC LINK)
- Migrated the code to modules and deploy [ES6 npm packages](https://doc.babylonjs.com/features/es6_support) ([Sebavan](https://github.com/Sebavan))
- Added `TrailMesh` class. Credit to furcatomasz ([danjpar](https://github.com/danjpar)) **** NEED DEMO or DOC LINK)
- Support rendering to a Multiview outputRenderTargetTexture with multiview engine component to improve performance for XR scenarios ([TrevorDev](https://github.com/TrevorDev))
- PBR:
  - Added Inspector Debug Mode ([Sebavan](https://github.com/Sebavan)) **** NEED DEMO or DOC LINK)
  - Added Smith Height Correlated Visibility term to PBR ([Sebavan](https://github.com/Sebavan)) **** NEED DEMO or DOC LINK)
  - Added energy conservation through Multiscattering BRDF support to PBR ([Sebavan](https://github.com/Sebavan)) **** NEED DEMO or DOC LINK)
  - Added clear coat support to PBR ([Sebavan](https://github.com/Sebavan)) **** NEED DEMO or DOC LINK)
  - Added anisotropy support to PBR ([Sebavan](https://github.com/Sebavan)) **** NEED DEMO or DOC LINK)
  - Added sheen support to PBR ([Sebavan](https://github.com/Sebavan)) **** NEED DEMO or DOC LINK)
  - Added sub-surface support to PBR ([Sebavan](https://github.com/Sebavan)) **** NEED DEMO or DOC LINK)
- Added a STL exporter ([pryme8](https://github.com/pryme8))

## Optimizations
- Added an engine creation option to compile all shaders with medium precision ([Deltakosh](https://github.com/deltakosh))
- Optimized effect reused for shadow maps ([Deltakosh](https://github.com/deltakosh))
- Added support for Scissor testing ([Deltakosh](https://github.com/deltakosh))
- Improved shader precision detection ([Deltakosh](https://github.com/deltakosh))
- Added support for bone matrix texture. Now skeletons will use a texture instead of uniforms when possible ([Deltakosh](https://github.com/deltakosh))
- Refactored of the SolidParticleSystem code for performance and code quality improvement ([barroij](https://github.com/barroij))
- Added per solid particle culling possibility : `solidParticle.isInFrustum()`  ([jerome](https://github.com/jbousquie))
- Performance oriented changes ([barroij](https://github.com/barroij))
  - Prevented avoidable matrix inversion or square root computation
  - Enabled a removal in O(1) from the `transformNodes` array and `materials` array of the `Scene`. As a consequence, the order of the element within these arrays might change during a removal
  - Enabled a removal in O(1) from the `instances` array of a `Mesh`. As a consequence, the order of the element within this array might change during a removal
  - Stopped calling `Array.splice` on the `scene.meshes` array and on the `engine._uniformBuffer` when removing an element. As a consequence, the order of the element within these arrays might change during a removal
  - Added an option `useGeometryUniqueIdsMap` in the `Scene` constructor options. When set to true, each `Scene` isntance will have and will keep up-to-date a map of geometry per `uniqueId`. This is to avoid browsing all the geometries of the scene when a new one is being pushed. It also enables a removal of geometry in O(1). Disabled by default
  - Added an option `useMaterialMeshMap` in the `Scene` constructor options. When set to true, each `Material` isntance will have and will keep up-to-date a map of its bound meshes. This is to avoid browsing all the meshes of the scene to retrieve the ones bound to the current material when disposing the Material. Disabled by default
  - Added an option `useClonedMeshhMap` in the `Scene` constructor options. When set to true, each `Mesh` will have and will keep up-to-date a map of cloned meshes. This is to avoid browsing all the meshes of the scene to retrieve the ones that have the current mesh as source mesh. Disabled by default
  - Added `blockfreeActiveMeshesAndRenderingGroups` property in the `Scene`, following the same model as `blockMaterialDirtyMechanism`. This is to avoid calling `Scene.freeActiveMeshes` and `Scene.freeRenderingGroups` for each disposed mesh when we dispose several meshes in a row. One have to set `blockfreeActiveMeshesAndRenderingGroups` to `true` just before disposing the meshes, and set it back to `false` just after
  - Prevented code from doing useless and possible time consuming computation when disposing the `ShaderMaterial` of a `LinesMesh`
  - Make a better use of the `isIdentity` cached value wihtin a `Matrix`
  - Make sure we browse all the submeshes only once in `Material.markAsDirty` function
  - Added an `Vector3.UnprojectRayToRef` static function to avoid computing and inverting the projection matrix twice when updating a Ray.
- Added per mesh culling strategy ([jerome](https://github.com/jbousquie))

## Updates

### GUI

- Added `inputText.onKeyboardEventProcessedObservable` ([Deltakosh](https://github.com/deltakosh))
- Added `button.image` and `button.textBlock` to simplify access to button internal parts ([Deltakosh](https://github.com/deltakosh))
- Added `slider.displayThumb` to show/hide slider's thumb ([Deltakosh](https://github.com/deltakosh))
- Added `grid.rowCount`, `grid.columnCount` and `grid.getChildrenAt()` ([Deltakosh](https://github.com/deltakosh))
- Added `Control.AllowAlphaInheritance` to let users control the way alpha is used (inherited or not) ([Deltakosh](https://github.com/deltakosh))
- Added support for performing operations like select all, text highlight, delete selected in `inputText` ([Saket Saurabh](https://github.com/ssaket))
- Added `inputText.onTextCopyObservable`, `inputText.onTextCutObservable` and `inputText.onTextPasteObservable` to inputText ([Saket Saurabh](https://github.com/ssaket))
- Added `AdvancedDynamicTexture.onClipboardObservable` to observe for clipboard events in AdvancedDynamicTexture([Saket Saurabh](https://github.com/ssaket))
- Added `inputText.onFocusSelectAll` to allow complete selection of text on focus event.([Saket Saurabh](https://github.com/ssaket))
- Added mouse drag to highlight text in inputText ([Saket Saurabh](https://github.com/ssaket))

### Core Engine

- Added new `WebRequest` class to centralize all network requests. Can be used to configure headers of all network requests ([Deltakosh](https://github.com/deltakosh))
- Added `WebRequest.CustomRequestHeaders`, `WebRequest.UseCustomRequestHeaders` to send Custom Request Headers alongside XMLHttpRequest's i.e. when loading files (Tools.Loadfile) from resources requiring special headers like 'Authorization' ([susares](https://github.com/susares))
- Added support for user clip planes to LineMeshes ([Deltakosh](https://github.com/deltakosh))
- Added `shadowGenerator.onBeforeShadowMapRenderMeshObservable` ([Deltakosh](https://github.com/deltakosh))
- Added support for `scene.customLODSelector` to let users define their own LOD rules ([Deltakosh](https://github.com/deltakosh))
- Added `animatable.onAnimationLoopObservable` ([Deltakosh](https://github.com/deltakosh))
- Added `animationGroup.onAnimationLoopObservable` ([Deltakosh](https://github.com/deltakosh))
- Added FlyCamera for free navigation in 3D space, with a limited set of settings ([Phuein](https://github.com/phuein))
- Added `Engine.onNewSceneAddedObservable` ([Deltakosh](https://github.com/deltakosh))
- Added new `PassCubePostProcess` to render cube map content ([Deltakosh](https://github.com/deltakosh))
- Added support for utility layer for SkeletonViewer ([Deltakosh](https://github.com/deltakosh))
- Added utility function `Tools.BuildArray` for array initialisation ([barroij](https://github.com/barroij))
- Introduced a new `IOfflineSupport` interface to hide IndexedDB ([Deltakosh](https://github.com/deltakosh))
- `PBRMaterial` and `StandardMaterial` now use hot swapping feature for shaders. This means they can keep using a previous shader while a new one is being compiled ([Deltakosh](https://github.com/deltakosh))
- Align `BoundingBox` and `BoundingSphere` API and behavior for clarity and simplicity. As a consequence, the `BoundingBox`'s method `setWorldMatrix` has been removed and the underlying world matrix cannot be modified but by calling `reConstruct` or `update`. ([barroij](https://github.com/barroij))
- Make sure that `Material.markAsDirty` and all the `markXXXDirty` methods early out when `scene.blockMaterialDirtyMechanism` is true. ([barroij](https://github.com/barroij))
- Add updateUpVectorFromRotation to target camera to allow the up vector to be computed from rotation ([TrevorDev](https://github.com/TrevorDev))
- Added opacity texture support to `GridMaterial` ([Deltakosh](https://github.com/deltakosh))
- Added support for deserializing morph target animations in animation groups
- AssetContainer dispose method ([TrevorDev](https://github.com/TrevorDev))
- Loading texture with KTX will fallback to non-KTX loader if KTX loader fails ([TrevorDev](https://github.com/TrevorDev))
- `Layer` are now supported in `RenderTargetTexture` ([Sebavan](https://github.com/Sebavan))
- Make onscreen joystick's canvas public ([TrevorDev](https://github.com/TrevorDev))
- Added `.serialize` and `.Parse` functions in `ReflectionProbe` to retrieve reflection probes when parsing a previously serialized material ([julien-moreau](https://github.com/julien-moreau))
- GizmoManager clearGizmoOnEmptyPointerEvent options and onAttachedToMeshObservable event ([TrevorDev](https://github.com/TrevorDev))
- Added support for overriding the mesh used for the world matrix for a mesh with a skeleton ([bghgary](https://github.com/bghgary))
- Added support for linking a bone to a transform node ([bghgary](https://github.com/bghgary))
- Factored out `setDirection` function from `lookAt` for transform node ([bghgary](https://github.com/bghgary))
- Add support for setting renderingGroupId and creating instances to `AxesViewer` ([bghgary](https://github.com/bghgary))
- Invert vScale of compressed ktx textures as they are inverted in the file and UNPACK_FLIP_Y_WEBGL is not supported by ktx ([TrevorDev](https://github.com/TrevorDev))
- Enable dragging in boundingBoxGizmo without needing a parent ([TrevorDev](https://github.com/TrevorDev))
- Added InputsManager and keyboard bindings for FollowCamera. ([mrdunk](https://github.com))
- Fix typo in FollowCamera InputsManager when limiting rotation to 360 degrees. ([mrdunk](https://github.com))
- In FollowCamera InputsManager, allow choice of modifier key (Alt, Ctrl and/or Shift) for each camera movement axis. ([mrdunk](https://github.com))
- Added MouseWheel bindings for FollowCamera. ([mrdunk](https://github.com))
- Tweak MouseWheel bindings for FollowCamera orientations. ([mrdunk](https://github.com))
- Added maximum and minimum limits for FollowCamera parameters. ([mrdunk](https://github.com))
- Convert ArcRotateCamera to use new BaseCameraPointersInput. ([mrdunk](https://github.com))
- Added transparency support to `GlowLayer` ([Sebavan](https://github.com/Sebavan))
- Added option `forceDisposeChildren` to multiMaterial.dispose ([danjpar](https://github.com/danjpar))
- Added Pointer bindings for FollowCamera. ([mrdunk](https://github.com))
- Inspector light gizmo with icons ([TrevorDev](https://github.com/TrevorDev))
- Added option `multiMultiMaterials` to mesh.mergeMeshes ([danjpar](https://github.com/danjpar))
- Expose fallback camera distortion metrics option in vrExperienceHelper ([TrevorDev](https://github.com/TrevorDev))
- Added OnAfterEnteringVRObservable to webVRHelper ([TrevorDev](https://github.com/TrevorDev))
- Added Support for Side By Side and Top/Bottom VR videos in the [video dome](https://doc.babylonjs.com/how_to/360videodome#video-types) ([Sebavan](https://github.com/Sebavan))
- Added UnitTests for BaseCameraPointersInput and ArcRotateCameraPointersInput. ([mrdunk](https://github.com))
- onActiveCameraChanged shouldn't be fired when rendering rig cameras ([TrevorDev](https://github.com/TrevorDev))
- Added `MeshExploder` class ([danjpar](https://github.com/danjpar))
- Observables can now make observers top or bottom priority ([TrevorDev](https://github.com/TrevorDev))
- Mesh outline no longer is shown through the mesh when it's transparent ([TrevorDev](https://github.com/TrevorDev))
- DeviceOrientationCamera will no longer be modified by mouse input if the orientation sensor is active ([TrevorDev](https://github.com/TrevorDev))
- Added LoadScriptAsync tools helper function [MackeyK24](https://github.com/mackeyk24))
- Added customShaderNameResolve to PBRMaterialBase to allow subclasses to specify custom shader information [MackeyK24](https://github.com/mackeyk24))
- Added PBRCustomMaterial to material library to allow easy subclassing of PBR materials [MackeyK24](https://github.com/mackeyk24))
- Added `auto-exposure` support in `StandardRenderingPipeline` when `HDR` is enabled ([julien-moreau](https://github.com/julien-moreau))

### OBJ Loader
- Add color vertex support (not part of standard) ([brianzinn](https://github.com/brianzinn))
- Add option for silently failing when materials fail to load ([brianzinn](https://github.com/brianzinn))
- Add option to skip loading materials ([brianzinn](https://github.com/brianzinn))

### glTF Loader

- Added support for mesh instancing for improved performance when multiple nodes point to the same mesh ([bghgary](https://github.com/bghgary))
- Create `TransformNode` objects instead of `Mesh` objects for glTF nodes without geometry ([bghgary](https://github.com/bghgary))
- Added glTF JSON pointers to metadata of nodes, materials, and textures ([bghgary](https://github.com/bghgary))
- Load KTX textures in the gltf2 loader when textureFormat is set on engine ([TrevorDev](https://github.com/TrevorDev))
- Skinned meshes now behave as intended by glTF ([bghgary](https://github.com/bghgary))
  - Skinned meshes now set an override mesh instead of reparenting to the `__root__` transform node
  - Loaded bones are linked with the transform node created for the corresponding glTF node
- Add `EquiRectangularCubeTexture` class to enable the usage of browser-canvas supported images as `CubeTexture`'s ([Dennis Dervisis](https://github.com/ddervisis))
- Add `EquiRectangularCubeTextureAssetTask` to be able to load `EquiRectangularCubeTexture`s via Asset Manager ([Dennis Dervisis](https://github.com/ddervisis))

### glTF Serializer

- Added support for exporting `KHR_lights_punctual`

### Post-Processes Library
- Added the [Ocean](https://doc.babylonjs.com/extensions/oceanpostprocess) post-process ([julien-moreau](https://github.com/julien-moreau))

### Materials Library
- Added the `cameraOffset` vector property in the `SkyMaterial` to get an offset according to the horizon ([julien-moreau](https://github.com/julien-moreau))
- Fixed `GradientMaterial` to consider disableLighting working as emissive ([julien-moreau](https://github.com/julien-moreau))
- Fixed fresnel term computation in `WaterMaterial` ([julien-moreau](https://github.com/julien-moreau))
- Fixed `TerrainMaterial.isReadyForSubMesh` to remove WebGL warnings ([julien-moreau](https://github.com/julien-moreau))
- Fixed `MixMaterial.isReadyForSubMesh` to remove WebGL warnings ([dad72](https://github.com/dad72))

### Infrastructure

- Adding Azure DevOps Build ([Sebavan](https://github.com/Sebavan))

### Viewer

## Bug fixes
- Fixed ArcRotateCamera.setTarget (position was sometimes wrong) ([Deltakosh](https://github.com/deltakosh))
- Fixed TransformNode.setDirection (orientation was wrong) ([Deltakosh](https://github.com/deltakosh))
- Fixed ArcRotateCamera control when upVector was modified ([Deltakosh](https://github.com/deltakosh))
- Fixed anaglyph mode for Free and Universal cameras ([Deltakosh](https://github.com/deltakosh))
- Fixed FileLoader's loading of a skybox, & added a parsed value for whether to create with PBR or STDMaterial ([Palmer-JC](https://github.com/Palmer-JC))
- Removed bones from rootNodes where they should never have been ([Deltakosh](https://github.com/deltakosh))
- Refocusing on input gui with pointer events ([TrevorDev](https://github.com/TrevorDev))
- Gizmo scaling not consistent when camera is parented ([TrevorDev](https://github.com/TrevorDev))
- Context loss causing unexpected results with dynamic textures, geometries with the same name and reflectionTextures ([TrevorDev](https://github.com/TrevorDev))
- CreateScreenshotUsingRenderTarget stretches mirror textures when setting both width and height ([TrevorDev](https://github.com/TrevorDev))
- VR helper only updating vr cameras position when entering vr, rotation was missing, laser distance stopped working ([TrevorDev](https://github.com/TrevorDev))
- Fix VR controllers after gltfLoader transformNode change ([TrevorDev](https://github.com/TrevorDev))
- Bounding Box fixedDragMeshScreenSize stopped working and allow rotating through bounding box ([TrevorDev](https://github.com/TrevorDev))
- VR helper would rotate non vr camera while in VR ([TrevorDev](https://github.com/TrevorDev))
- PointerDragBahavior using Mesh as base type, causing type-checking problems with AbstractMesh ([Poolminer](https://github.com/Poolminer/))
- TransformNode lookAt not working in world space when node's parent has rotation ([TrevorDev](https://github.com/TrevorDev))
- MakeNotPickableAndWrapInBoundingBox had unexpected behavior when input had scaling of 0 on an axis ([TrevorDev](https://github.com/TrevorDev))
- Fixed an issue with loading base64 encoded images in the glTF loader ([bghgary](https://github.com/bghgary))
- In multi-camera scenes the inspector would cause the camera's interaction events to get detached ([TrevorDev](https://github.com/TrevorDev))
- Fix delete highlighted text after keyboard input, beat delay after double click event in InputText ([Saket Saurabh](https://github.com/ssaket))
- SixDofDragBehavior will support when the camera is parented ([TrevorDev](https://github.com/TrevorDev))
- Deactivate webvr lasers when not in vr ([TrevorDev](https://github.com/TrevorDev))
- Update physics position using absolutePosition instead of pivotPosition ([TrevorDev](https://github.com/TrevorDev))
- Disable camera arrow key controls when the Command key is selected on Mac OS ([kcoley](https://github.com/kcoley))
- Viewer should not set receiveShadows on an instanced mesh ([TrevorDev](https://github.com/TrevorDev))
- Rotation/Scaling snapping not working in the negative direction ([TrevorDev](https://github.com/TrevorDev))
- Updated comment in TransformNode.rotationQuaternion to include undefined as one of the potential return values ([nathankmiller](https://github.com/nathankmiller))
- CannonJS ignores connectedPivot joint parameter ([TrevorDev](https://github.com/TrevorDev))
- Fix case sensitive paths ([mrdunk](https://github.com))
- Fix more case sensitive paths ([mrdunk](https://github.com))
- Attaching a BoundingBoxGizmo on a child should not remove its parent ([TrevorDev](https://github.com/TrevorDev))
- AmmoJS fix include issue caused after modules update and use world contact point to be consistent with Oimo and Cannon ([TrevorDev](https://github.com/TrevorDev))
- Warn of motor with maxForce in Oimo plugin and set default force to be consistent with others, cannonJS support no impostor, cannonJS cylinder axis, ammoJS wake up impostor when apply force/impulse ([TrevorDev](https://github.com/TrevorDev))
- Utility layer should render on last active camera ([TrevorDev](https://github.com/TrevorDev))
- PointerDragBehavior should not let the drag plane get out of sync when rotating the object during dragging ([TrevorDev](https://github.com/TrevorDev))
- Do not crash the application if webVR submitFrame fails ([TrevorDev](https://github.com/TrevorDev))
- Fix pinch action on FollowCameraPointersInput ([mrdunk](https://github.com))
- Tools.CreateScreenshot stopped working ([TrevorDev](https://github.com/TrevorDev))
- Inspector showing duplicate nodes when attached to gizmo ([TrevorDev](https://github.com/TrevorDev))
- Add missing dependencies for files to support including them from a direct path (eg. import "@babylonjs/core/Helpers/sceneHelpers";) ([TrevorDev](https://github.com/TrevorDev))
- AssetContainer should not dispose objects it doesn't contain. Support for environmentTexture add/remove ([TrevorDev](https://github.com/TrevorDev))
- Fix `mesh.visibility` not working properly when certain material properties are set that changes the interpretation of alpha (e.g. refraction, specular over alpha, etc.) ([bghgary](https://github.com/bghgary))
- Fix material and texture leak when loading/removing GLTF/obj/babylon files with AssetContainer ([TrevorDev](https://github.com/TrevorDev))
- Avoid exception when removing impostor during cannon world step ([TrevorDev](https://github.com/TrevorDev))
- Fix code branch, that does not try to (re)load a `EquiRectangularCubeTexture`/`HDRCubeTexture` when the caching returns an empty or corrupt `InternalTexture` ([Dennis Dervisis](https://github.com/ddervisis))
- Add error eventlistener (bubbling up the onError callback chain) in case an `EquiRectangularCubeTexture` can not be loaded, because of a wrong path or IO problems ([Dennis Dervisis](https://github.com/ddervisis))

### Core Engine
- Fixed a bug with `mesh.alwaysSelectAsActiveMesh` preventing layerMask to be taken in account ([Deltakosh](https://github.com/deltakosh))
- Fixed a bug with pointer up being fire twice ([Deltakosh](https://github.com/deltakosh))
- Fixed a bug with particle systems being update once per camera instead of once per frame ([Deltakosh](https://github.com/deltakosh))
- Handle properly the `LinesMesh` `intersectionThreshold` by using its value directly when the intersection against a `Ray` is checked, instead of extending the `BoundingInfo` accordingly + Addded an `InstancesLinesMesh` class used to create instance of `LinesMesh` so that each instance can have its own `intersectionThreshold` value ([barroij](https://github.com/barroij))
- Fixed the `LineEdgesRenderer` used for edge rendering of `LinesMesh` handle properly LinesMesh made of disconnected lines + Make it work for instance of `LinesMesh` ([barroij](https://github.com/barroij))
- Fixed `Matrix.toNormalMatrix`function ([barroij](https://github.com/barroij))
- Add missing effect layer to asset container ([TrevorDev](https://github.com/TrevorDev))
- Fixed effect layer compatibility with multi materials ([Sebavan](https://github.com/Sebavan))
- Added a `DeepImmutable<T>` type to specifiy that a referenced object should be considered recursively immutable, meaning that all its properties are `readonly` and that if a property is a reference to an object, this object is also recursively immutable. ([barroij](https://github.com/barroij))
- Fixed `VideoTexture` poster property when autoplay is turned off.
- Fixed position and rotation of plane mesh created by MeshBuilder.CreatePlane when specifying a source plane ([sable](https://github.com/thscott), [bghgary](https://github.com/bghgary))
- Fixed inspector dynamic loading ([Sebavan](https://github.com/Sebavan))
- Fixed infiniteDistance not working anymore ([Sebavan](https://github.com/Sebavan))
- Fixed bug in SolidParticle BoundingSphere update within the SolidParticleSystem ([barroij](https://github.com/barroij))
- Update Picking so that when the picked Mesh is a LinesMesh, the index of the picked line is returned in the `faceId` property of the `PickingInfo`, as we do with face index the picked Mesh is made of triangle faces ([barroij](https://github.com/barroij))
- Do not clone mesh observables ([Sebavan](https://github.com/Sebavan))
- Fixed Inspector resolution with AMD loader ([Sebavan](https://github.com/Sebavan))
- Fix a bug when a call to `updateIndices` leads to changing the size of the index buffer by recreating the subMeshes in that case ([barroij](https://github.com/barroij))
- Add option to disable gazeTracker color changes in vrExperienceHelper ([TrevorDev](https://github.com/TrevorDev))
- PointerDragBehavior validateDrag predicate to stop dragging to specific points ([TrevorDev](https://github.com/TrevorDev))
- Auto Update Touch Action [#5674](https://github.com/BabylonJS/Babylon.js/issues/5674)([Sebavan](https://github.com/Sebavan))
- Add hemispheric lighting to gizmos to avoid flat look ([TrevorDev](https://github.com/TrevorDev))
- Fix a bug causing `WebRequest.open` to crash if `WebRequest.CustomRequestHeaders` are set [#6055](https://github.com/BabylonJS/Babylon.js/issues/6055)([susares](https://github.com/susares))

### Viewer

### Loaders

- Added missing `loadedAnimationGroups` to `MeshAssetTask` ([bghgary](https://github.com/bghgary))

## Breaking changes

- All references to XmlHttpRequest were replace by `WebRequest` (which provides the same signatures) ([Deltakosh](https://github.com/deltakosh))
- `Database.IDBStorageEnabled` is now false by default ([Deltakosh](https://github.com/deltakosh))
- `Database.openAsync` was renamed by `Database.open` ([Deltakosh](https://github.com/deltakosh))
- `scene.database` was renamed to `scene.offlineProvider` ([Deltakosh](https://github.com/deltakosh))
- `BoundingBox.setWorldMatrix` was removed. `BoundingBox.getWorldMatrix` now returns a `DeepImmutable<Matrix>` ([barroij](https://github.com/barroij))
- `Matrix`'s accessor `m` and method `toArray` and `asArray` now returns a `DeepImmutable<Float32Array>` as the matrix underlying array is not supposed to be modified manually from the outside of the class ([barroij](https://github.com/barroij))
- Removed some deprecated (flagged since 3.0) properties and functions ([Deltakosh](https://github.com/deltakosh))
  - `scene.getInterFramePerfCounter()`: use SceneInstrumentation class instead
  - `scene.interFramePerfCounter`: use SceneInstrumentation class instead
  - `scene.getLastFrameDuration()`: use SceneInstrumentation class instead
  - `scene.lastFramePerfCounter`: use SceneInstrumentation class instead
  - `scene.getEvaluateActiveMeshesDuration()`: use SceneInstrumentation class instead
  - `scene.evaluateActiveMeshesDurationPerfCounter`: use SceneInstrumentation class instead
  - `scene.getRenderTargetsDuration()`: use SceneInstrumentation class instead
  - `scene.getRenderDuration()`: use SceneInstrumentation class instead
  - `scene.renderDurationPerfCounter`: use SceneInstrumentation class instead
  - `scene.getParticlesDuration()`: use SceneInstrumentation class instead
  - `scene.particlesDurationPerfCounter`: use SceneInstrumentation class instead
  - `scene.getSpritesDuration()`: use SceneInstrumentation class instead
  - `scene.spriteDuractionPerfCounter`: use SceneInstrumentation class instead
  - `engine.drawCalls`: use SceneInstrumentation class instead
  - `engine.drawCallsPerfCounter`: use SceneInstrumentation class instead
  - `shadowGenerator.useVarianceShadowMap`: use useExponentialShadowMap instead
  - `shadowGenerator.useBlurVarianceShadowMap`: use useBlurExponentialShadowMap instead
- The glTF loader now creates `InstancedMesh` objects when two nodes point to the same mesh ([bghgary](https://github.com/bghgary))
- The glTF loader now creates `TransformNode` objects instead of `Mesh` objects for glTF nodes without geometry ([bghgary](https://github.com/bghgary))
  - _Note: The root node is still a `Mesh` object and is still the first in the returned list of meshes_
  - `TransformNode` objects are excluded from the returned list of meshes when importing mesh
  - `TransformNode` objects do not raise `onMeshLoaded` events
- `xAxisMesh`, `yAxisMesh`, and `zAxisMesh` of `AxesViewer` was renamed to `xAxis`, `yAxis`, and `zAxis` respectively and now return a `TransformNode` to represent the parent node of the cylinder and line of the arrow ([bghgary](https://github.com/bghgary))
- `Viewport.toglobal` does not allow passing engine in to prevent circular dependency ([Sebavan](https://github.com/Sebavan))
- `Vector3.UnprojectRayToRef` has been moved to `Ray.unprojectRayToRef` instance method to decrease class coupling ([Sebavan](https://github.com/Sebavan))
- `Material.ParseMultiMaterial` has been moved to `MultiMaterial.ParseMultiMaterial` to decrease class coupling ([Sebavan](https://github.com/Sebavan))
- No more `babylon.no-module.max.js` javascript version has the Webpack UMD bundle covers both ([Sebavan]
(https://github.com/Sebavan))
- No more `es6.js` javascript as it is now available as a true es6 npm package ([Sebavan](https://github.com/Sebavan))
- No more `babylon.worker.js` javascript following the lack of usage from the feature ([Sebavan]
(https://github.com/Sebavan))
- No more `Primitive Geometries` as they were not in use since 2.0 ([Sebavan](https://github.com/Sebavan))
- Change `shouldExportTransformNode` callback in glTF serializer options to `shouldExportNode`([kcoley](https://github.com/kcoley))
- Changed `PhysicsHelper` method parameters for event calls ([bobalazek](https://github.com/bobalazek))

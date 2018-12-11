# 4.0.0

## Major updates

- [Inspector v2.0](https://doc.babylonjs.com/features/playground_debuglayer). [Dev log](https://medium.com/@babylonjs/dev-log-creating-the-new-inspector-b15c50900205) ([Deltakosh](https://github.com/deltakosh))
- Added support for [parallel shader compilation](https://www.khronos.org/registry/webgl/extensions/KHR_parallel_shader_compile/) ([Deltakosh](https://github.com/deltakosh))
- Added [Object Based Motion Blur](http://doc.babylonjs.com/how_to/using_motionblurpostprocess) post-process ([julien-moreau](https://github.com/julien-moreau))
- Added [support for AmmoJS](https://doc.babylonjs.com/how_to/using_the_physics_engine) as a physics plugin (Composite objects, joints, motors) ([TrevorDev](https://github.com/TrevorDev))
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

## Updates

### GUI

- Added `inputText.onKeyboardEventProcessedObservable` ([Deltakosh](https://github.com/deltakosh))
- Added `button.image` and `button.textBlock` to simplify access to button internal parts ([Deltakosh](https://github.com/deltakosh))
- Added `sldier.displayThumb` to show/hide slider's thumb ([Deltakosh](https://github.com/deltakosh))
- Added `grid.rowCount`, `grid.columnCount` and `grid.getChildrenAt()` ([Deltakosh](https://github.com/deltakosh))
- Added `Control.AllowAlphaInheritance` to let users control the way alpha is used (inherited or not) ([Deltakosh](https://github.com/deltakosh))
- Added support for performing operations like select all, text highlight, delete selected in `inputText` ([Saket Saurabh](https://github.com/ssaket))
- Added `inputText.onTextCopyObservable`, `inputText.onTextCutObservable` and `inputText.onTextPasteObservable` to inputText ([Saket Saurabh](https://github.com/ssaket))
- Added `AdvancedDynamicTexture.onClipboardObservable` to observe for clipboard events in AdvancedDynamicTexture([Saket Saurabh](https://github.com/ssaket))
- Added `inputText.onFocusSelectAll` to allow complete selection of text on focus event.([Saket Saurabh](https://github.com/ssaket))
- Added mouse drag to highlight text in inputText ([Saket Saurabh](https://github.com/ssaket))

### Core Engine

- Added `animatable.onAnimationLoopObservable` ([Deltakosh](https://github.com/deltakosh))
- Added `animationGroup.onAnimationLoopObservable` ([Deltakosh](https://github.com/deltakosh))
- Added FlyCamera for free navigation in 3D space, with a limited set of settings ([Phuein](https://github.com/phuein))
- Added support for Scissor testing ([Deltakosh](https://github.com/deltakosh))
- Added `Engine.onNewSceneAddedObservable` ([Deltakosh](https://github.com/deltakosh))
- Added new `PassCubePostProcess` to render cube map content ([Deltakosh](https://github.com/deltakosh))
- Added support for utility layer for SkeletonViewer ([Deltakosh](https://github.com/deltakosh))
- Improved shader precision detection ([Deltakosh](https://github.com/deltakosh))
- Added support for bone matrix texture. Now skeletons will use a texture instead of uniforms when possible ([Deltakosh](https://github.com/deltakosh))
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
  - Make a better use of the `isIdentity` cached value wihtin a `Matrix`
  - Make sure we browse all the submeshes only once in `Material.markAsDirty` function
  - Added an `Vector3.UnprojectRayToRef` static function to avoid computing and inverting the projection matrix twice when updating a Ray.
- Align `BoundingBox` and `BoundingSphere` API and behavior for clarity and simplicity. As a consequence, the `BoundingBox`'s method `setWorldMatrix` has been removed and the underlying world matrix cannot be modified but by calling `reConstruct` or `update`. ([barroij](https://github.com/barroij))
- Make sure that `Material.markAsDirty` and all the `markXXXDirty` methods early out when `scene.blockMaterialDirtyMechanism` is true. ([barroij](https://github.com/barroij))
- Add updateUpVectorFromRotation to target camera to allow the up vector to be computed from rotation ([TrevorDev](https://github.com/TrevorDev))
- Added opacity texture support to `GridMaterial` ([Deltakosh](https://github.com/deltakosh))
- Added support for deserializing morph target animations in animation groups
- AssetContainer dispose method ([TrevorDev](https://github.com/TrevorDev))
- Loading texture with KTX will fallback to non-KTX loader if KTX loader fails ([TrevorDev](https://github.com/TrevorDev))
- `Layer` are now supported in `RenderTargetTexture` ([Sebavan](https://github.com/Sebavan))
- Make onscreen joystick's canvas public ([TrevorDev](https://github.com/TrevorDev))
- Added `Tools.CustomRequestHeaders`, `Tools.UseCustomRequestHeaders`, `Tools.InjectCustomRequestHeaders` to send Custom Request Headers alongside XMLHttpRequest's i.e. when loading files (Tools.Loadfile) from resources requiring special headers like 'Authorization' ([susares](https://github.com/susares))
- Added `.serialize` and `.Parse` functions in `ReflectionProbe` to retrieve reflection probes when parsing a previously serialized material ([julien-moreau](https://github.com/julien-moreau))
- GizmoManager clearGizmoOnEmptyPointerEvent options and onAttachedToMeshObservable event ([TrevorDev](https://github.com/TrevorDev))
- Added support for overriding the mesh used for the world matrix for a mesh with a skeleton ([bghgary](https://github.com/bghgary))
- Added support for linking a bone to a transform node ([bghgary](https://github.com/bghgary))
- Factored out `setDirection` function from `lookAt` for transform node ([bghgary](https://github.com/bghgary))
- Add support for setting renderingGroupId and creating instances to `AxesViewer` ([bghgary](https://github.com/bghgary))
- Invert vScale of compressed ktx textures as they are inverted in the file and UNPACK_FLIP_Y_WEBGL is not supported by ktx ([TrevorDev](https://github.com/TrevorDev))
- Enable dragging in boundingBoxGizmo without needing a parent ([TrevorDev](https://github.com/TrevorDev))

### glTF Loader

- Added support for mesh instancing for improved performance when multiple nodes point to the same mesh ([bghgary](https://github.com/bghgary))
- Create `TransformNode` objects instead of `Mesh` objects for glTF nodes without geometry ([bghgary](https://github.com/bghgary))
- Added glTF JSON pointers to metadata of nodes, materials, and textures ([bghgary](https://github.com/bghgary))
- Load KTX textures in the gltf2 loader when textureFormat is set on engine ([TrevorDev](https://github.com/TrevorDev))
- Skinned meshes now behave as intended by glTF ([bghgary](https://github.com/bghgary))
  - Skinned meshes now set an override mesh instead of reparenting to the `__root__` transform node
  - Loaded bones are linked with the transform node created for the corresponding glTF node

### glTF Serializer

### Viewer

### Materials Library
- Added the `cameraOffset` vector property in the `SkyMaterial` to get an offset according to the horizon ([julien-moreau](https://github.com/julien-moreau))

## Bug fixes
- Fixed TransformNode.setDirection (orientation was wrong) ([Deltakosh](https://github.com/deltakosh))
- Fixed ArcRotateCamera control when upVector was modified ([Deltakosh](https://github.com/deltakosh))
- Fixed anaglyph mode for Free and Universal cameras ([Deltakosh](https://github.com/deltakosh))
- Fixed FileLoader's loading of a skybox, & added a parsed value for whether to create with PBR or STDMaterial ([Palmer-JC](https://github.com/Palmer-JC))
- Removed bones from rootNodes where they should never have been ([Deltakosh](https://github.com/deltakosh))
- Refocusing on input gui with pointer events ([TrevorDev](https://github.com/TrevorDev))
- Gizmo scaling not consistent when camera is parented ([TrevorDev](https://github.com/TrevorDev))
- Context loss causing unexpected results with dynamic textures, geometries with the same name and reflectionTextures ([TrevorDev](https://github.com/TrevorDev))
- CreateScreenshotUsingRenderTarget stretches mirror textures when setting both width and height ([TrevorDev](https://github.com/TrevorDev))
- VR helper only updating vr cameras position when entering vr, rotation was missing ([TrevorDev](https://github.com/TrevorDev))
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

### Viewer

### Loaders

## Breaking changes

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

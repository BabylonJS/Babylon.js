# 4.1.0

## Major updates

- Node Material and Node material editor [Doc](https://doc.babylonjs.com/how_to/node_material) ([Deltakosh](https://github.com/deltakosh/) / [TrevorDev](https://github.com/TrevorDev))
- WebGPU preliminary support [Doc](https://doc.babylonjs.com/extensions/webgpu) ([Sebavan](https://github.com/sebavan/))
- Added the "Cascaded Shadow Mapping" (CSM) shadow rendering technique ([Popov72](https://github.com/Popov72) (initiated by [lockphase](https://github.com/lockphase/)))
- .basis texture file format support [Doc](https://doc.babylonjs.com/resources/multi-platform_compressed_textures#basis-file-format) ([TrevorDev](https://github.com/TrevorDev))
- Navigation mesh and crowd of moving agents [Doc](https://doc.babylonjs.com/extensions/navigationmesh) ([CedricGuillemet](https://github.com/CedricGuillemet))
- Added Points Cloud Particle System [Doc](https://doc.babylonjs.com/how_to/point_cloud_particles) ([JohnK](https://github.com/BabylonJSGuide/))
- Classes decoupling ending up with smaller bundle sizes [Blog](https://medium.com/@babylonjs/size-matters-e0e94dad01a7) ([Deltakosh](https://github.com/deltakosh/))
- Babylon.js controls [Doc](https://doc.babylonjs.com/features/controls) ([Sebavan](https://github.com/sebavan/) / [Deltakosh](https://github.com/deltakosh/))
- Massive WebXR updates (See below) ([RaananW](https://github.com/RaananW/) / [TrevorDev](https://github.com/TrevorDev))
- Added support for Offscreen canvas [Doc](https://doc.babylonjs.com/how_to/using_offscreen_canvas) ([Deltakosh](https://github.com/deltakosh/))
- Added support for multiple canvases with one engine [Doc](https://doc.babylonjs.com/how_to/multi_canvases) ([Deltakosh](https://github.com/deltakosh/))
- Added useReverseDepthBuffer to Engine which can provide greater z depth for distant objects without the cost of a logarithmic depth buffer ([BenAdams](https://github.com/benaadams/))
- Screen space reflections post-process [Doc](https://doc.babylonjs.com/how_to/using_screenspacereflectionspostprocess) ([julien-moreau](https://github.com/julien-moreau))

## Updates

### General

- Add two new clip planes (5 and 6) to get a clip cube ([MickPastor](https://github.com/mickPASTOR))
- Added support for dual shock gamepads ([Deltakosh](https://github.com/deltakosh/))
- Support Vive Focus 3Dof controller ([TrevorDev](https://github.com/TrevorDev))
- Planar positioning support for GizmoManager ([Balupg](https://github.com/balupg))
- ScaleGizmo and AxisScaleGizmo sensitivity factor ([CedricGuillemet](https://github.com/CedricGuillemet))
- Individual gizmos can now be enabled/disabled ([Balupg](https://github.com/balupg))
- Unify preparation of instance attributes. Added `MaterialHelper.PushAttributesForInstances` ([MarkusBillharz](https://github.com/MarkusBillharz))
- Added support for PBR [irradiance map](https://doc.babylonjs.com/how_to/physically_based_rendering_master#irradiance-map)
- Added ability to set render camera on utility layer instead of using the latest active camera ([TrevorDev](https://github.com/TrevorDev))
- Move normalizeToUnitCube to transformNode instead of abstract mesh and add predicate to exclude sub objects when scaling ([TrevorDev](https://github.com/TrevorDev))
- Method to check if device orientation is available ([TrevorDev](https://github.com/TrevorDev))
- Added support for sound sprites [Doc](https://doc.babylonjs.com/how_to/playing_sounds_and_music#playing-a-sound-sprite) ([Deltakosh](https://github.com/deltakosh/))
- Display Oculus Quest controller when using a Quest in WebVR ([TrevorDev](https://github.com/TrevorDev))
- Added startAndReleaseDragOnPointerEvents property to pointerDragBehavior which can be set to false for custom drag triggering ([TrevorDev](https://github.com/TrevorDev))
- Added optional picking predicate to pointerDragBehavior for filtering affected meshes ([Exolun](https://github.com/Exolun))
- Added accessor functions for `PointerDragBehavior._options` ([Popov72](https://github.com/Popov72))
- Effect renderer to render one or multiple shader effects to a texture ([TrevorDev](https://github.com/TrevorDev))
- Added url parameters to web request modifiers ([PierreLeBlond](https://github.com/PierreLeBlond))
- Added `VRExperienceHelper.exitVROnDoubleTap` ([Deltakosh](https://github.com/deltakosh/))
- Added `Scene.getTextureByUniqueID` ([aWeirdo](https://github.com/aWeirdo/))
- Added support for 180 VR videos in `VideoDome` ([RaananW](https://github.com/RaananW/))
- Added optional parameter to use Euler angles in planeRotationGizmo ([CedricGuillemet](https://github.com/CedricGuillemet))
- Added `AnimationGroup.onAnimationGroupLoopObservable` ([Deltakosh](https://github.com/deltakosh/))
- Supports custom materials to generate glow through `referenceMeshToUseItsOwnMaterial` in the `GlowLayer` ([sebavan](http://www.github.com/sebavan))
- Added `RawTexture2DArray` to enable use of WebGL2 2D array textures by custom shaders ([atg](https://github.com/atg))
- Added multiview support for the shader material (and the line-mesh class) ([RaananW](https://github.com/RaananW/))
- Added various (interpolation) functions to Path3D, also `alignTangentsWithPath`, `slice`, `getClosestPositionTo` ([Poolminer](https://github.com/Poolminer/))
- Allow setting of `BABYLON.Basis.JSModuleURL` and `BABYLON.Basis.WasmModuleURL`, for hosting the Basis transcoder locally ([JasonAyre](https://github.com/jasonyre))
- PNG support for browsers not supporting SVG ([RaananW](https://github.com/RaananW/))
- Device orientation event permissions for iOS 13+ ([RaananW](https://github.com/RaananW/))
- Added `DirectionalLight.autoCalcShadowZBounds` to automatically compute the `shadowMinZ` and `shadowMaxZ` values ([Popov72](https://github.com/Popov72))
- Added `CascadedShadowGenerator.autoCalcDepthBounds` to improve the shadow quality rendering ([Popov72](https://github.com/Popov72))
- Improved cascade blending in CSM shadow technique ([Popov72](https://github.com/Popov72))
- Speed optimization when cascade blending is not used in CSM shadow technique ([Popov72](https://github.com/Popov72))
- Added `RenderTargetTexture.getCustomRenderList` to overload the render list at rendering time (and possibly for each layer (2DArray) / face (Cube)) ([Popov72](https://github.com/Popov72))
- Make sure all properties of CascadedShadowMap class are serialized/parsed ([Popov72](https://github.com/Popov72))
- Added `textures/opacity.png` file to the Playground ([Popov72](https://github.com/Popov72))
- Refactored the shadow generators code ([Popov72](https://github.com/Popov72))
- Supports clip planes with shadows ([sebavan](http://www.github.com/sebavan))
- Added Workbench color scheme for VSCode ([drigax](https://github.com/drigax) & [Patrick Ryan](https://github.com/PatrickRyanMS))
- Playground switch buttons are more intuitive ([#7601](https://github.com/BabylonJS/Babylon.js/issues/7601)) ([RaananW](https://github.com/RaananW/))

### Engine

- Improved instanceMesh with user defined custom buffers [Doc](https://doc.babylonjs.com/how_to/how_to_use_instances#custom-buffers) ([Deltakosh](https://github.com/deltakosh/))
- Morph targets now can morph UV channel as well ([Deltakosh](https://github.com/deltakosh/))
- Added MorphTarget support to the DepthRenderer, GeometryBufferRenderer and OutlineRenderer ([MarkusBillharz](https://github.com/MarkusBillharz))
- Added preprocessors for shaders to improve how shaders are compiled for WebGL1/2 or WebGPU ([Deltakosh](https://github.com/deltakosh/))
- Added enterPointerlock and exitPointerlock (Separated from enterFullscreen) ([aWeirdo](https://github.com/aWeirdo/))
- Added support for `vertexSource` and `fragmentSource` parameters to `ShaderMaterial` ([Deltakosh](https://github.com/deltakosh/))

### Inspector

- Added support for Euler edition only for angles (can be turned off in the new inspector settings) ([Deltakosh](https://github.com/deltakosh/))
- Added an option to ignore backfaces for picking (can be turned on and off in the new inspector settings) ([Deltakosh](https://github.com/deltakosh/))
- Added support for `ShadowGenerator` ([Deltakosh](https://github.com/deltakosh/))
- Added support for scene normalization ([Deltakosh](https://github.com/deltakosh/))
- Added support for morph targets ([Deltakosh](https://github.com/deltakosh/))
- Added context menu to add `SSAORenderingPipeline` and `SSAO2RenderingPipeline` ([Deltakosh](https://github.com/deltakosh/))
- Added support for texture creation and assignments per material ([Deltakosh](https://github.com/deltakosh/))
- Added support for occlusion properties ([Deltakosh](https://github.com/deltakosh/))
- Texture channels are now displayed in grayscale ([Deltakosh](https://github.com/deltakosh/))
- Ambiant and metallic maps are displayed correctly on PBR material even when using ORM packed texture ([Deltakosh](https://github.com/deltakosh/))
- Added support for inspectable strings ([Deltakosh](https://github.com/deltakosh/))
- Added support for CreateScreenshotUsingRenderTarget ([13djwright](https://github.com/13djwright/))
- Added support for `Material.depthFunction` property ([Popov72](https://github.com/Popov72))
- Added an optional config option `initialTab` ([ycw](https://github.com/ycw/))
- Added support for ImportAnimations ([noalak](https://github.com/noalak/))
- Added support for Cascaded Shadow Maps ([Popov72](https://github.com/Popov72))
- Added context menu to add `NodeMaterial` ([Deltakosh](https://github.com/deltakosh/))
- Added option to switch material per mesh ([Deltakosh](https://github.com/deltakosh/))

### Tools

- Added `Tools.CreateScreenshotAsync` and `Tools.CreateScreenshotUsingRenderTargetAsync` ([mehmetoguzderin](https://github.com/mehmetoguzderin/))
- Added `Color3.toHSV()`, `Color3.toHSVToRef()` and `Color3.HSVtoRGBToRef()` ([Deltakosh](https://github.com/deltakosh/))
- Added `ShadowGenerator.onAfterShadowMapRenderObservable` and `ShadowGenerator.onAfterShadowMapMeshRenderObservable` ([Deltakosh](https://github.com/deltakosh/))
- Added support for side by side and top bottom images in the `PhotoDome` ([Deltakosh](https://github.com/deltakosh/))
- Added playground ts-local (TypeScript support for local playground) ([pjoe](https://github.com/pjoe/))
- Added RGBD Texture tools [Sebavan](https://github.com/sebavan/)
- Bumped Monaco Editor to 0.18.1 and improved TypeScript compilation pipeline in the playground ([sailro](http://www.github.com/sailro))
- Added support for clickable errors in the playground ([sailro](http://www.github.com/sailro))
- Added a color picker and previewer for BABYLON.ColorX invocations in the playground ([sailro](http://www.github.com/sailro))
- Added support for diffing snippets in the playground ([sailro](http://www.github.com/sailro))
- Added diff navigator in the playground ([sailro](http://www.github.com/sailro))
- Added custom filter to remove internals from the completion in the playground ([sailro](http://www.github.com/sailro))
- Added support for tagging deprecated members (both in editor and for completion) in the playground ([sailro](http://www.github.com/sailro))
- Added preview area pop up for NME ([Kyle Belfort](https://github.com/belfortk))
- Added comments to frames in NME ([Kyle Belfort](https://github.com/belfortk))
- Make frames resizable in NME ([Kyle Belfort](https://github.com/belfortk))
- Implement NME Preview Area Redesign ([Kyle Belfort](https://github.com/belfortk))

### Meshes

- Added `TransformNode.instantiateHierarchy()` which try to instantiate (or clone) a node and its entire hiearchy ([Deltakosh](https://github.com/deltakosh/))
- Added new CreateTiledPlane and CreateTiledBox ([JohnK](https://github.com/BabylonJSGuide/))
- Added absolute scaling and rotation getters ([haroldma](https://github.com/haroldma))
- Added `BILLBOARDMODE_USE_POSITION` flag to billboards allowing use of camera positioning instead of orientation for mesh rotation ([delaneyj](https://github.com/delaneyj))
- Added accessor functions for `SubMesh._materialDefines` ([Popov72](https://github.com/Popov72))
- Generator type used in `TrailMesh` constructor is now `TransformNode` instead of `AbstrachMesh` ([Popov72](https://github.com/Popov72))
- Added the `useVertexAlpha` options to `MeshBuilder.CreateDashedLines` ([Popov72](https://github.com/Popov72))
- Fixed a bug in `DracoCompression` when loading color attributes with VEC3. ([bghgary](https://github.com/bghgary))

### Physics

- Update Ammo.js library to support global collision contact callbacks ([MackeyK24](https://github.com/MackeyK24/))
- Update Ammo.js library to allow native capsule shape impostors ([MackeyK24](https://github.com/MackeyK24/))
- Update Ammo.js library to allow your own broadphase overlapping pair cache ([MackeyK24](https://github.com/MackeyK24/))
- Update Ammo.js library for custom impostor shapes. PhysicsImpostor.CustomImposter type and AmmoJSPlugin.OnCreateCustomShape factoty function ([MackeyK24](https://github.com/MackeyK24/))
- Update Ammo.js library and AmmoJS plugin to support ellipsoid ([CedricGuillemet](https://github.com/CedricGuillemet/))
- Physics update substeps ([CedricGuillemet](https://github.com/CedricGuillemet))

### Loaders

- Added support for non-float accessors in animation data for glTF loader. ([bghgary](https://github.com/bghgary))
- Support loading cube data in the .basis loader ([TrevorDev](https://github.com/TrevorDev))
- Load glTF extras into BJS metadata ([pjoe](https://github.com/pjoe))
- Added support for morph target names via `mesh.extras.targetNames` when loading a glTF ([zeux](https://github.com/zeux))
- Added support for using HTTP range requests when loading `MSFT_lod` extension from a glTF binary. ([bghgary](https://github.com/bghgary))
- Added a flag to enable/disable creation of instances for glTF loader. ([bghgary](https://github.com/bghgary))
- Added an order property to glTF loader extensions to support reordering. ([bghgary](https://github.com/bghgary))
- Added support for GLTF clearcoat extension [Sebavan](https://github.com/sebavan/)
- Added support for GLTF specular extension [Sebavan](https://github.com/sebavan/)
- Added support for GLTF sheen extension [Sebavan](https://github.com/sebavan/)
- Added support for GLTF mesh quantization extension ([zeux](https://github.com/zeux))
- Added support for 8 bone influences to glTF loader ([zeux](https://github.com/zeux))
- Added support for animations import from separate files ([noalak](https://github.com/noalak/))
- Use web workers to validate glTF to avoid blocking the main thread. ([bghgary](https://github.com/bghgary))
- Update glTF validator to 2.0.0-dev.3.1. ([bghgary](https://github.com/bghgary))
- Fix an issue with disposing materials and textures too aggressively in MSFT_lod loader extension. ([bghgary](https://github.com/bghgary))
- Added experimental support for loading KTX2 files and `KHR_texture_basisu` glTF extension. ([bghgary](https://github.com/bghgary))

### Materials

- Added `ShaderMaterial.setColor4Array` ([JonathanTron](https://github.com/JonathanTron/))
- Added `ShaderMaterial.setArray4` ([JonathanTron](https://github.com/JonathanTron/))
- Added get/set accessors for `ShaderMaterial._shaderPath` ([Popov72](https://github.com/Popov72))
- Added `scene.environmentIntensity` to control the IBL strength overall in a scene ([Sebavan](https://github.com/sebavan/))
- Added support of image processing for `WaterMaterial` ([julien-moreau](https://github.com/julien-moreau))
- Added `pbrBRDFConfiguration.useSpecularGlossinessInputEnergyConservation` to allow Specular-Workflow energy conservation to be turned off ([ColorDigital-PS](https://github.com/ColorDigital-PS)).
- Added support for the `freeze` / `unfreeze` functions in `ShaderMaterial` ([Popov72](https://github.com/Popov72))
- Added `depthFunction` new property to `Material` base class ([Popov72](https://github.com/Popov72))
- Added `setCompressedTextureExclusions` method to `Engine` to allow for skipping compressed textures on certain files ([abogartz](https://github.com/abogartz))

### ScreenshotTools

- Added interface for argument `size` of screenshot methods ([Dok11](https://github.com/Dok11/))
- Implementation usage of precision in combination height and width params ([Dok11](https://github.com/Dok11/))
- Added a parameter to `CreateScreenshotUsingRenderTarget` to render sprites ([Popov72](https://github.com/Popov72))

### Sounds

- Added `ISoundOptions.skipCodecCheck` to make `Sound` more flexible with URLs ([nbduke](https://github.com/nbduke))
- Added `Scene.audioListenerPositionProvider` property, to enable setting custom position of audio listener ([Foxhoundn](https://github.com/foxhoundn))

### Sprites

- SpritePackedManager extends SpriteManager so that a sprite sheet with different size sprites can be used ([JohnK](https://github.com/BabylonJSGuide))
- MultiPickSprite and multiPickSpriteWithRay added to sprites ([JohnK](https://github.com/BabylonJSGuide))
- SpritePackedManager support for JSON Objects that where not stringified, of with the frames parameter accepting Objects and Arrays ([Pryme8](https://github.com/Pryme8))
- Added `SpriteMap` for creation of grid-based dynamically animated sprite atlas rendering (Beta) ([Pryme8](https://github.com/Pryme8))
- Add `SpriteManager.disableDepthWrite` property ([Popov72](https://github.com/Popov72))

### WebXR / WebVR

- WebXR webVR parity helpers (Vive, WMR, Oculus Rift) ([TrevorDev](https://github.com/TrevorDev))
- Compliance with the mozilla WebXR emulator for chrome and firefox ([RaananW](https://github.com/RaananW/))
- Use the same icon as in VR ([RaananW](https://github.com/RaananW/))
- Gamepad object is now exposed in the WebXRController class ([RaananW](https://github.com/RaananW/))
- If canvas does not have WebXR support the scene will still render (mainly Firefox) ([RaananW](https://github.com/RaananW/))
- Added support for foveated rendering in Oculus Quest ([Deltakosh](https://github.com/deltakosh/))
- Added option to configure the output canvas ([RaananW](https://github.com/RaananW/))
- Supporting multisampled multiview rendering using the oculus multiview extension ([RaananW](https://github.com/RaananW/))
- Preparing to deprecate supportsSession in favor of isSupportedSession ([RaananW](https://github.com/RaananW/))
- Added onControllerModelLoaded observable for WebXR ([RaananW](https://github.com/RaananW/))
- UI Button has options to set different session mode and reference type ([RaananW](https://github.com/RaananW/))
- Added option to change the teleportation duration in the VRExperienceHelper class ([https://github.com/LeoRodz](https://github.com/LeoRodz))
- Added support to teleport the camera at constant speed in the VRExperienceHelper class ([https://github.com/LeoRodz](https://github.com/LeoRodz))
- VRExperienceHelper has now an XR fallback to force XR usage (beta) ([RaananW](https://github.com/RaananW/))
- Added option to change the teleportation easing function in the VRExperienceHelper class ([https://github.com/LeoRodz](https://github.com/LeoRodz))
- Windows motion controller mapping corrected to XR (xr-standard) ([RaananW](https://github.com/RaananW/))
- Pointer-Event simulation for screen target ray mode ([RaananW](https://github.com/RaananW/))
- New observable that triggers when a session was initialized ([RaananW](https://github.com/RaananW/))
- WebXR teleportation can now be disabled after initialized or before created ([RaananW](https://github.com/RaananW/))
- New Features Manager for WebXR features ([RaananW](https://github.com/RaananW/))
- New features - Plane detection, Hit test, Background remover ([RaananW](https://github.com/RaananW/))
- XR Camera's API is Babylon-conform (position, rotationQuaternion, world matrix, direction etc') ([#7239](https://github.com/BabylonJS/Babylon.js/issues/7239)) ([RaananW](https://github.com/RaananW/))
- XR Input now using standard profiles and completely separated from the gamepad class ([#7348](https://github.com/BabylonJS/Babylon.js/issues/7348)) ([RaananW](https://github.com/RaananW/))
- Teleportation and controller selection are now WebXR features. ([#7290](https://github.com/BabylonJS/Babylon.js/issues/7290)) ([RaananW](https://github.com/RaananW/))
- Teleportation allows selecting direction before teleporting when using thumbstick / touchpad. ([#7290](https://github.com/BabylonJS/Babylon.js/issues/7290)) ([RaananW](https://github.com/RaananW/))
- It is now possible to force a certain profile type for the controllers ([#7348](https://github.com/BabylonJS/Babylon.js/issues/7375)) ([RaananW](https://github.com/RaananW/))
- WebXR camera is initialized on the first frame, including copying transformation from native camera (except for in AR) ([#7389](https://github.com/BabylonJS/Babylon.js/issues/7389)) ([RaananW](https://github.com/RaananW/))
- Selection has gaze mode (which can be forced) and touch-screen support ([#7395](https://github.com/BabylonJS/Babylon.js/issues/7395)) ([RaananW](https://github.com/RaananW/))
- Laser pointers can be excluded from lighting influence so that they are always visible in WebXR / WebVR ([#7323](https://github.com/BabylonJS/Babylon.js/issues/7323)) ([RaananW](https://github.com/RaananW/))
- Full support for the online motion controller repository ([#7323](https://github.com/BabylonJS/Babylon.js/issues/7323)) ([RaananW](https://github.com/RaananW/))
- New XR feature - XR Controller physics impostor for motion controllers / XR Input sources ([RaananW](https://github.com/RaananW/))
- Teleportation between different ground levels in WebXR is enabled ([RaananW](https://github.com/RaananW/))
- Utility Meshes for XR (teleportation ring, selection rays) can now be rendered using a utility layer ([#7563](https://github.com/BabylonJS/Babylon.js/issues/7563)) ([RaananW](https://github.com/RaananW/))
- Teleportation supports snap-to (anchor) points ([#7441](https://github.com/BabylonJS/Babylon.js/issues/7441)) ([RaananW](https://github.com/RaananW/))

### Ray

- Added `Ray.intersectsAxis` to translate screen to axis coordinates without checking collisions ([horusscope](https://github.com/horusscope))

### GUI

- Added `xmlLoader` to load GUI layouts from XML ([null0924](https://github.com/null0924))
- Added `disableMobilePrompt` option to InputText for OculusQuest(and other android base VR devices) ([shinyoshiaki](https://github.com/shinyoshiaki))
- Added `Button.delegatePickingToChildren` to let buttons delegate hit testing to embedded controls ([Deltakosh](https://github.com/deltakosh/))
- Added `Container.maxLayoutCycle` and `Container.logLayoutCycleErrors` to get more control over layout cycles ([Deltakosh](https://github.com/deltakosh/))
- Added `StackPanel.ignoreLayoutWarnings` to disable console warnings when controls with percentage size are added to a StackPanel ([Deltakosh](https://github.com/deltakosh/))
- Added `_getSVGAttribs` functionality for loading multiple svg icons from an external svg file via icon id. Fixed bug for Chrome. Strip icon id from image url for firefox. ([lockphase](https://github.com/lockphase/))
- Scroll Viewer extended to include the use of images in the scroll bars([JohnK](https://github.com/BabylonJSGuide/))
- Added `ScrollViewer.freezeControls` property to speed up rendering ([Popov72](https://github.com/Popov72))
- Added `ImageScrollBar.num90RotationInVerticalMode` property to let the user rotate the pictures when in vertical mode ([Popov72](https://github.com/Popov72))
- Modified isPointerBlocker to block mouse wheel scroll events. ScrollViewer mouse scroll no longer dependent on scene. ([lockphase](https://github.com/lockphase/))
- Added `_onCanvasBlur` event for controls to detect when the canvas loses focus. Fixes bug where sliders would become stuck when canvas lost focus. ([DarraghBurkeMS](https://github.com/DarraghBurkeMS))

### Particles

- Added `particleSystem.isLocal` for CPU particles to let the particles live in emitter local space. [Doc](https://doc.babylonjs.com/babylon101/particles#local-space) ([Deltakosh](https://github.com/deltakosh/))
- Added the feature `expandable` to the Solid Particle System ([jerome](https://github.com/jbousquie/))
- Added the feature `removeParticles()` to the Solid Particle System ([jerome](https://github.com/jbousquie/))
- Added the feature "storable particles" and `insertParticlesFromArray()` to the Solid Particle System ([jerome](https://github.com/jbousquie/))
- Added the support for MultiMaterials to the Solid Particle System ([jerome](https://github.com/jbousquie/))
- Added support for `CustomParticleEmitter`. [Doc](https://doc.babylonjs.com/babylon101/particles#custom-emitter) ([Deltakosh](https://github.com/deltakosh/))
- Added support for `MeshParticleEmitter`. [Doc](https://doc.babylonjs.com/babylon101/particles#mesh-emitter) ([Deltakosh](https://github.com/deltakosh/))

### Navigation Mesh

- Added moveAlong function to cast a segment on mavmesh ([CedricGuillemet](https://github.com/CedricGuillemet/))

### Node Material

- Added Light intensity output to LightInformationBlock ([Drigax](https://github.com/drigax))

### Serializers

- Added support for `AnimationGroup` serialization ([Drigax](https://github.com/drigax/))
- Expanded animation group serialization to include all targeted TransformNodes ([Drigax](https://github.com/drigax/))

### Texture Packer

- Added TexturePacker Class ([Pryme8](https://github.com/Pryme8))
- Added TexturePackerLoader Class ([Pryme8](https://github.com/Pryme8))

### Documentation

- Added a note on shallow bounding of getBoundingInfo ([tibotiber](https://github.com/tibotiber))
- Added a typo fix to the ArcRotateCamera setPosition method description ([schm-dt](https://github.com/schm-dt))

## Bug fixes

- Fixed Textblock line spacing evaluation when linespacing > 0 ([Deltakosh](https://github.com/deltakosh/))
- Fixed Xbox One gamepad controller button schemes ([MackeyK24](https://github.com/MackeyK24/))
- Removing `assetContainer` from scene will also remove gui layers ([TrevorDev](https://github.com/TrevorDev))
- A scene's input manager not adding key listeners when the canvas is already focused ([Poolminer](https://github.com/Poolminer))
- Runtime animation `goToFrame` when going back in time now correctly triggers future events when reached ([zakhenry](https://github.com/zakhenry))
- Fixed bug in `Ray.intersectsTriangle` where the barycentric coordinates `bu` and `bv` being returned is actually `bv` and `bw`. ([bghgary](https://github.com/bghgary))
- Do not call `onError` when creating a texture when falling back to another loader ([TrevorDev](https://github.com/TrevorDev))
- Context loss should not cause PBR materials to render black or instances to stop rendering ([TrevorDev](https://github.com/TrevorDev))
- Only cast pointer ray input when pointer is locked in WebVR ([TrevorDev](https://github.com/TrevorDev))
- Fix Right Hand coordinates with directional lights and shadows, hemispheric lights and spot lights ([CedricGuillemet](https://github.com/CedricGuillemet))
- Avoid using default utility layer in gizmo manager to support multiple scenes ([TrevorDev](https://github.com/TrevorDev))
- Fix bug when adding and removing observers in quick succession ([sable](https://github.com/thscott))
- Cannon and Ammo forceUpdate will no longer cause an unexpected exception ([TrevorDev](https://github.com/TrevorDev))
- Loading the same multi-material twice and disposing one should not impact the other ([TrevorDev](https://github.com/TrevorDev))
- GLTF exporter should no longer duplicate exported texture data ([Drigax](https://github.com/Drigax))
- Avoid exception when disposing of Ammo cloth physics ([TrevorDev](https://github.com/TrevorDev))
- Make planeDragGizmo usable on its own ([TrevorDev](https://github.com/TrevorDev))
- Fix useObjectOrienationForDragging for pointerDragBehavior when using a single axis drag ([TrevorDev](https://github.com/TrevorDev))
- Fix VR button not positioning correctly in canvas ([haroldma](https://github.com/haroldma))
- Fix check for material needing alpha blending in OutlineRenderer ([mkmc](https://github.com/mkmc))
- Fixed: scene's input manager's detachControl doesn't remove a wheel event listener ([RamilKadyrov](https://github.com/RamilKadyrov))
- Fixed Solid Particle System particle's idx and idxInShape initialization ([RamilKadyrov](https://github.com/RamilKadyrov))
- Added in ArcRotateCamera.storeState to save targetScreenOffset, in restoreState to restore it ([RamilKadyrov](https://github.com/RamilKadyrov))
- Fixed `CubeTexture` to keep custom `filesList` when serializing/parsing ([julien-moreau](https://github.com/julien-moreau))
- Fixed `StandardRenderingPipeline` to properly dispose post-processes from attached cameras ([julien-moreau](https://github.com/julien-moreau))
- Fixed `VolumetricLightScattering` post-process to use a custom vertex shader instead of the depth vertex shader. ([julien-moreau](https://github.com/julien-moreau))
- Fixed missing check in sceneTreeItemComponent resulting in gizmo to not end drag ([CedricGuillemet](https://github.com/CedricGuillemet))
- Added missing callback triggers within texture loaders ([PierreLeBlond](https://github.com/PierreLeBlond))
- Fixed `TextureLinkLineComponent` to no longer invert inspector-loaded textures ([Drigax](https://github.com/drigax))
- Fixed a single frame drop after leaving webxr on some devices ([RaananW](https://github.com/RaananW/))
- Fixed bug where vignette aspect ratio would be wrong when rendering direct to canvas
- Fixed Path2 length computation ([Poolminer](https://github.com/Poolminer/))
- Cloning of `ShaderMaterial` also clone `shaderPath` and `options` properties ([Popov72](https://github.com/Popov72))
- Prevent an infinite loop when calling `engine.dispose()` in a scene with multiple `SoundTracks` defined ([kirbysayshi](https://github.com/kirbysayshi))
- Fixed missing properties in serialization / parsing of `coneParticleEmitter` ([Popov72](https://github.com/Popov72))
- Fix a bug with exit VR and Edge ([RaananW](https://github.com/RaananW/))
- Fixed an issue with size of texture in multiview ([RaananW](https://github.com/RaananW/))
- Fixed Path3D (bi)normals computation for specific edge cases ([Poolminer](https://github.com/Poolminer/))
- WebXR UI BUtton will only change to "In XR" after XR Session started ([RaananW](https://github.com/RaananW/))
- Fix bug when we call `Mesh.render` twice and the material is still not ready on the second call ([barroij](https://github.com/barroij/))
- Fixed an issue with pose input in webxr ([RaananW](https://github.com/RaananW/))
- Fixed bug when parsing animation group without 'to' value ([noalak](https://github.com/noalak/))
- isRightCamera and isLeftCamera were not set in WebXR ([RaananW](https://github.com/RaananW/))
- Sandbox will now load assets relatively path-ed to same folder ([Kyle Belfort](https://github.com/belfortk))
- Playground will now render the returned scene from createScene() when there are multiple scenes added to engine ([Kyle Belfort](https://github.com/belfortk))
- Fixed bug so Playground will now download .env texture files to ./textures in .zip  ([Kyle Belfort](https://github.com/belfortk))
- It was not possible to change the gaze and laser color in VR ([#7323](https://github.com/BabylonJS/Babylon.js/issues/7323)) ([RaananW](https://github.com/RaananW/))
- Fixed issue where textures exported using Safari web browser are Y mirrored. ([#7352](https://github.com/BabylonJS/Babylon.js/issues/7352)) ([Drigax](https://github.com/drigax))
- Fix a bug when resizing a MRT ([Popov72](https://github.com/Popov72))
- Fixed an infinite clone recursion bug in `InstancedMesh` due to `DeepCopier.DeepCopy` cloning `parent` ([Poolminer](https://github.com/Poolminer/))
- Fixed an issue with multiview textures ([RaananW](https://github.com/RaananW/))
- Screenshot height and width is now forced to be integers to prevent mismatch with openGL context ([jekelija](https://github.com/jekelija))
- Fix shadow bound calculation in CSM shadow technique ([Popov72](https://github.com/Popov72))
- Disposing of the depthReducer used in CSM ([Popov72](https://github.com/Popov72))
- Fixed an issue with teleportation detach and attach ([#7419](https://github.com/BabylonJS/Babylon.js/issues/7419)) ([RaananW](https://github.com/RaananW/))
- Physics compound calculations were incorrect ([#7407](https://github.com/BabylonJS/Babylon.js/issues/7407)) ([RaananW](https://github.com/RaananW/))
- Fix bug NME bug where preview area crashes on pop up when NME is opened from playground ([Kyle Belfort](https://github.com/belfortk))
- Fixed an issue with isSessionSupported return value being ignored ([#7501](https://github.com/BabylonJS/Babylon.js/issues/7501)) ([RaananW](https://github.com/RaananW/))
- Added isRigCamera to rig cameras so they can be detected. Used to fix a bug with utility layer and WebXR ([#7517](https://github.com/BabylonJS/Babylon.js/issues/7517)) ([RaananW](https://github.com/RaananW/))
- Fixed bug in the `ScrollViewer` GUI class when setting a `idealWidth` or `idealHeight` on the ADT ([Popov72](https://github.com/Popov72))
- Fixed bug in the `Image` GUI class where some properties were lost after a rotation by n x 90° ([Popov72](https://github.com/Popov72))
- Fixed bug in the `Image` GUI class when rotating a SVG picture ([Popov72](https://github.com/Popov72))
- Fix for bug where NME would crash if frames did not have comments ([Kyle Belfort](https://github.com/belfortk))
- Fix wrong import of _TimeToken ([Sebavan](https://github.com/sebavan/)
- Fix shadows not rendered correctly when using point lights ([Popov72](https://github.com/Popov72))
- Prevent depth buffer clear in shadow maps ([Sebavan](https://github.com/sebavan/)
- Fix for bug where the light gizmo causes lights to flip orientation ([#7603](https://github.com/BabylonJS/Babylon.js/issues/7603)) ([drigax](https://github.com/drigax))
- Fix for bug where directional lights are inverted when using a right handed scene coordinate system. ([drigax](https://github.com/drigax))
- Fix subSurface parameters not copied in the PBR clone methods ([Popov72](https://github.com/Popov72))
- Fix for bug where round-tripped glTF imported scenes are encapsulated in a second root node ([#6349](https://github.com/BabylonJS/Babylon.js/issues/6349))([drigax](https://github.com/drigax) & [noalak](https://github.com/noalak))
- Fix `HDRCubeTexture` construction, `generateHarmonics` was not properly taken into account ([Popov72](https://github.com/Popov72))
- VideoTexture poster respects invertY ([Sebavan](https://github.com/sebavan/)
- Fix for bug where round-tripped glTF imported scenes have incorrect light orientation, and duplicated parent nodes ([#7377](https://github.com/BabylonJS/Babylon.js/issues/7377))([drigax](https://github.com/drigax))
- Fix bug in PBR sheen where the sheen effect could be a little darker than expected when using direct lighting ([Popov72](https://github.com/Popov72)
- Fix bug in PBR shader when `reflectionTexture.linearSpecularLOD` is `true`  ([Popov72](https://github.com/Popov72))
- Fix for bug where resizing the bottom of a frame at times will not work for any frame in the graph ([#7377](https://github.com/BabylonJS/Babylon.js/issues/7672))([Kyle Belfort](https://github.com/belfortk))
- Fix bug in PBR sheen when used with clear coat and no env texture provided ([Popov72](https://github.com/Popov72))
- Fix for bug where Preview Area pop up does not change background color across windows ([#7377](https://github.com/BabylonJS/Babylon.js/issues/7684))([Kyle Belfort](https://github.com/belfortk))
- Fix for bug where comments would break out of frames and break resizing of frames ([Kyle Belfort](https://github.com/belfortk))
- Fix for bug where frames without comments would display undefined at the bottom right corner ([Kyle Belfort](https://github.com/belfortk))
- Fixed an issue in XR where one of the cameras used for rendering got the wrong framebuffer dimensions ([RaananW](https://github.com/RaananW/))
- Fix bug in `StandardMaterial` and `PBRMaterial` where the mesh visibility value is not applied correctly when the material is frozen ([Popov72](https://github.com/Popov72))

## Breaking changes

- Setting mesh.scaling to a new vector will no longer automatically call forceUpdate (this should be done manually when needed) ([TrevorDev](https://github.com/TrevorDev))
- `Tools.ExtractMinAndMaxIndexed` and `Tools.ExtractMinAndMax` are now ambiant functions (available on `BABYLON.extractMinAndMaxIndexed` and `BABYLON.extractMinAndMax`) ([Deltakosh](https://github.com/deltakosh/))
- `Tools.QueueNewFrame` was removed in favor of `Engine.QueueNewFrame` ([Deltakosh](https://github.com/deltakosh/))
- Removed external data from Engine (`addExternalData`, `getExternalData`, `getOrAddExternalDataWithFactory`, `removeExternalData`) ([Deltakosh](https://github.com/deltakosh/))
- The glTF loader extensions that map to glTF 2.0 extensions will now be disabled if the extension is not present in `extensionsUsed`. ([bghgary](https://github.com/bghgary))
- The STL loader does not create light or camera automatically, please use `scene.createDefaultCameraOrLight();` in your code [Sebavan](https://github.com/sebavan/)
- The glTF2 exporter extension no longer ignores childless empty nodes.([drigax](https://github.com/drigax))
- Default culling strategy changed to CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY ([Deltakosh](https://github.com/deltakosh/))
- `MaterialHelper.BindLight` and `MaterialHelper.BindLights` do not need the usePhysicalLight anymore ([Sebavan](https://github.com/sebavan/))
- `Mesh.bakeTransformIntoVertices` now preserves child world-space transforms([drigax](https://github.com/drigax))
- Removed `setTexturesToUse` and `setCompressedTextureExclusions` from Engine. ([bghgary](https://github.com/bghgary))

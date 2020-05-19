# 4.2.0

## Major updates

- Added particle editor to the Inspector ([Deltakosh](https://github.com/deltakosh))
- Added sprite editor to the Inspector ([Deltakosh](https://github.com/deltakosh))
- Added the `ShadowDepthWrapper` class to support accurate shadow generation for custom as well as node material shaders. [Doc](https://doc.babylonjs.com/babylon101/shadows#custom-shadow-map-shaders) ([Popov72](https://github.com/Popov72))
- Added HDR texture filtering tools to the sandbox ([Sebavan](https://github.com/sebavan/))
- Reflection probes can now be used to give accurate shading with PBR ([CraigFeldpsar](https://github.com/craigfeldspar) and ([Sebavan](https://github.com/sebavan/)))
- Added editing of PBR materials, Post processes and Particle fragment shaders in the node material editor ([Popov72](https://github.com/Popov72))
- Added Curve editor to create and view selected entity's animations in the Inspector ([pixelspace](https://github.com/devpixelspace))
- Added support in `ShadowGenerator` for fast fake soft transparent shadows ([Popov72](https://github.com/Popov72))
- Added support for **thin instances** for faster mesh instances. [Doc](https://doc.babylonjs.com/how_to/how_to_use_thininstances) ([Popov72](https://github.com/Popov72))

## Updates

### General

- Refactored React refs from old string API to React.createRef() API ([belfortk](https://github.com/belfortk))
- Scale on one axis for `BoundingBoxGizmo` ([cedricguillemet](https://github.com/cedricguillemet))
- Simplified code contributions by fully automating the dev setup with gitpod ([nisarhassan12](https://github.com/nisarhassan12))
- Add a `CascadedShadowMap.IsSupported` method and log an error instead of throwing an exception when CSM is not supported ([Popov72](https://github.com/Popov72))
- Added initial code for DeviceInputSystem ([PolygonalSun](https://github.com/PolygonalSun))
- Added support for `material.disableColorWrite` ([Deltakosh](https://github.com/deltakosh))
- The Mesh Asset Task also accepts File as sceneInput ([RaananW](https://github.com/RaananW))
- Added support preserving vert colors for CSG objects ([PirateJC](https://github.com/PirateJC))
- Added support in `ShadowGenerator` for fast fake soft transparent shadows ([Popov72](https://github.com/Popov72))
- Added `boundingBoxRenderer.onBeforeBoxRenderingObservable` and `boundingBoxRenderer.onAfterBoxRenderingObservable` ([Deltakosh](https://github.com/deltakosh))
- Added initial code for user facing DeviceSourceManager ([PolygonalSun](https://github.com/PolygonalSun))

### Engine

- Allow logging of shader code when a compilation error occurs ([Popov72](https://github.com/Popov72))
- Add back support for selecting textures based on engine capabilities ([bghgary](https://github.com/bghgary))
- Fix Draco decoder when running on IE11 ([bghgary](https://github.com/bghgary))
- Change default camera calculations to only include visible and enabled meshes ([bghgary](https://github.com/bghgary))
- Optimized frozen instances ([Deltakosh](https://github.com/deltakosh))

### NME

- Frames are now resizable from the corners ([belfortk](https://github.com/belfortk))
- Can now rename and re-order frame inputs and outputs ([belfortk](https://github.com/belfortk))
- Can now edit Node port names ([belfortk](https://github.com/belfortk))
- Updated which node ports are shown on frames by default so that only node ports connected to outside nodes are by default exposed on the frame ([belfortk](https://github.com/belfortk))
- Added a modulo block ([ageneau](https://github.com/ageneau))
- Fix bug where frame port labels would be the names of incorrect nodes ([belfortk](https://github.com/belfortk))
- Fix bug where long comments on collapsed frames broke port alignment ([belfortk](https://github.com/belfortk))

### Inspector

- Handle PBR colors as colors in linear space ([Popov72](https://github.com/Popov72))
- Allow removing textures ([Popov72](https://github.com/Popov72))
- Edit all textures (anisotropic, clear coat, sheen, ...) for the PBR materials ([Popov72](https://github.com/Popov72))
- Added right click options to create PBR and Standard Materials ([Deltakosh](https://github.com/deltakosh))
- Added support for recording GIF ([Deltakosh](https://github.com/deltakosh))
- Popup Window available (To be used in Curve Editor) ([pixelspace](https://github.com/devpixelspace))
- Add support to update inspector when switching to new scene ([belfortk](https://github.com/belfortk))

### Cameras

- Fixed up vector not correctly handled with stereoscopic rig ([cedricguillemet](https://github.com/cedricguillemet))
- Added flag to TargetCamera to invert rotation direction and multiplier to adjust speed ([Exolun](https://github.com/Exolun))
- Added upwards and downwards keyboard input to `FreeCamera` ([Pheater](https://github.com/pheater))

### Sprites

- Added support for 'sprite.useAlphaForPicking` to enable precise picking using sprite alpha ([Deltakosh](https://github.com/deltakosh))

### Physics

- Fixed time steps or delta time with sub time step for Oimo.js and Cannon.js ([cedricguillemet](https://github.com/cedricguillemet))
- Ammo.js collision group and mask supported by impostor parameters ([cedricguillemet](https://github.com/cedricguillemet))
- Ammo.js IDL exposed property update and raycast vehicle stablization support ([MackeyK24](https://github.com/MackeyK24))
- Recast.js plugin nav mesh and crowd agent to ref performance optimizations. ([MackeyK24](https://github.com/MackeyK24))
- Added `scene.physicsEnabled` boolean ([Deltakosh](https://github.com/deltakosh))

### Loaders

- Added support for glTF mesh instancing extension ([#7521](https://github.com/BabylonJS/Babylon.js/issues/7521)) ([drigax](https://github.com/Drigax))
- Get the list of cameras retrieved from a gLTF file when loaded through the asset container ([Popov72](https://github.com/Popov72))
- Fixed SceneLoader.ImportAnimations. Now targets nodes based on "targetProperty" ([#7931](https://github.com/BabylonJS/Babylon.js/issues/7931)) ([phenry20](https://github.com/phenry20))
- Renamed KHR_mesh_instancing extension to EXT_mesh_gpu_instancing ([#7945](https://github.com/BabylonJS/Babylon.js/issues/7945)) ([drigax](https://github.com/Drigax))
- Added support for KHR_materials_ior for glTF loader. ([Sebavan](https://github.com/sebavan/))
- Added support for KHR_materials_specular for glTF loader. ([Sebavan](https://github.com/sebavan/))
- Added support for KHR_xmp for glTF loader. ([Sebavan](https://github.com/sebavan/))

### Navigation

- export/load prebuilt binary navigation mesh ([cedricguillemet](https://github.com/cedricguillemet))

### Materials

- Added the `roughness` and `albedoScaling` parameters to PBR sheen ([Popov72](https://github.com/Popov72))
- Updated the energy conservation factor for the clear coat layer in PBR materials ([Popov72](https://github.com/Popov72))
- Added the `transparencyMode` property to the `StandardMaterial` class ([Popov72](https://github.com/Popov72))
- Added to `FresnelParameters` constructor options and equals method ([brianzinn](https://github.com/brianzinn))
- Added `AddAttribute` to `CustomMaterial` and `PBRCustomMaterial` ([Popov72](https://github.com/Popov72))
- `setTexture` and `setTextureArray` from `ShaderMaterial` take now a `BaseTexture` as input instead of a `Texture`, allowing to pass a `CubeTexture` ([Popov72](https://github.com/Popov72))
- Allow parenthesis usage in `#if` expressions in shader code ([Popov72](https://github.com/Popov72))
- Added to `StandardMaterial` RGBD ReflectionTexture, RefractionTexture and LightmapTexture support. ([MackeyK24](https://github.com/MackeyK24))
- Allow using the single comment syntax `// comment` in a `#if` construct in shader code ([Popov72](https://github.com/Popov72))
- Added the possibility to update the shader code before being compiled ([Popov72](https://github.com/Popov72))

### WebXR

- Added optional ray and mesh selection predicates to `WebXRControllerPointerSelection` ([Exolun](https://github.com/Exolun))
- Implemented the new WebXR HitTest API ([#7364](https://github.com/BabylonJS/Babylon.js/issues/7364)) ([RaananW](https://github.com/RaananW))
- Playground doesn't update FPS when in XR in main and frame ([#7875](https://github.com/BabylonJS/Babylon.js/issues/7875)) ([RaananW](https://github.com/RaananW))
- Added support for teleportation using pointer events ([RaananW](https://github.com/RaananW))
- AR reference space type recommendation changed to 'unbounded' ([#7959](https://github.com/BabylonJS/Babylon.js/issues/7959)) ([RaananW](https://github.com/RaananW))
- Teleportation plugin doesn't use the touched to finish teleportation ([#7916](https://github.com/BabylonJS/Babylon.js/issues/7916)) ([RaananW](https://github.com/RaananW))
- Support for pointer selection and teleportation in right handed systems ([#7967](https://github.com/BabylonJS/Babylon.js/issues/7967)) ([RaananW](https://github.com/RaananW))
- Pointer Selection feature now uses `selectstart` and `selectend` events when gamepad and motion controller are not present ([#7989](https://github.com/BabylonJS/Babylon.js/issues/7989)) ([RaananW](https://github.com/RaananW))
- Removed forced `autoClear` = false settings ([RaananW](https://github.com/RaananW))
- Added a warning that WebXR can only be served over HTTPS ([RaananW](https://github.com/RaananW))
- Default (XR-global) rendering group ID can be defined when initializing a default experience ([RaananW](https://github.com/RaananW))
- Added support for (experimental) haptic actuators ([#8068](https://github.com/BabylonJS/Babylon.js/issues/8068)) ([RaananW](https://github.com/RaananW))
- It is now possible to enable experimental (AR) features using the options of the default xr helper ([RaananW](https://github.com/RaananW))
- Full support for right handed systems ([#8132](https://github.com/BabylonJS/Babylon.js/issues/8132)) ([RaananW](https://github.com/RaananW))
- WebXR anchors feature ([#7917](https://github.com/BabylonJS/Babylon.js/issues/7917)) ([RaananW](https://github.com/RaananW))

### Collisions

- Added an option to optimize collision detection performance ([jsdream](https://github.com/jsdream)) - [PR](https://github.com/BabylonJS/Babylon.js/pull/7810)

### Animation

- Added support for Additive Animation Blending. Existing animations can be converted to additive using the new MakeAnimationAdditive method for Skeletons, AnimationGroups and Animations. Animations can be played additively using the new isAdditive input parameter to the begin animation methods. ([c-morten](https://github.com/c-morten))

### Maths

- Added `Vector3.projectOnPlaneToRef` ([Deltakosh](https://github.com/deltakosh))

### Particles

- Added local space support for GPU particles ([CraigFeldpsar](https://github.com/craigfeldspar))
- Added ability to update also colors and uvs of solid particle vertices ([jerome](https://github.com/jbousquie))

### Textures

- .HDR environment files will now give accurate PBR reflections ([CraigFeldpsar](https://github.com/craigfeldspar))


### Audio

- Added support of `metadata` in `Sound` class. ([julien-moreau](https://github.com/julien-moreau))

### Build

- Fixed an issue with gulp webpack, webpack stream and the viewer ([RaananW](https://github.com/RaananW))

### Playground

- Added support for code templates in the playground ([sailro](http://www.github.com/sailro))
- If createEngine fails, a default engine will be created ([#8084](https://github.com/BabylonJS/Babylon.js/issues/8084)) ([RaananW](https://github.com/RaananW))

## Bugs

- Fix infinite loop in `GlowLayer.unReferenceMeshFromUsingItsOwnMaterial` ([Popov72](https://github.com/Popov72))
- Fix picking issue in the Solid Particle System when MultiMaterial is enabled ([jerome](https://github.com/jbousquie))
- Fix picking issue in the Solid Particle System when expandable ([jerome](https://github.com/jbousquie))
- `QuadraticErrorSimplification` was not exported ([RaananW](https://github.com/Raananw))
- Fix NME Frames bug where collapsing and moving a frame removed the nodes inside ([belfortk](https://github.com/belfortk))
- Fix moving / disappearing controls when freezing/unfreezing the ScrollViewer ([Popov72](https://github.com/Popov72))
- Fix: when using instances, master mesh (if displayed) does not have correct instance buffer values ([Popov72](https://github.com/Popov72))
- Exit XR will only trigger only if state is IN_XR ([RaananW](https://github.com/RaananW))
- Fix improper baking of transformed textures in `KHR_texture_transform` serializer. ([drigax](https://github.com/Drigax))
- Fixed NME codegen: missing common properties for float-value input block. ([ycw](https://github.com/ycw))
- Fixed missing options for MeshBuilder.CreateBox. ([ycw](https://github.com/ycw))
- Fix bug in `Plane.transform` when matrix passed in is not a pure rotation ([Popov72](https://github.com/Popov72))
- Fix bug in PBR when anisotropy is enabled and no bump texture is provided ([Popov72](https://github.com/Popov72))
- Fix horizon occlusion in PBR materials ([Popov72](https://github.com/Popov72))
- Fix wrong relative position in applyImpulse/applyForce for ammojs plugin ([cedricguillemet](https://github.com/cedricguillemet))
- Fixed delay calculation in Animatable.goToFrame when speedRatio != 1 ([Reimund Järnfors](https://github.com/reimund))
- Fix bug in PBR when translucency is enabled and an irradiance texture is provided ([Popov72](https://github.com/Popov72))
- Fix bug in PBR with translucency when irradiance texture is 2D ([Popov72](https://github.com/Popov72))
- Fix parenting and enabled state of cloned lights ([cedricguillemet](https://github.com/cedricguillemet))
- Fix bug in PBR when specific combinations of parameters are used ([Popov72](https://github.com/Popov72))
- Fix texture being inverted on the Y axis by default when using TextureAsset or AssetManager ([broederj](https://github.com/broederj))
- Fix `TexturePacker` cross-origin image requests, fix falsy default options ([ludevik](https://github.com/ludevik))
- Fix freeze (infinite loop) when disposing a scene that loaded some specific gLTF files ([Popov72](https://github.com/Popov72))
- Fix submesh recreation when it should not ([Popov72](https://github.com/Popov72))
- Fix `CustomMaterial` and `PBRCustomMaterial` not setting uniforms / samplers / attributes ([Popov72](https://github.com/Popov72))
- Fix bug in NME where deleting a node from a frame would not remove its ports on the outside of a frame
- Fix mesh winding order inversion when merging meshes with overridden side orientation ([drigax](https://github.com/Drigax))
- Fixed a rendering issue with GearVR in WebXR mode ([RaananW](https://github.com/RaananW))
- Fixed error when downloading async createScene function in playground ([#7926](https://github.com/BabylonJS/Babylon.js/issues/7926)) ([RaananW](https://github.com/RaananW))
- Fix issue where ThinEngine.prototype.createDynamicEngine is undefined when using VideoTexture with es6 packages ([rvadhavk](https://github.com/rvadhavk))
- Fix [issue](https://forum.babylonjs.com/t/virtualjoystick-needs-to-set-style-touch-action-none-explicitly/9562) that canvas for `VirtualJoystick` does not have `touch-action: "none"` set by default ([joergplewe](https://github.com/joergplewe))
- Fix [issue](https://github.com/BabylonJS/Babylon.js/issues/7943) that prevented user from re-loading custom meshes ([belfortk](https://github.com/belfortk))
- Fix bug in NME where collapsed frames didn't redraw output links to outside nodes ([belfortk](https://github.com/belfortk))
- Fix bug in NME where links were not redrawn after moving frame port ([belfortk](https://github.com/belfortk))
- Fix bugs in NME that were causing inconsistent behavior displaying Move Node Up and Down buttons on frame ports ([belfortk](https://github.com/belfortk))
- Fix bug in `ShaderMaterial` when using morph targets ([Popov72](https://github.com/Popov72))
- Fix bug in playground where child NME windows would not close before page unload events ([belfortk](https://github.com/belfortk))
- Fixed an issue with stereoscopic rendering ([#8000](https://github.com/BabylonJS/Babylon.js/issues/8000)) ([RaananW](https://github.com/RaananW))
- Fix bug with multiple scenes when resizing the screen and there's a glow or highlight layer active ([Popov72](https://github.com/Popov72))
- Fix an error when compiling with the closure compiler ([ageneau](https://github.com/ageneau/))
- Fix an error in applying texture to sides of `extrudePolygon` using faceUV[1] ([JohnK](https://github.com/BabylonJSGuide/))
- Playground didn't work if query params were added to the URL ([RaananW](https://github.com/RaananW))
- Fixed Path3D `_distances` / length computation ([Poolminer](https://github.com/Poolminer))
- Make sure bone matrices are up to date when calling `TransformNode.attachToBone` ([Popov72](https://github.com/Popov72))
- Fix display problem with transparent objects and SSAO2 pipeline (bug in the `GeometryBufferRenderer`) ([Popov72](https://github.com/Popov72))
- Fixed `Sound` not accepting a `TransformNode` as a source for spatial sound ([Poolminer](https://github.com/Poolminer))
- Fixed an issue with transformation set after physics body was created using cannon.js ([#7928](https://github.com/BabylonJS/Babylon.js/issues/7928)) ([RaananW](https://github.com/RaananW))
- Fix bug when using `ShadowOnlyMaterial` with Cascaded Shadow Map and `autoCalcDepthBounds` is `true` ([Popov72](https://github.com/Popov72))
- Fix bug when using shadows + instances + transparent meshes + `transparencyShadow = false` ([Popov72](https://github.com/Popov72))

## Breaking changes

- `EffectRenderer.render` now takes a `RenderTargetTexture` or an `InternalTexture` as the output texture and only a single `EffectWrapper` for its first argument ([Popov72](https://github.com/Popov72))
- Sound's `updateOptions` takes `options.length` and `options.offset` as seconds and not milliseconds ([RaananW](https://github.com/RaananW))
- HDRCubeTexture default rotation is now similar to the industry one. You might need to add a rotation on y of 90 degrees if you scene changes ([Sebavan](https://github.com/sebavan/))
- PBRMaterial index of refraction is now defined as index of refraction and not the inverse of it ([Sebavan](https://github.com/sebavan/))

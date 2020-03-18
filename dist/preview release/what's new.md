# 4.2.0

## Major updates
- Added particle editor to the Inspector ([Deltakosh](https://github.com/deltakosh)

## Updates

### General

- Refactored React refs from old string API to React.createRef() API ([Kyle Belfort](https://github.com/belfortk)

- Scale on one axis for `BoundingBoxGizmo` ([cedricguillemet](https://github.com/cedricguillemet))

- Simplified code contributions by fully automating the dev setup with gitpod ([nisarhassan12](https://github.com/nisarhassan12))
- Add a `CascadedShadowMap.IsSupported` method and log an error instead of throwing an exception when CSM is not supported ([Popov72](https://github.com/Popov72))

### Engine

- Allow logging of shader code when a compilation error occurs ([Popov72](https://github.com/Popov72))
- Add back support for selecting textures based on engine capabilities ([bghgary](https://github.com/bghgary))

### NME

- NME Frames are now resizable from the corners ([Kyle Belfort](https://github.com/belfortk)

### Inspector

- Handle PBR colors as colors in linear space ([Popov72](https://github.com/Popov72))
- Allow removing textures ([Popov72](https://github.com/Popov72))
- Edit all textures (anisotropic, clear coat, sheen, ...) for the PBR materials ([Popov72](https://github.com/Popov72))

### Cameras

- Added flag to TargetCamera to invert rotation direction and multiplier to adjust speed ([Exolun](https://github.com/Exolun))
- Added upwards and downwards keyboard input to `FreeCamera` ([Pheater](https://github.com/pheater))

### Physics

- Ammo.js IDL exposed property update and raycast vehicle stablization support ([MackeyK24](https://github.com/MackeyK24))
- Recast.js plugin nav mesh and crowd agent to ref performance optimizations. ([MackeyK24](https://github.com/MackeyK24))

### Loaders

- Added support for glTF mesh instancing extension ([#7521](https://github.com/BabylonJS/Babylon.js/issues/7521)) ([drigax](https://github.com/Drigax))

### Navigation
- export/load prebuilt binary navigation mesh ([cedricguillemet](https://github.com/cedricguillemet))

### Materials

- Added the `roughness` and `albedoScaling` parameters to PBR sheen ([Popov72](https://github.com/Popov72))
- Updated the energy conservation factor for the clear coat layer in PBR materials ([Popov72](https://github.com/Popov72))
- Added the `transparencyMode` property to the `StandardMaterial` class ([Popov72](https://github.com/Popov72))
- Added to `FresnelParameters` constructor options and equals method ([brianzinn](https://github.com/brianzinn))
- Added `AddAttribute` to `CustomMaterial` and `PBRCustomMaterial` ([Popov72](https://github.com/Popov72))
- `setTexture` and `setTextureArray` from `ShaderMaterial` take now a `BaseTexture` as input instead of a `Texture`, allowing to pass a `CubeTexture` ([Popov72](https://github.com/Popov72))

### WebXR

- Added optional ray and mesh selection predicates to `WebXRControllerPointerSelection` ([Exolun](https://github.com/Exolun))
- Implemented the new WebXR HitTest API ([#7364](https://github.com/BabylonJS/Babylon.js/issues/7364)) ([RaananW](https://github.com/RaananW))

### Collisions
- Added an option to optimize collision detection performance ([jsdream](https://github.com/jsdream)) - [PR](https://github.com/BabylonJS/Babylon.js/pull/7810)

### Animation
- Added support for Additive Animation Blending. Existing animations can be converted to additive using the new MakeAnimationAdditive method for Skeletons, AnimationGroups and Animations. Animations can be played additively using the new isAdditive input parameter to the begin animation methods. ([c-morten](https://github.com/c-morten))

## Bugs

- Fix infinite loop in `GlowLayer.unReferenceMeshFromUsingItsOwnMaterial` ([Popov72](https://github.com/Popov72)
- Fix picking issue in the Solid Particle System when MultiMaterial is enabled ([jerome](https://github.com/jbousquie))
- `QuadraticErrorSimplification` was not exported ([RaananW](https://github.com/Raananw)
- Fix NME Frames bug where collapsing and moving a frame removed the nodes inside ([Kyle Belfort](https://github.com/belfortk)
- Fix moving / disappearing controls when freezing/unfreezing the ScrollViewer ([Popov72](https://github.com/Popov72)
- Fix: when using instances, master mesh (if displayed) does not have correct instance buffer values ([Popov72](https://github.com/Popov72)
- Exit XR will only trigger only if state is IN_XR ([RaananW](https://github.com/RaananW))
- Fix improper baking of transformed textures in `KHR_texture_transform` serializer. ([drigax](https://github.com/Drigax))
- Fixed NME codegen: missing common properties for float-value input block. ([ycw](https://github.com/ycw))
- Fixed missing options for MeshBuilder.CreateBox. ([ycw](https://github.com/ycw))
- Fix bug in `Plane.transform` when matrix passed in is not a pure rotation ([Popov72](https://github.com/Popov72)
- Fix bug in PBR when anisotropy is enabled and no bump texture is provided ([Popov72](https://github.com/Popov72)
- Fix horizon occlusion in PBR materials ([Popov72](https://github.com/Popov72)
- Fixed delay calculation in Animatable.goToFrame when speedRatio != 1 ([Reimund Järnfors](https://github.com/reimund)
- Fix bug in PBR when translucency is enabled and an irradiance texture is provided ([Popov72](https://github.com/Popov72)
- Fix bug in PBR with translucency when irradiance texture is 2D ([Popov72](https://github.com/Popov72)
- Fix bug in PBR when specific combinations of parameters are used ([Popov72](https://github.com/Popov72)

## Breaking changes

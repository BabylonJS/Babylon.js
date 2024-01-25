# Changelog

## 6.40.0

### Core

- Morph targets: Pass the number of active targets to the shader as a uniform - by [Popov72](https://github.com/Popov72) ([#14734](https://github.com/BabylonJS/Babylon.js/pull/14734))
- Better feature handling - by [RaananW](https://github.com/RaananW) ([#14732](https://github.com/BabylonJS/Babylon.js/pull/14732))
- Flush for Native does nothing - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14729](https://github.com/BabylonJS/Babylon.js/pull/14729))
- Fix audio engine unlock issue - [_Bug Fix_] by [docEdub](https://github.com/docEdub) ([#14724](https://github.com/BabylonJS/Babylon.js/pull/14724))
- Particle systems: Fix serialization and parsing of CustomParticleEmitter - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14723](https://github.com/BabylonJS/Babylon.js/pull/14723))
- Particle systems: When using the cylinder-directed particle emitter, fix the start direction when in local space - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14721](https://github.com/BabylonJS/Babylon.js/pull/14721))
- Basic inspector for V2 physics - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14718](https://github.com/BabylonJS/Babylon.js/pull/14718))
- Gizmo manager enhancement - by [SalmaBesbes](https://github.com/SalmaBesbes) ([#14720](https://github.com/BabylonJS/Babylon.js/pull/14720))
- Linting - require returns, params - by [RaananW](https://github.com/RaananW) ([#14719](https://github.com/BabylonJS/Babylon.js/pull/14719))
- WebXR world scaling factor - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#14716](https://github.com/BabylonJS/Babylon.js/pull/14716))
- WebGPU: Allow to pass an offscreen canvas to the constructor - by [Popov72](https://github.com/Popov72) ([#14714](https://github.com/BabylonJS/Babylon.js/pull/14714))
- fix animation events not firing for 1 key animations - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14715](https://github.com/BabylonJS/Babylon.js/pull/14715))
- Gaussian Splatting: add a gaussian splatting mesh and material - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#14711](https://github.com/BabylonJS/Babylon.js/pull/14711))

### GUI

- Move delegate picking to children to container - by [carolhmj](https://github.com/carolhmj) ([#14726](https://github.com/BabylonJS/Babylon.js/pull/14726))
- Add isSerializable flag to GUI controls - by [carolhmj](https://github.com/carolhmj) ([#14722](https://github.com/BabylonJS/Babylon.js/pull/14722))

### GUI Editor

- Move delegate picking to children to container - by [carolhmj](https://github.com/carolhmj) ([#14726](https://github.com/BabylonJS/Babylon.js/pull/14726))
- Add isSerializable flag to GUI controls - by [carolhmj](https://github.com/carolhmj) ([#14722](https://github.com/BabylonJS/Babylon.js/pull/14722))

### Inspector

- Remove zOffset from inspector wireframe mesh - by [Michalzr](https://github.com/Michalzr) ([#14735](https://github.com/BabylonJS/Babylon.js/pull/14735))
- Basic inspector for V2 physics - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14718](https://github.com/BabylonJS/Babylon.js/pull/14718))

### Loaders

- glTF loader: allow no root node - by [Popov72](https://github.com/Popov72) ([#14733](https://github.com/BabylonJS/Babylon.js/pull/14733))
- glTF loader: Add an option to pass a custom root node - by [Popov72](https://github.com/Popov72) ([#14730](https://github.com/BabylonJS/Babylon.js/pull/14730))
- Gaussian Splatting: add a gaussian splatting mesh and material - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#14711](https://github.com/BabylonJS/Babylon.js/pull/14711))

### Materials


### Serializers


## 6.39.0

### Core

- TransformNode: Serialize animations - by [Popov72](https://github.com/Popov72) ([#14710](https://github.com/BabylonJS/Babylon.js/pull/14710))
- Error on Naming Convention using eslint - by [RaananW](https://github.com/RaananW) ([#14709](https://github.com/BabylonJS/Babylon.js/pull/14709))
- Fix parent transformations being applied to position/rotation deltas … - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14708](https://github.com/BabylonJS/Babylon.js/pull/14708))
- add canvas option for VideoRecorder - by [SalmaBesbes](https://github.com/SalmaBesbes) ([#14707](https://github.com/BabylonJS/Babylon.js/pull/14707))
- Some fixes for the doc checks - by [RaananW](https://github.com/RaananW) ([#14706](https://github.com/BabylonJS/Babylon.js/pull/14706))

### GUI

- Error on Naming Convention using eslint - by [RaananW](https://github.com/RaananW) ([#14709](https://github.com/BabylonJS/Babylon.js/pull/14709))

### GUI Editor

- Error on Naming Convention using eslint - by [RaananW](https://github.com/RaananW) ([#14709](https://github.com/BabylonJS/Babylon.js/pull/14709))

### Inspector

- Error on Naming Convention using eslint - by [RaananW](https://github.com/RaananW) ([#14709](https://github.com/BabylonJS/Babylon.js/pull/14709))

### Loaders

- Error on Naming Convention using eslint - by [RaananW](https://github.com/RaananW) ([#14709](https://github.com/BabylonJS/Babylon.js/pull/14709))

## 6.38.1

### Core

- Fixes for native async shader compilation - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#14701](https://github.com/BabylonJS/Babylon.js/pull/14701))
- WebGPU: Sync with specification - by [Popov72](https://github.com/Popov72) ([#14698](https://github.com/BabylonJS/Babylon.js/pull/14698))
- Flow graph integer math - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14691](https://github.com/BabylonJS/Babylon.js/pull/14691))
- recast.js update, fix link transform for ragdoll - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14695](https://github.com/BabylonJS/Babylon.js/pull/14695))
- Fix issue with movement and 6DOF in XR - by [RaananW](https://github.com/RaananW) ([#14696](https://github.com/BabylonJS/Babylon.js/pull/14696))
- Spotlight: Fix wrong projected texture when light is parented - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14697](https://github.com/BabylonJS/Babylon.js/pull/14697))

### Loaders

- Flow graph integer math - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14691](https://github.com/BabylonJS/Babylon.js/pull/14691))

## 6.38.0

### Core

- improve speed of GaussianSplatting - by [xiasun](https://github.com/xiasun) ([#14684](https://github.com/BabylonJS/Babylon.js/pull/14684))
- Adding loadeddata event listener in videoTexture - by [RaananW](https://github.com/RaananW) ([#14690](https://github.com/BabylonJS/Babylon.js/pull/14690))
- Fix camera gizmo set custom mesh - by [SalmaBesbes](https://github.com/SalmaBesbes) ([#14685](https://github.com/BabylonJS/Babylon.js/pull/14685))
- BoudingBoxGizmo Scale Boxes Fix - by [Pryme8](https://github.com/Pryme8) ([#14687](https://github.com/BabylonJS/Babylon.js/pull/14687))
- RSM: add support for reflective shadow maps generation + GI based on RSM - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#14680](https://github.com/BabylonJS/Babylon.js/pull/14680))
- Update WebXRControllerTeleportation.ts - by [RaananW](https://github.com/RaananW) ([#14683](https://github.com/BabylonJS/Babylon.js/pull/14683))
- Thin instances: Change default value for the staticBuffer parameter - [_Breaking Change_] by [Popov72](https://github.com/Popov72) ([#14679](https://github.com/BabylonJS/Babylon.js/pull/14679))
- Skeleton: Fix empty transform matrices when cloning a mesh - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14682](https://github.com/BabylonJS/Babylon.js/pull/14682))
- WebGPU: manage context loss and restoration (part 2) - by [Popov72](https://github.com/Popov72) ([#14674](https://github.com/BabylonJS/Babylon.js/pull/14674))
- Fix camera not being reattached after a two pointer SixDofDragBehavior - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14677](https://github.com/BabylonJS/Babylon.js/pull/14677))
- Force texture loading with bitmap when in offscreen canvas - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14676](https://github.com/BabylonJS/Babylon.js/pull/14676))
- Fix scaling problems in sixDofDragBehavior - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14669](https://github.com/BabylonJS/Babylon.js/pull/14669))

### GUI Editor


### Loaders

- Expose _rootUrl of gltf loader as public get property - by [tholub99](https://github.com/tholub99) ([#14673](https://github.com/BabylonJS/Babylon.js/pull/14673))

### Playground

- Allow different versions in PG and Sandbox - by [RaananW](https://github.com/RaananW) ([#14681](https://github.com/BabylonJS/Babylon.js/pull/14681))

## 6.37.1

### Core

- Camera framing behavior: Fix crash - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14670](https://github.com/BabylonJS/Babylon.js/pull/14670))
- ArcRotateCamera: Allow to pass a transform node to setTarget / targetHost - by [Popov72](https://github.com/Popov72) ([#14666](https://github.com/BabylonJS/Babylon.js/pull/14666))

## 6.37.0

### Core

- Add observers to WebXRCamera when a rotation is performed - by [yuripourre](https://github.com/yuripourre) ([#14660](https://github.com/BabylonJS/Babylon.js/pull/14660))
- WebGPU: Manage context lost and restoration - by [Popov72](https://github.com/Popov72) ([#14655](https://github.com/BabylonJS/Babylon.js/pull/14655))
- Fix arcrotate gamepad input - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14665](https://github.com/BabylonJS/Babylon.js/pull/14665))
- Flow Graph/Interactivity/Animation Pointer Object model - by [carolhmj](https://github.com/carolhmj) ([#14608](https://github.com/BabylonJS/Babylon.js/pull/14608))
- Fix material plugin calls without register - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14664](https://github.com/BabylonJS/Babylon.js/pull/14664))
- fix(ShaderMaterial): correct serialization key spelling mistake - by [Starryi](https://github.com/Starryi) ([#14661](https://github.com/BabylonJS/Babylon.js/pull/14661))
- DynamicTexture: add sanity check in dispose - by [Popov72](https://github.com/Popov72) ([#14657](https://github.com/BabylonJS/Babylon.js/pull/14657))
- refactor(renderTargetTexture): optimized render - by [GuoBinyong](https://github.com/GuoBinyong) ([#14650](https://github.com/BabylonJS/Babylon.js/pull/14650))

### Loaders

- Flow Graph/Interactivity/Animation Pointer Object model - by [carolhmj](https://github.com/carolhmj) ([#14608](https://github.com/BabylonJS/Babylon.js/pull/14608))

## 6.36.1

### Core

- Declaration generation for UMD - by [RaananW](https://github.com/RaananW) ([#14659](https://github.com/BabylonJS/Babylon.js/pull/14659))

## 6.36.0

### Core

- WebGPU: Fix breaking change in the constructor of ComputeShader - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14652](https://github.com/BabylonJS/Babylon.js/pull/14652))
- ProceduralTexture: Add options when creating a (custom) procedural texture - by [Popov72](https://github.com/Popov72) ([#14651](https://github.com/BabylonJS/Babylon.js/pull/14651))
- fix comments - by [Starryi](https://github.com/Starryi) ([#14649](https://github.com/BabylonJS/Babylon.js/pull/14649))
- DynamicTexture: Add a dispose method - by [Popov72](https://github.com/Popov72) ([#14647](https://github.com/BabylonJS/Babylon.js/pull/14647))
- SSR: Add support for world/unsigned normals - by [Popov72](https://github.com/Popov72) ([#14646](https://github.com/BabylonJS/Babylon.js/pull/14646))
- GeometryBufferRenderer: Add a getter for "unsigned normals" - by [Popov72](https://github.com/Popov72) ([#14645](https://github.com/BabylonJS/Babylon.js/pull/14645))
- GeometryBufferRenderer: Allow to define texture type and format - by [Popov72](https://github.com/Popov72) ([#14644](https://github.com/BabylonJS/Babylon.js/pull/14644))
- Incremental bounding box scaling - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14642](https://github.com/BabylonJS/Babylon.js/pull/14642))
- WebGPU: Inject dynamic and uniform buffer extensions in WebGPU engine - by [Popov72](https://github.com/Popov72) ([#14640](https://github.com/BabylonJS/Babylon.js/pull/14640))

## 6.35.0

### Core

- SSR: Don't recalculate the camera view/projection matrices each frame - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14633](https://github.com/BabylonJS/Babylon.js/pull/14633))
- Bake morph data: allow negative influences - by [Popov72](https://github.com/Popov72) ([#14632](https://github.com/BabylonJS/Babylon.js/pull/14632))

### Loaders

- Force alpha to be 1 with opaque alpha mode in glTF - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#14628](https://github.com/BabylonJS/Babylon.js/pull/14628))

### Serializers

- Fix issue when exporting to glTF with a node material - by [bghgary](https://github.com/bghgary) ([#14629](https://github.com/BabylonJS/Babylon.js/pull/14629))

## 6.34.3

### Core

- WebGPU: Add support for GPU timing for compute shaders, render targets and main render pass - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#14624](https://github.com/BabylonJS/Babylon.js/pull/14624))

## 6.34.2

### Core

- add isDisposed method to physicsbody - by [carolhmj](https://github.com/carolhmj) ([#14627](https://github.com/BabylonJS/Babylon.js/pull/14627))
- Fix rearm for crowd agent onreach observable - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14625](https://github.com/BabylonJS/Babylon.js/pull/14625))
- Fix broken glTF validator array buffer management - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#14622](https://github.com/BabylonJS/Babylon.js/pull/14622))
- WebGPU: Reseting ubos in flushFramebuffer does not work - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14623](https://github.com/BabylonJS/Babylon.js/pull/14623))
- RenderTargetTexture: Fix wrong transformation matrix set on scene when multiple scenes are defined - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14621](https://github.com/BabylonJS/Babylon.js/pull/14621))
- Add buffer based variants of displacement and height - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#14620](https://github.com/BabylonJS/Babylon.js/pull/14620))

### Loaders

- Fix broken glTF validator array buffer management - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#14622](https://github.com/BabylonJS/Babylon.js/pull/14622))
- Allow triangle list with glTF draco - by [bghgary](https://github.com/bghgary) ([#14596](https://github.com/BabylonJS/Babylon.js/pull/14596))

## 6.34.1

### Core

- ArcRotateCamera: Fix alpha offset inversion to not include beta = 0 - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#14617](https://github.com/BabylonJS/Babylon.js/pull/14617))
- WebGPU: ubos and storage buffers optimizations - by [Popov72](https://github.com/Popov72) ([#14611](https://github.com/BabylonJS/Babylon.js/pull/14611))
- Animation: Fix return value of createKeyForFrame when key already exists - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14615](https://github.com/BabylonJS/Babylon.js/pull/14615))
- Keep initial value for incremental scaling - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14613](https://github.com/BabylonJS/Babylon.js/pull/14613))
- Physics V2 ragdolls - [_New Feature_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14606](https://github.com/BabylonJS/Babylon.js/pull/14606))
- fix circular dependency - by [carolhmj](https://github.com/carolhmj) ([#14612](https://github.com/BabylonJS/Babylon.js/pull/14612))

### GUI


### GUI Editor


### Inspector


### Loaders


### Node Editor


### Playground


### Viewer


## 6.34.0

### Core

- Morph: Fix baking of morph data when multiple non zero influences - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14605](https://github.com/BabylonJS/Babylon.js/pull/14605))

## 6.33.2

### Core

- ComputeShader: Add a fastMode switch - by [Popov72](https://github.com/Popov72) ([#14604](https://github.com/BabylonJS/Babylon.js/pull/14604))
- WebXR mesh detection - by [RaananW](https://github.com/RaananW) ([#14543](https://github.com/BabylonJS/Babylon.js/pull/14543))
- Disable UBOs in Chrome mobile... - by [sebavan](https://github.com/sebavan) ([#14603](https://github.com/BabylonJS/Babylon.js/pull/14603))
- AnimationGroupMask: Add a disabled property - by [Popov72](https://github.com/Popov72) ([#14602](https://github.com/BabylonJS/Babylon.js/pull/14602))
- Flow Graph: glTF parsing v1 - by [carolhmj](https://github.com/carolhmj) ([#14500](https://github.com/BabylonJS/Babylon.js/pull/14500))
- Fix code generation in GeometryInputBlock. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14600](https://github.com/BabylonJS/Babylon.js/pull/14600))
- Light: Add helper methods to retrieve view and projection matrices - by [Popov72](https://github.com/Popov72) ([#14598](https://github.com/BabylonJS/Babylon.js/pull/14598))
- Scene: Fix return type of getMeshesByTags - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14599](https://github.com/BabylonJS/Babylon.js/pull/14599))

### Inspector

- ACE: Fixed incorrect display of loop mode when editing a property - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14594](https://github.com/BabylonJS/Babylon.js/pull/14594))

### Loaders

- GaussianSplat .PLY file format support - [_New Feature_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14601](https://github.com/BabylonJS/Babylon.js/pull/14601))
- Flow Graph: glTF parsing v1 - by [carolhmj](https://github.com/carolhmj) ([#14500](https://github.com/BabylonJS/Babylon.js/pull/14500))

### Materials

- PBRCustomMaterial & CustomMaterial support MaterialPlugin - by [Starryi](https://github.com/Starryi) ([#14593](https://github.com/BabylonJS/Babylon.js/pull/14593))

## 6.33.1

### Core

- Gaussian Splatting file loader - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14589](https://github.com/BabylonJS/Babylon.js/pull/14589))
- PBR material: Fix duplication of colorinstance in attribute array - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14591](https://github.com/BabylonJS/Babylon.js/pull/14591))
- MeshUVSpaceRenderer UV Edge Blending - by [torchesburn](https://github.com/torchesburn) ([#14577](https://github.com/BabylonJS/Babylon.js/pull/14577))
- Mesh: Fix calculation for targets other than position in getNormalsData - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14590](https://github.com/BabylonJS/Babylon.js/pull/14590))

### GUI

- Make inputTextArea show placeholder - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14587](https://github.com/BabylonJS/Babylon.js/pull/14587))

### Loaders

- Gaussian Splatting file loader - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14589](https://github.com/BabylonJS/Babylon.js/pull/14589))

## 6.33.0

### Core

- Materials: Add support for logarithmic depth to all materials - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#14581](https://github.com/BabylonJS/Babylon.js/pull/14581))
- Animations: Use a new mode for "relative from current" animation loop - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#14584](https://github.com/BabylonJS/Babylon.js/pull/14584))
- Gaussian Splatting - [_New Feature_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14578](https://github.com/BabylonJS/Babylon.js/pull/14578))
- Quick KHR_materials_dispersion implementation - by [MiiBond](https://github.com/MiiBond) ([#14501](https://github.com/BabylonJS/Babylon.js/pull/14501))
- feat (plane):  copyFromPositionAndNormal - by [GuoBinyong](https://github.com/GuoBinyong) ([#14570](https://github.com/BabylonJS/Babylon.js/pull/14570))
- Fix missing internal sized formats for MSAA render targets - by [rapid-images-tore-levenstam](https://github.com/rapid-images-tore-levenstam) ([#14580](https://github.com/BabylonJS/Babylon.js/pull/14580))
- Gizmo fixes/improvements - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14559](https://github.com/BabylonJS/Babylon.js/pull/14559))
- Mesh Pick event bubbling - by [carolhmj](https://github.com/carolhmj) ([#14573](https://github.com/BabylonJS/Babylon.js/pull/14573))
- Fix dynamic texture when context restored - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14574](https://github.com/BabylonJS/Babylon.js/pull/14574))
- Detect procedural texture readyness. - by [sebavan](https://github.com/sebavan) ([#14575](https://github.com/BabylonJS/Babylon.js/pull/14575))

### Inspector

- Animations: Use a new mode for "relative from current" animation loop - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#14584](https://github.com/BabylonJS/Babylon.js/pull/14584))
- Quick KHR_materials_dispersion implementation - by [MiiBond](https://github.com/MiiBond) ([#14501](https://github.com/BabylonJS/Babylon.js/pull/14501))

### Loaders

- Quick KHR_materials_dispersion implementation - by [MiiBond](https://github.com/MiiBond) ([#14501](https://github.com/BabylonJS/Babylon.js/pull/14501))

### Materials

- Materials: Add support for logarithmic depth to all materials - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#14581](https://github.com/BabylonJS/Babylon.js/pull/14581))
- PBR custom materials: Fix default shader name - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14576](https://github.com/BabylonJS/Babylon.js/pull/14576))

### Serializers

- Quick KHR_materials_dispersion implementation - by [MiiBond](https://github.com/MiiBond) ([#14501](https://github.com/BabylonJS/Babylon.js/pull/14501))

## 6.32.1

### Core

- Post process: Add support for uniform buffers - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#14568](https://github.com/BabylonJS/Babylon.js/pull/14568))
- Animations: Fix loop relative mode to start at the current value of the animated object - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14563](https://github.com/BabylonJS/Babylon.js/pull/14563))
- feat(gizmo): support hover & disable color - by [PhilippeMorier](https://github.com/PhilippeMorier) ([#14566](https://github.com/BabylonJS/Babylon.js/pull/14566))
- Fix opaque only picking for rotated controls - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14561](https://github.com/BabylonJS/Babylon.js/pull/14561))

### GUI

- Better handling of StackPanel layout warning - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14549](https://github.com/BabylonJS/Babylon.js/pull/14549))
- Fix opaque only picking for rotated controls - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14561](https://github.com/BabylonJS/Babylon.js/pull/14561))

### Loaders

- Parent group entities to object entities on the OBJ loader - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14565](https://github.com/BabylonJS/Babylon.js/pull/14565))
- Fix camera rotation when exporting glTF - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#14562](https://github.com/BabylonJS/Babylon.js/pull/14562))

### Materials

- Avoid duplicate shader created by customMaterial & pbrCustomMaterial - by [Starryi](https://github.com/Starryi) ([#14571](https://github.com/BabylonJS/Babylon.js/pull/14571))

### Node Editor


### Playground


### Serializers

- Fix camera rotation when exporting glTF - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#14562](https://github.com/BabylonJS/Babylon.js/pull/14562))

## 6.32.0

### Core

- Fix for animations with relative loop mode. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14560](https://github.com/BabylonJS/Babylon.js/pull/14560))
- Fix Matrix getRowToRef function - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14556](https://github.com/BabylonJS/Babylon.js/pull/14556))
- Mesh: Add a setIndexBuffer method - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#14551](https://github.com/BabylonJS/Babylon.js/pull/14551))
- Flow graph path - by [carolhmj](https://github.com/carolhmj) ([#14544](https://github.com/BabylonJS/Babylon.js/pull/14544))
- Update dependencies - by [RaananW](https://github.com/RaananW) ([#14550](https://github.com/BabylonJS/Babylon.js/pull/14550))
- Thin instances: Support forcedInstanceCount with thin instances - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#14553](https://github.com/BabylonJS/Babylon.js/pull/14553))
- Allow Mod Node to use float as second operand - by [Starryi](https://github.com/Starryi) ([#14547](https://github.com/BabylonJS/Babylon.js/pull/14547))
- GeometryBufferRenderer: Use bone texture if supported - by [Popov72](https://github.com/Popov72) ([#14548](https://github.com/BabylonJS/Babylon.js/pull/14548))
- Allows SkeletonViewer to render skeleton without mesh - by [yuripourre](https://github.com/yuripourre) ([#14538](https://github.com/BabylonJS/Babylon.js/pull/14538))
- Fix highlight layer properties in inspector - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14541](https://github.com/BabylonJS/Babylon.js/pull/14541))

### Inspector

- Allows SkeletonViewer to render skeleton without mesh - by [yuripourre](https://github.com/yuripourre) ([#14538](https://github.com/BabylonJS/Babylon.js/pull/14538))
- Fix highlight layer properties in inspector - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14541](https://github.com/BabylonJS/Babylon.js/pull/14541))

### Loaders

- glTF transmission: Fix rendering sprites and particle systems in the opaque texture - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14542](https://github.com/BabylonJS/Babylon.js/pull/14542))

### Materials

- Fix Add Color Uniform of CustomMaterial & PBRCustomMaterial - by [Starryi](https://github.com/Starryi) ([#14558](https://github.com/BabylonJS/Babylon.js/pull/14558))

### Serializers

- Update dependencies - by [RaananW](https://github.com/RaananW) ([#14550](https://github.com/BabylonJS/Babylon.js/pull/14550))

## 6.31.0

### Core

- docs: s/the the/the - by [PhilippeMorier](https://github.com/PhilippeMorier) ([#14539](https://github.com/BabylonJS/Babylon.js/pull/14539))
- OIT: Add a isReady method to the depth peeling renderer - by [Popov72](https://github.com/Popov72) ([#14536](https://github.com/BabylonJS/Babylon.js/pull/14536))
- Multi canvas rendering: Allow multiple cameras when registering a view - by [Popov72](https://github.com/Popov72) ([#14535](https://github.com/BabylonJS/Babylon.js/pull/14535))
- feat(gizmo): set custom rotation color - by [PhilippeMorier](https://github.com/PhilippeMorier) ([#14534](https://github.com/BabylonJS/Babylon.js/pull/14534))
- Add HDR Filtering to webxr light estimation - by [RaananW](https://github.com/RaananW) ([#14526](https://github.com/BabylonJS/Babylon.js/pull/14526))
- refactor: optimize getForwardRayToRef - by [GuoBinyong](https://github.com/GuoBinyong) ([#14531](https://github.com/BabylonJS/Babylon.js/pull/14531))
- feat(gizmo): custom colors for gizmos - by [PhilippeMorier](https://github.com/PhilippeMorier) ([#14525](https://github.com/BabylonJS/Babylon.js/pull/14525))
- Raw camera access feature - by [RaananW](https://github.com/RaananW) ([#14527](https://github.com/BabylonJS/Babylon.js/pull/14527))
- DepthRenderer: Support point rendering - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#14528](https://github.com/BabylonJS/Babylon.js/pull/14528))
- Optimize duplicate member visits - by [GuoBinyong](https://github.com/GuoBinyong) ([#14523](https://github.com/BabylonJS/Babylon.js/pull/14523))
- refactor: Optimized createPickingRay - by [GuoBinyong](https://github.com/GuoBinyong) ([#14524](https://github.com/BabylonJS/Babylon.js/pull/14524))

### GUI

- Fix inputTextArea isReadOnly - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14533](https://github.com/BabylonJS/Babylon.js/pull/14533))
- fix: correct two misspellings - by [wy-luke](https://github.com/wy-luke) ([#14530](https://github.com/BabylonJS/Babylon.js/pull/14530))

### Loaders

- glTF loader: Fix checking bounds when creating a typed array - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14540](https://github.com/BabylonJS/Babylon.js/pull/14540))

### Node Editor

- docs: s/the the/the - by [PhilippeMorier](https://github.com/PhilippeMorier) ([#14539](https://github.com/BabylonJS/Babylon.js/pull/14539))

### Serializers

- docs: s/the the/the - by [PhilippeMorier](https://github.com/PhilippeMorier) ([#14539](https://github.com/BabylonJS/Babylon.js/pull/14539))

### Viewer

- docs: s/the the/the - by [PhilippeMorier](https://github.com/PhilippeMorier) ([#14539](https://github.com/BabylonJS/Babylon.js/pull/14539))

## 6.30.0

### Core


## 6.29.2

### Core

- refactor: optimize the code of angle calculations - by [GuoBinyong](https://github.com/GuoBinyong) ([#14519](https://github.com/BabylonJS/Babylon.js/pull/14519))
- Material: Fix wrong normal when material has two sided lighting enabled - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14520](https://github.com/BabylonJS/Babylon.js/pull/14520))
- Update interface to match changes in Havok 1.3.0 plugin - by [eoineoineoin](https://github.com/eoineoineoin) ([#14517](https://github.com/BabylonJS/Babylon.js/pull/14517))
- AxesViewer: Fix scaleLines property - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14518](https://github.com/BabylonJS/Babylon.js/pull/14518))
- WebGPU: remove rtt encoder + misc changes - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14506](https://github.com/BabylonJS/Babylon.js/pull/14506))
- Dot normal angle - by [GuoBinyong](https://github.com/GuoBinyong) ([#14511](https://github.com/BabylonJS/Babylon.js/pull/14511))
- Fix light in NME - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14514](https://github.com/BabylonJS/Babylon.js/pull/14514))

### Inspector

- WebGPU: remove rtt encoder + misc changes - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14506](https://github.com/BabylonJS/Babylon.js/pull/14506))

## 6.29.1

### Core

- Revert "Camera: Modify Camera Movement to work off of time - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#14510](https://github.com/BabylonJS/Babylon.js/pull/14510))
- Camera: Modify Camera Movement to work off of time, instead of frame rate - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#14482](https://github.com/BabylonJS/Babylon.js/pull/14482))
- Fix dynamic texture clear with transparency - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14507](https://github.com/BabylonJS/Babylon.js/pull/14507))
- PostProcess: Fix target not created after parsing - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14505](https://github.com/BabylonJS/Babylon.js/pull/14505))
- Add optional color option to camera gizmo - by [carolhmj](https://github.com/carolhmj) ([#14502](https://github.com/BabylonJS/Babylon.js/pull/14502))
- refactor: change the way arrays are literals - by [GuoBinyong](https://github.com/GuoBinyong) ([#14503](https://github.com/BabylonJS/Babylon.js/pull/14503))

### GUI

- refactor: change the way arrays are literals - by [GuoBinyong](https://github.com/GuoBinyong) ([#14503](https://github.com/BabylonJS/Babylon.js/pull/14503))

### Inspector

- refactor: change the way arrays are literals - by [GuoBinyong](https://github.com/GuoBinyong) ([#14503](https://github.com/BabylonJS/Babylon.js/pull/14503))

### Loaders

- refactor: change the way arrays are literals - by [GuoBinyong](https://github.com/GuoBinyong) ([#14503](https://github.com/BabylonJS/Babylon.js/pull/14503))

### Materials

- refactor: change the way arrays are literals - by [GuoBinyong](https://github.com/GuoBinyong) ([#14503](https://github.com/BabylonJS/Babylon.js/pull/14503))

## 6.29.0

### Core

- Camera: Modify Camera Movement to work off of time, instead of frame rate - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#14482](https://github.com/BabylonJS/Babylon.js/pull/14482))
- feat: optimize vector3 - by [GuoBinyong](https://github.com/GuoBinyong) ([#14498](https://github.com/BabylonJS/Babylon.js/pull/14498))
- Animations: Add an easingFunction property to IAnimationKey - by [Popov72](https://github.com/Popov72) ([#14497](https://github.com/BabylonJS/Babylon.js/pull/14497))
- Flow Graph Path Mapping - by [carolhmj](https://github.com/carolhmj) ([#14481](https://github.com/BabylonJS/Babylon.js/pull/14481))
- Flow Graph Context Logger - by [carolhmj](https://github.com/carolhmj) ([#14495](https://github.com/BabylonJS/Babylon.js/pull/14495))
- Rename internal classes in CSG - by [RaananW](https://github.com/RaananW) ([#14494](https://github.com/BabylonJS/Babylon.js/pull/14494))
- Fix ray cast skipBoundingInfo with in intersects - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14492](https://github.com/BabylonJS/Babylon.js/pull/14492))
- CreateText does not align text on z - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14493](https://github.com/BabylonJS/Babylon.js/pull/14493))

## 6.28.1

### Core

- GLTF loading dirty mechanism perf - by [sebavan](https://github.com/sebavan) ([#14487](https://github.com/BabylonJS/Babylon.js/pull/14487))
- Performance mode: Restore dispached flags in aggressive mode - by [sebavan](https://github.com/sebavan) ([#14489](https://github.com/BabylonJS/Babylon.js/pull/14489))
- Fix shallow copies of referenced objects - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14486](https://github.com/BabylonJS/Babylon.js/pull/14486))
- Allow matrix transposeToRef to work in place - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14485](https://github.com/BabylonJS/Babylon.js/pull/14485))
- feat: Added a default configuration to DebugLayer - by [GuoBinyong](https://github.com/GuoBinyong) ([#14474](https://github.com/BabylonJS/Babylon.js/pull/14474))

### Loaders

- GLTF loading dirty mechanism perf - by [sebavan](https://github.com/sebavan) ([#14487](https://github.com/BabylonJS/Babylon.js/pull/14487))

## 6.28.0

### Core

- Fix undeclared identifier error in NodeMaterial shader - by [Starryi](https://github.com/Starryi) ([#14484](https://github.com/BabylonJS/Babylon.js/pull/14484))
- refactor: optimized scene.constructor - by [GuoBinyong](https://github.com/GuoBinyong) ([#14483](https://github.com/BabylonJS/Babylon.js/pull/14483))
- ShaderMaterial: Make sure the color attribute is not duplicated - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14480](https://github.com/BabylonJS/Babylon.js/pull/14480))
- Adapt post process to viewport in DefaultRenderingPipeline - by [sebavan](https://github.com/sebavan) ([#14451](https://github.com/BabylonJS/Babylon.js/pull/14451))
- Warn about missing dependency, but only once - by [RaananW](https://github.com/RaananW) ([#14477](https://github.com/BabylonJS/Babylon.js/pull/14477))
- Use the static member of default CDN URL - by [RaananW](https://github.com/RaananW) ([#14476](https://github.com/BabylonJS/Babylon.js/pull/14476))
- Fix breaking issue with ScriptBaseUrl - by [RaananW](https://github.com/RaananW) ([#14472](https://github.com/BabylonJS/Babylon.js/pull/14472))
- world vs finalWorld fix in shader material - by [RolandCsibrei](https://github.com/RolandCsibrei) ([#14469](https://github.com/BabylonJS/Babylon.js/pull/14469))

### GUI

- fix stack panel GUI warnings - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14475](https://github.com/BabylonJS/Babylon.js/pull/14475))

### Inspector

- Use the static member of default CDN URL - by [RaananW](https://github.com/RaananW) ([#14476](https://github.com/BabylonJS/Babylon.js/pull/14476))
- Fix breaking issue with ScriptBaseUrl - by [RaananW](https://github.com/RaananW) ([#14472](https://github.com/BabylonJS/Babylon.js/pull/14472))

### Loaders

- Use the static member of default CDN URL - by [RaananW](https://github.com/RaananW) ([#14476](https://github.com/BabylonJS/Babylon.js/pull/14476))
- Fix breaking issue with ScriptBaseUrl - by [RaananW](https://github.com/RaananW) ([#14472](https://github.com/BabylonJS/Babylon.js/pull/14472))

## 6.27.1

### Loaders


## 6.27.0

### Core

- Add ground projection support - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#14470](https://github.com/BabylonJS/Babylon.js/pull/14470))
- Update linter and formatter - by [RaananW](https://github.com/RaananW) ([#14461](https://github.com/BabylonJS/Babylon.js/pull/14461))

### GUI

- Update linter and formatter - by [RaananW](https://github.com/RaananW) ([#14461](https://github.com/BabylonJS/Babylon.js/pull/14461))

### GUI Editor

- Update linter and formatter - by [RaananW](https://github.com/RaananW) ([#14461](https://github.com/BabylonJS/Babylon.js/pull/14461))

### Inspector

- Add ground projection support - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#14470](https://github.com/BabylonJS/Babylon.js/pull/14470))
- Update linter and formatter - by [RaananW](https://github.com/RaananW) ([#14461](https://github.com/BabylonJS/Babylon.js/pull/14461))

### Loaders

- Update linter and formatter - by [RaananW](https://github.com/RaananW) ([#14461](https://github.com/BabylonJS/Babylon.js/pull/14461))

### Materials

- Update linter and formatter - by [RaananW](https://github.com/RaananW) ([#14461](https://github.com/BabylonJS/Babylon.js/pull/14461))

### Node Editor

- Update linter and formatter - by [RaananW](https://github.com/RaananW) ([#14461](https://github.com/BabylonJS/Babylon.js/pull/14461))

### Viewer

- Update linter and formatter - by [RaananW](https://github.com/RaananW) ([#14461](https://github.com/BabylonJS/Babylon.js/pull/14461))

## 6.26.0

### Core

- Fix transform node world space rotation when parent has negative world matrix determinant - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14467](https://github.com/BabylonJS/Babylon.js/pull/14467))
- fix: missing export for public property type - by [brianzinn](https://github.com/brianzinn) ([#14465](https://github.com/BabylonJS/Babylon.js/pull/14465))
- CreateScreenshotUsingRenderTarget: Render to texture only when texture and camera are ready - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14463](https://github.com/BabylonJS/Babylon.js/pull/14463))
- GRL - instancing support - by [RolandCsibrei](https://github.com/RolandCsibrei) ([#14460](https://github.com/BabylonJS/Babylon.js/pull/14460))
- Function to add element and all its children to AssetContainer - by [carolhmj](https://github.com/carolhmj) ([#14457](https://github.com/BabylonJS/Babylon.js/pull/14457))

## 6.25.1

### Core

- Add mesh without vertex normals to SPS - by [carolhmj](https://github.com/carolhmj) ([#14464](https://github.com/BabylonJS/Babylon.js/pull/14464))
- Fix instanced buffers of cloned meshes - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14456](https://github.com/BabylonJS/Babylon.js/pull/14456))
- incorrect CDN link for some packages - by [RaananW](https://github.com/RaananW) ([#14462](https://github.com/BabylonJS/Babylon.js/pull/14462))
- Move type out of import clause - by [RaananW](https://github.com/RaananW) ([#14459](https://github.com/BabylonJS/Babylon.js/pull/14459))
- Change script loading architecture - by [RaananW](https://github.com/RaananW) ([#14447](https://github.com/BabylonJS/Babylon.js/pull/14447))
- ShadowDepthWrapper: Fix a memory leak when new effects must be created - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14449](https://github.com/BabylonJS/Babylon.js/pull/14449))
- Fix texture sampler precision for skinning and morph - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14448](https://github.com/BabylonJS/Babylon.js/pull/14448))

### GUI

- Fix stack panel giving a warning for children with resizeToFit. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14452](https://github.com/BabylonJS/Babylon.js/pull/14452))
- Faster twin renderer - by [carolhmj](https://github.com/carolhmj) ([#14441](https://github.com/BabylonJS/Babylon.js/pull/14441))

### GUI Editor

- Gui editor metadata - by [vinhui](https://github.com/vinhui) ([#14442](https://github.com/BabylonJS/Babylon.js/pull/14442))

### Inspector

- incorrect CDN link for some packages - by [RaananW](https://github.com/RaananW) ([#14462](https://github.com/BabylonJS/Babylon.js/pull/14462))
- Change script loading architecture - by [RaananW](https://github.com/RaananW) ([#14447](https://github.com/BabylonJS/Babylon.js/pull/14447))
- Fix key navigation in scene explorer - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14450](https://github.com/BabylonJS/Babylon.js/pull/14450))

### Loaders

- Change script loading architecture - by [RaananW](https://github.com/RaananW) ([#14447](https://github.com/BabylonJS/Babylon.js/pull/14447))

## 6.25.0

### Core

- Oblique Camera Implementation - by [PolygonalSun](https://github.com/PolygonalSun) ([#14428](https://github.com/BabylonJS/Babylon.js/pull/14428))
- GRL - camera facing - by [RolandCsibrei](https://github.com/RolandCsibrei) ([#14191](https://github.com/BabylonJS/Babylon.js/pull/14191))
- Fix createTexture for R and RG format textures - by [djn24](https://github.com/djn24) ([#14436](https://github.com/BabylonJS/Babylon.js/pull/14436))
- Remove deprecated WebVR - [_Breaking Change_] by [RaananW](https://github.com/RaananW) ([#14439](https://github.com/BabylonJS/Babylon.js/pull/14439))
- proper use filter in getTags function - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14427](https://github.com/BabylonJS/Babylon.js/pull/14427))
- GeometryBufferRenderer: Fix wrong index being returned for the depth and normal textures - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14430](https://github.com/BabylonJS/Babylon.js/pull/14430))
- Polyfill VideoFrame for older versions of typescript - by [RaananW](https://github.com/RaananW) ([#14426](https://github.com/BabylonJS/Babylon.js/pull/14426))
- DefaultRenderingPipeline: Fix pipeline reconstruction - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14425](https://github.com/BabylonJS/Babylon.js/pull/14425))
- WebGPU: support vertex buffers with non multiple of 4 bytes strides - by [Popov72](https://github.com/Popov72) ([#14413](https://github.com/BabylonJS/Babylon.js/pull/14413))
- Fix a legacy issue with older ts versions - by [RaananW](https://github.com/RaananW) ([#14421](https://github.com/BabylonJS/Babylon.js/pull/14421))
- WebGL engine: Add a loseContextOnDispose option - by [Popov72](https://github.com/Popov72) ([#14422](https://github.com/BabylonJS/Babylon.js/pull/14422))
- Flow graphs serialization - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14389](https://github.com/BabylonJS/Babylon.js/pull/14389))
- WebGPU: Fix anisotropy usage when mipmap filtering is nearest - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14420](https://github.com/BabylonJS/Babylon.js/pull/14420))
- Texture: Serialize the noMipmap property - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14419](https://github.com/BabylonJS/Babylon.js/pull/14419))
- Fix render to texture mips - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14418](https://github.com/BabylonJS/Babylon.js/pull/14418))

### GUI

- font inheritance changes - by [carolhmj](https://github.com/carolhmj) ([#14431](https://github.com/BabylonJS/Babylon.js/pull/14431))
- Add flag on ADT to skip blocking certain events - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14438](https://github.com/BabylonJS/Babylon.js/pull/14438))
- P8 Nine Patch clear fix - by [Pryme8](https://github.com/Pryme8) ([#14434](https://github.com/BabylonJS/Babylon.js/pull/14434))
- Add _postMeasure method to GUI Control - by [pandaGaume](https://github.com/pandaGaume) ([#14412](https://github.com/BabylonJS/Babylon.js/pull/14412))

### GUI Editor

- Unification and allowedHosts in local dev - by [RaananW](https://github.com/RaananW) ([#14440](https://github.com/BabylonJS/Babylon.js/pull/14440))

### Node Editor

- Unification and allowedHosts in local dev - by [RaananW](https://github.com/RaananW) ([#14440](https://github.com/BabylonJS/Babylon.js/pull/14440))
- NME: multiple-import Custom Block and Custom Frame - by [onekit-boss](https://github.com/onekit-boss) ([#14409](https://github.com/BabylonJS/Babylon.js/pull/14409))

### Playground

- Unification and allowedHosts in local dev - by [RaananW](https://github.com/RaananW) ([#14440](https://github.com/BabylonJS/Babylon.js/pull/14440))

### Viewer

- Unification and allowedHosts in local dev - by [RaananW](https://github.com/RaananW) ([#14440](https://github.com/BabylonJS/Babylon.js/pull/14440))
- Remove deprecated WebVR - [_Breaking Change_] by [RaananW](https://github.com/RaananW) ([#14439](https://github.com/BabylonJS/Babylon.js/pull/14439))

## 6.24.0

## 6.23.1

### Core

- Log warning in Native when zOffset is not 0 - by [carolhmj](https://github.com/carolhmj) ([#14405](https://github.com/BabylonJS/Babylon.js/pull/14405))
- ArcRotateCamera: Modified zoomOn to use same logic as FramingBehavior - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#14387](https://github.com/BabylonJS/Babylon.js/pull/14387))
- NME: Add support for reflectivity to the PrePassOutput block - by [Popov72](https://github.com/Popov72) ([#14402](https://github.com/BabylonJS/Babylon.js/pull/14402))
- Fix incorrect spelling of `wgslLanguageFeatures` (should be `WGSLLanguageFeatures`) - by [dr-vortex](https://github.com/dr-vortex) ([#14403](https://github.com/BabylonJS/Babylon.js/pull/14403))
- WebGPU: Add labels to buffers + support non float vertex buffers - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#14397](https://github.com/BabylonJS/Babylon.js/pull/14397))
- Prevent possible `Material.dispose()` uncaught exception - by [barroij](https://github.com/barroij) ([#14399](https://github.com/BabylonJS/Babylon.js/pull/14399))
- Fix function assignment - by [RaananW](https://github.com/RaananW) ([#14400](https://github.com/BabylonJS/Babylon.js/pull/14400))
- move bind to Arrow functions - by [RaananW](https://github.com/RaananW) ([#14394](https://github.com/BabylonJS/Babylon.js/pull/14394))
- Allow undefined bufferViews in glTF accessors - by [bghgary](https://github.com/bghgary) ([#14390](https://github.com/BabylonJS/Babylon.js/pull/14390))
- videoTexture serialization - by [RaananW](https://github.com/RaananW) ([#14393](https://github.com/BabylonJS/Babylon.js/pull/14393))
- Remove bodyInfos when a body is removed from the plugin - by [eoineoineoin](https://github.com/eoineoineoin) ([#14388](https://github.com/BabylonJS/Babylon.js/pull/14388))

### GUI Editor

- update dependencies and move to inline sourcemaps for dev - by [RaananW](https://github.com/RaananW) ([#14411](https://github.com/BabylonJS/Babylon.js/pull/14411))

### Loaders

- Allow undefined bufferViews in glTF accessors - by [bghgary](https://github.com/bghgary) ([#14390](https://github.com/BabylonJS/Babylon.js/pull/14390))

### Node Editor

- update dependencies and move to inline sourcemaps for dev - by [RaananW](https://github.com/RaananW) ([#14411](https://github.com/BabylonJS/Babylon.js/pull/14411))
- add Env to NME Preview - by [onekit-boss](https://github.com/onekit-boss) ([#14398](https://github.com/BabylonJS/Babylon.js/pull/14398))

### Playground

- update dependencies and move to inline sourcemaps for dev - by [RaananW](https://github.com/RaananW) ([#14411](https://github.com/BabylonJS/Babylon.js/pull/14411))

### Viewer

- update dependencies and move to inline sourcemaps for dev - by [RaananW](https://github.com/RaananW) ([#14411](https://github.com/BabylonJS/Babylon.js/pull/14411))

## 6.23.0

### Core

- ArcRotateCamera: Modify mapPanning to account for upVector - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#14352](https://github.com/BabylonJS/Babylon.js/pull/14352))
- WebGPU: Sync with the spec - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14384](https://github.com/BabylonJS/Babylon.js/pull/14384))
- Geometry buffer renderer: Add an option to generate normals in world space - by [Popov72](https://github.com/Popov72) ([#14379](https://github.com/BabylonJS/Babylon.js/pull/14379))
- Procedural texture: Allow to pass shader code when creating a procedural texture - by [Popov72](https://github.com/Popov72) ([#14377](https://github.com/BabylonJS/Babylon.js/pull/14377))
- Inspector tweaks for CSM and removing an implicit varying from shadowsFragmentFunctions.fx - by [kircher1](https://github.com/kircher1) ([#14376](https://github.com/BabylonJS/Babylon.js/pull/14376))
- AnimationGroup: Fix onAnimationGroupLoop observable not triggered when mask is not empty - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14372](https://github.com/BabylonJS/Babylon.js/pull/14372))
- Mesh: Add a helper method to draw a mesh given a render pass id - by [Popov72](https://github.com/Popov72) ([#14371](https://github.com/BabylonJS/Babylon.js/pull/14371))

### Inspector

- Inspector tweaks for CSM and removing an implicit varying from shadowsFragmentFunctions.fx - by [kircher1](https://github.com/kircher1) ([#14376](https://github.com/BabylonJS/Babylon.js/pull/14376))

### Loaders

- recreate opaqueRenderTarget if it's needed again for transmission - by [carolhmj](https://github.com/carolhmj) ([#14383](https://github.com/BabylonJS/Babylon.js/pull/14383))

## 6.22.1

### Core

- Gizmos fixes and small improvements - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14365](https://github.com/BabylonJS/Babylon.js/pull/14365))
- OIT: Fix viewport not set correctly - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14367](https://github.com/BabylonJS/Babylon.js/pull/14367))

## 6.22.0

### Core

- flow graphs vector and matrix math - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14357](https://github.com/BabylonJS/Babylon.js/pull/14357))
- Add coordinate transform and constant value blocks - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14333](https://github.com/BabylonJS/Babylon.js/pull/14333))
- flow graph audio blocks - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14356](https://github.com/BabylonJS/Babylon.js/pull/14356))
- add FlowGraphEngine class - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14350](https://github.com/BabylonJS/Babylon.js/pull/14350))
- Move GetTextureDataAsync from inspector to core - by [kircher1](https://github.com/kircher1) ([#14312](https://github.com/BabylonJS/Babylon.js/pull/14312))

### GUI

- fix: correct the comment for resizeToFit - by [wy-luke](https://github.com/wy-luke) ([#14363](https://github.com/BabylonJS/Babylon.js/pull/14363))

### Inspector

- Move GetTextureDataAsync from inspector to core - by [kircher1](https://github.com/kircher1) ([#14312](https://github.com/BabylonJS/Babylon.js/pull/14312))

### Serializers

- Move GetTextureDataAsync from inspector to core - by [kircher1](https://github.com/kircher1) ([#14312](https://github.com/BabylonJS/Babylon.js/pull/14312))

## 6.21.4

### Core


## 6.21.3

### Core

- Flow graph control flow blocks 2 - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14355](https://github.com/BabylonJS/Babylon.js/pull/14355))
- Flow graph control flow nodes - 1 - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14327](https://github.com/BabylonJS/Babylon.js/pull/14327))
- Add bitwise blocks to Flow Graph - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14334](https://github.com/BabylonJS/Babylon.js/pull/14334))
- EquiRectangularCubeTexture: fix load - by [kzhsw](https://github.com/kzhsw) ([#14345](https://github.com/BabylonJS/Babylon.js/pull/14345))
- Animations: Add some animation getter helpers - by [Popov72](https://github.com/Popov72) ([#14344](https://github.com/BabylonJS/Babylon.js/pull/14344))
- CascadedShadowGenerator: Fix shadowMaxZ upper bound checking when using an infinite far camera plane - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14343](https://github.com/BabylonJS/Babylon.js/pull/14343))
- initiateRoomCapture added to plane detection feature - by [RaananW](https://github.com/RaananW) ([#14341](https://github.com/BabylonJS/Babylon.js/pull/14341))
- Use LoadFile only if needed - by [RaananW](https://github.com/RaananW) ([#14340](https://github.com/BabylonJS/Babylon.js/pull/14340))

### Materials


### Node Editor

- Fix to styling of NME and NGE - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14349](https://github.com/BabylonJS/Babylon.js/pull/14349))

## 6.21.2

### Core

- Fixes and enhancements for gizmos - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14316](https://github.com/BabylonJS/Babylon.js/pull/14316))
- fix code doc torotationmatrix - by [carolhmj](https://github.com/carolhmj) ([#14338](https://github.com/BabylonJS/Babylon.js/pull/14338))
- EquiRectangularCubeTexture: load from url only once - by [kzhsw](https://github.com/kzhsw) ([#14330](https://github.com/BabylonJS/Babylon.js/pull/14330))
- Fix PBR transmission in Webgl1 - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14336](https://github.com/BabylonJS/Babylon.js/pull/14336))
- Texture loading: Fix regression with compressed textures not working anymore - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14335](https://github.com/BabylonJS/Babylon.js/pull/14335))
- Flow graph pause animation node - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14332](https://github.com/BabylonJS/Babylon.js/pull/14332))
- Fix instance rendering issue in Babylon Native - by [SergioRZMasson](https://github.com/SergioRZMasson) ([#14331](https://github.com/BabylonJS/Babylon.js/pull/14331))
- Fix lost value - by [deltakosh](https://github.com/deltakosh) ([#14328](https://github.com/BabylonJS/Babylon.js/pull/14328))

### Inspector

- Fixes and enhancements for gizmos - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14316](https://github.com/BabylonJS/Babylon.js/pull/14316))

### Loaders

- STL loader: Fix out of memory when loading big stl files - by [Popov72](https://github.com/Popov72) ([#14326](https://github.com/BabylonJS/Babylon.js/pull/14326))

### Serializers

- Add morph target names to gltf serializer - by [sebavan](https://github.com/sebavan) ([#14329](https://github.com/BabylonJS/Babylon.js/pull/14329))

## 6.21.1

### Core

- Support more native texture formats - by [bghgary](https://github.com/bghgary) ([#14301](https://github.com/BabylonJS/Babylon.js/pull/14301))
- flow graph: arithmetic and logic nodes - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14320](https://github.com/BabylonJS/Babylon.js/pull/14320))
- Distinguish sounds with no soundTrackId from those in soundTrack 0. - [_Bug Fix_] by [bmcbarron](https://github.com/bmcbarron) ([#14324](https://github.com/BabylonJS/Babylon.js/pull/14324))
- Add missing collision and trigger events to IPhysicsEnginePluginV2 in… - by [carolhmj](https://github.com/carolhmj) ([#14323](https://github.com/BabylonJS/Babylon.js/pull/14323))
- Improve Draco decoder processing code - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#14311](https://github.com/BabylonJS/Babylon.js/pull/14311))
- Fix PBR double sided lighting harmonics - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14322](https://github.com/BabylonJS/Babylon.js/pull/14322))
- Mesh: Fix subMesh bounding info when mesh has thin instances - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14309](https://github.com/BabylonJS/Babylon.js/pull/14309))
- Texture: Set type and format at load time - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14314](https://github.com/BabylonJS/Babylon.js/pull/14314))
- fix rayHelper.ts typo - by [djakinho](https://github.com/djakinho) ([#14313](https://github.com/BabylonJS/Babylon.js/pull/14313))
- Make core pass strict lib check - by [alecmev](https://github.com/alecmev) ([#14306](https://github.com/BabylonJS/Babylon.js/pull/14306))
- docs: fix typo (2x "the") - by [PhilippeMorier](https://github.com/PhilippeMorier) ([#14304](https://github.com/BabylonJS/Babylon.js/pull/14304))
- Bump mapping: Fix parallax mapping in right handed mode - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14305](https://github.com/BabylonJS/Babylon.js/pull/14305))

### Loaders

- Improve Draco decoder processing code - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#14311](https://github.com/BabylonJS/Babylon.js/pull/14311))

### Viewer

- fix viewer's animation error when animations has same name - by [cpunion](https://github.com/cpunion) ([#14247](https://github.com/BabylonJS/Babylon.js/pull/14247))

## 6.21.0

### Core

- Fix continuity with teleports - by [deltakosh](https://github.com/deltakosh) ([#14303](https://github.com/BabylonJS/Babylon.js/pull/14303))
- Improve perf of noise texture gen in lens and ssao - by [bghgary](https://github.com/bghgary) ([#14300](https://github.com/BabylonJS/Babylon.js/pull/14300))

## 6.20.2

### Core

- Mark native engine as supporting MSAA - by [bghgary](https://github.com/bghgary) ([#14292](https://github.com/BabylonJS/Babylon.js/pull/14292))
- ReflectionProbe: Add a setter for renderList - by [Popov72](https://github.com/Popov72) ([#14287](https://github.com/BabylonJS/Babylon.js/pull/14287))
- Idempotent disposing of physics bodies and shapes. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14286](https://github.com/BabylonJS/Babylon.js/pull/14286))
- Effect: Call pipelineContext.setUIntX instead of setIntX for the unsigned variants - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14285](https://github.com/BabylonJS/Babylon.js/pull/14285))
- MeshLine: Add support for thin instances - by [Popov72](https://github.com/Popov72) ([#14284](https://github.com/BabylonJS/Babylon.js/pull/14284))

## 6.20.1

### Core

- Animations: Refactor the code that creates additive animations - by [Popov72](https://github.com/Popov72) ([#14278](https://github.com/BabylonJS/Babylon.js/pull/14278))
- WebGPU: Fix having a single occlusion query per mesh per frame - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14274](https://github.com/BabylonJS/Babylon.js/pull/14274))
- WebGPU: Fix warnings when using occlusion queries - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14272](https://github.com/BabylonJS/Babylon.js/pull/14272))
- NME: Fix PBR debug mode - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14271](https://github.com/BabylonJS/Babylon.js/pull/14271))

## 6.20.0

### Core

- Flow graph iteration 0.0.3 - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14261](https://github.com/BabylonJS/Babylon.js/pull/14261))
- Fix texture not ready when parsing NME - by [sebavan](https://github.com/sebavan) ([#14270](https://github.com/BabylonJS/Babylon.js/pull/14270))
- fix action manager disposal when shared - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14267](https://github.com/BabylonJS/Babylon.js/pull/14267))
- Compute shaders: Add support for external (video)  textures - by [Popov72](https://github.com/Popov72) ([#14266](https://github.com/BabylonJS/Babylon.js/pull/14266))
- Screenshots: Fix OffscreenCanvas not supported in older browsers - by [Popov72](https://github.com/Popov72) ([#14265](https://github.com/BabylonJS/Babylon.js/pull/14265))
- Flow graph iteration 0.0.2 - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14140](https://github.com/BabylonJS/Babylon.js/pull/14140))
- Constraints debug view - pivots - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14255](https://github.com/BabylonJS/Babylon.js/pull/14255))
- Pre-pass renderer: Add an option to generate normals in world space - by [Popov72](https://github.com/Popov72) ([#14254](https://github.com/BabylonJS/Babylon.js/pull/14254))
- Fixes Bounty #Generate equirectangular 360 panorama from babylon.js scene - by [lokiiarora](https://github.com/lokiiarora) ([#14251](https://github.com/BabylonJS/Babylon.js/pull/14251))
- Occlusion queries: Use the first camera in the case of multiple cameras - by [Popov72](https://github.com/Popov72) ([#14253](https://github.com/BabylonJS/Babylon.js/pull/14253))
- Performance viewer: Fix crash when object is empty - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14250](https://github.com/BabylonJS/Babylon.js/pull/14250))
- bug Update geometry.ts - by [wayne2006](https://github.com/wayne2006) ([#14252](https://github.com/BabylonJS/Babylon.js/pull/14252))
- RuntimeAnimation: Fix original value used in the bone matrix case - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14249](https://github.com/BabylonJS/Babylon.js/pull/14249))
- FreeCameraTouchInput: Add check for Handedness - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#14238](https://github.com/BabylonJS/Babylon.js/pull/14238))

### Inspector

- Fixes Bounty #Generate equirectangular 360 panorama from babylon.js scene - by [lokiiarora](https://github.com/lokiiarora) ([#14251](https://github.com/BabylonJS/Babylon.js/pull/14251))

### Node Editor


## 6.19.1

### Core

- adding _evt to arc rotate's pointer input - by [RaananW](https://github.com/RaananW) ([#14241](https://github.com/BabylonJS/Babylon.js/pull/14241))
- SolidParticleSystem: Add uvKind option to the digest method - by [Popov72](https://github.com/Popov72) ([#14237](https://github.com/BabylonJS/Babylon.js/pull/14237))

### Node Editor

- fix alignment issue in NME - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14240](https://github.com/BabylonJS/Babylon.js/pull/14240))

## 6.19.0

### Core

- When reusing the same PhysicsConstraint JS object for more than one p… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14223](https://github.com/BabylonJS/Babylon.js/pull/14223))
- Expose collisionEndedObservable to PhysicsBody - by [carolhmj](https://github.com/carolhmj) ([#14234](https://github.com/BabylonJS/Babylon.js/pull/14234))
- Animation groups: Add ClipKeys helper + update inspector - by [Popov72](https://github.com/Popov72) ([#14233](https://github.com/BabylonJS/Babylon.js/pull/14233))
- Don't allow blocks in NME to automatically connect to other blocks in… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14226](https://github.com/BabylonJS/Babylon.js/pull/14226))
- NME: Fix the shadow output of the light blocks - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14207](https://github.com/BabylonJS/Babylon.js/pull/14207))
- a new on XR Camera initialized observable - by [RaananW](https://github.com/RaananW) ([#14231](https://github.com/BabylonJS/Babylon.js/pull/14231))
- Fix aggregate extent calculation when scaling is negative - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14230](https://github.com/BabylonJS/Babylon.js/pull/14230))
- ArcRotateCamera: Modify offset math to correctly zoom to point - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#14209](https://github.com/BabylonJS/Babylon.js/pull/14209))
- WebDeviceInputSystem: Added workaround for MacOS Chromium based Browsers - by [PolygonalSun](https://github.com/PolygonalSun) ([#14210](https://github.com/BabylonJS/Babylon.js/pull/14210))
- PointCloudSystem: Fix uv coordinates used when getting color from texture - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14221](https://github.com/BabylonJS/Babylon.js/pull/14221))
- Procedural texture: Fix the reset method - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14211](https://github.com/BabylonJS/Babylon.js/pull/14211))
- Shadows: Fix shadow light frustum calculation - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14206](https://github.com/BabylonJS/Babylon.js/pull/14206))
- Sound url is not serialised - by [SubratGuptaCtruh](https://github.com/SubratGuptaCtruh) ([#14204](https://github.com/BabylonJS/Babylon.js/pull/14204))
- Make node materials compatible with prepass - by [CraigFeldspar](https://github.com/CraigFeldspar) ([#14014](https://github.com/BabylonJS/Babylon.js/pull/14014))

### GUI

- fix stretch nine patch to respect sourceXXX parameters - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14222](https://github.com/BabylonJS/Babylon.js/pull/14222))

### Inspector

- Animation groups: Add ClipKeys helper + update inspector - by [Popov72](https://github.com/Popov72) ([#14233](https://github.com/BabylonJS/Babylon.js/pull/14233))

### Materials

- NME: Fix the shadow output of the light blocks - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14207](https://github.com/BabylonJS/Babylon.js/pull/14207))
- Ability to not antialias GridMaterial - by [Queatz](https://github.com/Queatz) ([#14212](https://github.com/BabylonJS/Babylon.js/pull/14212))

### Node Editor

- Don't allow blocks in NME to automatically connect to other blocks in… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14226](https://github.com/BabylonJS/Babylon.js/pull/14226))
- * Change the Custom Frame name formatting. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14213](https://github.com/BabylonJS/Babylon.js/pull/14213))
- Make node materials compatible with prepass - by [CraigFeldspar](https://github.com/CraigFeldspar) ([#14014](https://github.com/BabylonJS/Babylon.js/pull/14014))

## 6.18.0

### Core

- Fix computenormals when no normals - by [deltakosh](https://github.com/deltakosh) ([#14198](https://github.com/BabylonJS/Babylon.js/pull/14198))
- Fixed from/to issues in sprite anim - by [RolandCsibrei](https://github.com/RolandCsibrei) ([#14190](https://github.com/BabylonJS/Babylon.js/pull/14190))

## 6.17.1

### Core

- Particle Systems: Fix the pivot position for rotations - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14186](https://github.com/BabylonJS/Babylon.js/pull/14186))
- Bones: Fix wrong world matrix for meshes attached to bone - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14185](https://github.com/BabylonJS/Babylon.js/pull/14185))
- Add extra safety on audio - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#14180](https://github.com/BabylonJS/Babylon.js/pull/14180))
- Fix mute button getting stuck on iOS - [_Bug Fix_] by [docEdub](https://github.com/docEdub) ([#14178](https://github.com/BabylonJS/Babylon.js/pull/14178))
- Greased line plugin: Fix crash when cloning the material - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14179](https://github.com/BabylonJS/Babylon.js/pull/14179))
- Fix initial audio engine unlock state - [_Bug Fix_] by [docEdub](https://github.com/docEdub) ([#14177](https://github.com/BabylonJS/Babylon.js/pull/14177))
- WebDeviceInputSystem: Add additional checks for pointermove started Touch events - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#14174](https://github.com/BabylonJS/Babylon.js/pull/14174))

### Inspector


## 6.17.0

### Core

- Added `getLinearVelocity` and `getAngularVelocity` to PhysicsBody - by [BarthPaleologue](https://github.com/BarthPaleologue) ([#14166](https://github.com/BabylonJS/Babylon.js/pull/14166))
- Scale and Offset For NGE Noise - by [Pryme8](https://github.com/Pryme8) ([#14170](https://github.com/BabylonJS/Babylon.js/pull/14170))
- AnimationGroup: Add masking support - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#14119](https://github.com/BabylonJS/Babylon.js/pull/14119))
- Particle Systems: Fix display in wireframe mode - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14165](https://github.com/BabylonJS/Babylon.js/pull/14165))

## 6.16.2

### Core

- Add more control over UV for text builder - by [deltakosh](https://github.com/deltakosh) ([#14168](https://github.com/BabylonJS/Babylon.js/pull/14168))
- More descriptive names for the AxesViewer's materials - by [carolhmj](https://github.com/carolhmj) ([#14160](https://github.com/BabylonJS/Babylon.js/pull/14160))
- Fix equals issue + bad debug node rendering - by [deltakosh](https://github.com/deltakosh) ([#14164](https://github.com/BabylonJS/Babylon.js/pull/14164))

### GUI

- GUI InputTextArea: Fix inserting character in long string (wrapped) - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14167](https://github.com/BabylonJS/Babylon.js/pull/14167))

## 6.16.1

### Core

- GRL - added simple greased line material - by [RolandCsibrei](https://github.com/RolandCsibrei) ([#14154](https://github.com/BabylonJS/Babylon.js/pull/14154))
- Add registerclass for decalmapconfiguration - by [RaananW](https://github.com/RaananW) ([#14156](https://github.com/BabylonJS/Babylon.js/pull/14156))
- Node geometry - by [deltakosh](https://github.com/deltakosh) ([#14141](https://github.com/BabylonJS/Babylon.js/pull/14141))
- Bone IK controller: Make sure the absolute matrices are up to date - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14151](https://github.com/BabylonJS/Babylon.js/pull/14151))
- Call the validateDrag function on planeDragGizmo - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14150](https://github.com/BabylonJS/Babylon.js/pull/14150))
- Fix exposing options of MeshDebugPluginMaterial - by [alexchuber](https://github.com/alexchuber) ([#14139](https://github.com/BabylonJS/Babylon.js/pull/14139))

### Inspector

- Node geometry - by [deltakosh](https://github.com/deltakosh) ([#14141](https://github.com/BabylonJS/Babylon.js/pull/14141))

### Node Editor

- Node geometry - by [deltakosh](https://github.com/deltakosh) ([#14141](https://github.com/BabylonJS/Babylon.js/pull/14141))

## 6.16.0

### Core

- Shadow generators: Add support for red channel only for the shadow map texture - by [Popov72](https://github.com/Popov72) ([#14148](https://github.com/BabylonJS/Babylon.js/pull/14148))
- Scene dispose: Fix endless loop when stopping animations - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14147](https://github.com/BabylonJS/Babylon.js/pull/14147))
- PostProcess: Fix crash when detaching and reattaching a camera from/to a render pipeline - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14146](https://github.com/BabylonJS/Babylon.js/pull/14146))

## 6.15.0

### Core

- Regexp fix - match until first semicolon - by [RaananW](https://github.com/RaananW) ([#14144](https://github.com/BabylonJS/Babylon.js/pull/14144))
- Skeleton: make sure a cloned skeleton is ready to use - by [Popov72](https://github.com/Popov72) ([#14142](https://github.com/BabylonJS/Babylon.js/pull/14142))
- Scene is optional in these cases - by [RaananW](https://github.com/RaananW) ([#14143](https://github.com/BabylonJS/Babylon.js/pull/14143))
- Flow graph initial iteration - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14091](https://github.com/BabylonJS/Babylon.js/pull/14091))
- Node Geometry core - [_New Feature_] by [deltakosh](https://github.com/deltakosh) ([#14136](https://github.com/BabylonJS/Babylon.js/pull/14136))
- Clean up mesh.actionManager attribute when it is disposed of. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14138](https://github.com/BabylonJS/Babylon.js/pull/14138))
- GPUParticleSystem: Fix context lost management - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14135](https://github.com/BabylonJS/Babylon.js/pull/14135))
- Fix sourcemaps compilation in es6 modules - by [RaananW](https://github.com/RaananW) ([#14134](https://github.com/BabylonJS/Babylon.js/pull/14134))
- Fix inconsistencies with `useSRGBBuffer` in native engine - by [bghgary](https://github.com/bghgary) ([#14124](https://github.com/BabylonJS/Babylon.js/pull/14124))
- Check that textures not in sRGB are put into sRGB for debug modes - by [alexchuber](https://github.com/alexchuber) ([#14125](https://github.com/BabylonJS/Babylon.js/pull/14125))
- HDR filtering: Fix state reset - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14132](https://github.com/BabylonJS/Babylon.js/pull/14132))
- Clear transform node's physicsBody attribute when that is disposed - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14133](https://github.com/BabylonJS/Babylon.js/pull/14133))
- Add observable for collision finished events/trigger events - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14109](https://github.com/BabylonJS/Babylon.js/pull/14109))
- Expose options of MeshDebugPluginMaterial - by [alexchuber](https://github.com/alexchuber) ([#14127](https://github.com/BabylonJS/Babylon.js/pull/14127))
- GRL - dealing with right handed coordinate system - by [RolandCsibrei](https://github.com/RolandCsibrei) ([#14128](https://github.com/BabylonJS/Babylon.js/pull/14128))
- If a child mesh from an AssetContainer is added to the scene without … - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14123](https://github.com/BabylonJS/Babylon.js/pull/14123))
- Don't deduce stride size in rollback function of PrepareMeshForTrianglesAndVerticesMode - by [alexchuber](https://github.com/alexchuber) ([#14122](https://github.com/BabylonJS/Babylon.js/pull/14122))
- Add populateRootNodes in asset container and loading - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14101](https://github.com/BabylonJS/Babylon.js/pull/14101))
- PostProcessRenderEffect: Fix the enable method - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14116](https://github.com/BabylonJS/Babylon.js/pull/14116))
- Gizmos fixes - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14118](https://github.com/BabylonJS/Babylon.js/pull/14118))
- Textures: Fix clearing of textures with integer type - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14112](https://github.com/BabylonJS/Babylon.js/pull/14112))
- Parsing of GLSL shaders in WebGPU: Fix detection of varyings - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14117](https://github.com/BabylonJS/Babylon.js/pull/14117))
- Add support for teleport nodes in NME - [_New Feature_] by [deltakosh](https://github.com/deltakosh) ([#14115](https://github.com/BabylonJS/Babylon.js/pull/14115))
- Decal map: don't renderer particle systems in the decal map texture - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14114](https://github.com/BabylonJS/Babylon.js/pull/14114))
- Shaders: Don't inject fragment output declaration if already existing - by [Popov72](https://github.com/Popov72) ([#14108](https://github.com/BabylonJS/Babylon.js/pull/14108))
- Add setTargetTransform on body - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14110](https://github.com/BabylonJS/Babylon.js/pull/14110))
- Cancel any pending animation frames on stopRenderLoop - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14102](https://github.com/BabylonJS/Babylon.js/pull/14102))
- Material plugins: Add support for #include resolution - by [Popov72](https://github.com/Popov72) ([#14106](https://github.com/BabylonJS/Babylon.js/pull/14106))
- Pass pick result to triggers missing it. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14111](https://github.com/BabylonJS/Babylon.js/pull/14111))

### Node Editor

- Node Geometry core - [_New Feature_] by [deltakosh](https://github.com/deltakosh) ([#14136](https://github.com/BabylonJS/Babylon.js/pull/14136))
- Add support for teleport nodes in NME - [_New Feature_] by [deltakosh](https://github.com/deltakosh) ([#14115](https://github.com/BabylonJS/Babylon.js/pull/14115))

## 6.14.1

### Core

- Document parameter ranges of HSVtoRGBToRef() - by [Atsutakemura](https://github.com/Atsutakemura) ([#14099](https://github.com/BabylonJS/Babylon.js/pull/14099))
- Make wireframes of MeshDebugPluginMaterial unshaded - by [alexchuber](https://github.com/alexchuber) ([#14094](https://github.com/BabylonJS/Babylon.js/pull/14094))
- Enable texture float rendering in native engine - by [bghgary](https://github.com/bghgary) ([#14096](https://github.com/BabylonJS/Babylon.js/pull/14096))
- Fix inertia view of parented bodies - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14093](https://github.com/BabylonJS/Babylon.js/pull/14093))
- Effect renderer: Restore the right values for the depth and stencil states - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14092](https://github.com/BabylonJS/Babylon.js/pull/14092))

## 6.14.0

### Core

- Making data Nullable for RawTexture3D and RawTexture2DArray - by [christianphalv](https://github.com/christianphalv) ([#14072](https://github.com/BabylonJS/Babylon.js/pull/14072))
- Improved quaternion application - by [infusion](https://github.com/infusion) ([#14075](https://github.com/BabylonJS/Babylon.js/pull/14075))
- SpotLight: Fix projection texture matrix not computed in world space - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14080](https://github.com/BabylonJS/Babylon.js/pull/14080))
- NME: Generate code for "mode" property - by [Popov72](https://github.com/Popov72) ([#14079](https://github.com/BabylonJS/Babylon.js/pull/14079))
- fix imports - by [RaananW](https://github.com/RaananW) ([#14078](https://github.com/BabylonJS/Babylon.js/pull/14078))
- Change throw to log for native update RTT samples - by [bghgary](https://github.com/bghgary) ([#14071](https://github.com/BabylonJS/Babylon.js/pull/14071))
- Raw textures: Add creationFlags parameter for 3D and 2DArray texture creation - by [Popov72](https://github.com/Popov72) ([#14070](https://github.com/BabylonJS/Babylon.js/pull/14070))
- AnimationGroup: add enableBlending method - by [Popov72](https://github.com/Popov72) ([#14068](https://github.com/BabylonJS/Babylon.js/pull/14068))
- Physics spring constraint - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#14061](https://github.com/BabylonJS/Babylon.js/pull/14061))

### GUI


### GUI Editor

- overlay needs to be a part of the client object - by [RaananW](https://github.com/RaananW) ([#14087](https://github.com/BabylonJS/Babylon.js/pull/14087))
- introduce DISABLE_DEV_OVERLAY flag - by [RaananW](https://github.com/RaananW) ([#14077](https://github.com/BabylonJS/Babylon.js/pull/14077))

### Node Editor

- overlay needs to be a part of the client object - by [RaananW](https://github.com/RaananW) ([#14087](https://github.com/BabylonJS/Babylon.js/pull/14087))
- introduce DISABLE_DEV_OVERLAY flag - by [RaananW](https://github.com/RaananW) ([#14077](https://github.com/BabylonJS/Babylon.js/pull/14077))

### Playground

- overlay needs to be a part of the client object - by [RaananW](https://github.com/RaananW) ([#14087](https://github.com/BabylonJS/Babylon.js/pull/14087))
- introduce DISABLE_DEV_OVERLAY flag - by [RaananW](https://github.com/RaananW) ([#14077](https://github.com/BabylonJS/Babylon.js/pull/14077))

### Viewer

- overlay needs to be a part of the client object - by [RaananW](https://github.com/RaananW) ([#14087](https://github.com/BabylonJS/Babylon.js/pull/14087))
- introduce DISABLE_DEV_OVERLAY flag - by [RaananW](https://github.com/RaananW) ([#14077](https://github.com/BabylonJS/Babylon.js/pull/14077))

## 6.13.0

### Core

- FreeCameraMouseInput: Reset Active pointerId when detaching controls - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#14065](https://github.com/BabylonJS/Babylon.js/pull/14065))
- AnimationGroup: Add MergeAnimationGroups method - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#14062](https://github.com/BabylonJS/Babylon.js/pull/14062))

## 6.12.5

### Core

- Basic native support of MSAA for render targets - by [bghgary](https://github.com/bghgary) ([#14055](https://github.com/BabylonJS/Babylon.js/pull/14055))
- Animations: Add support for animatable and animation group ordering - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#14052](https://github.com/BabylonJS/Babylon.js/pull/14052))

## 6.12.4

### Core

- Add new Material Plugin for various mesh debug visualizations - [_New Feature_] by [alexchuber](https://github.com/alexchuber) ([#14020](https://github.com/BabylonJS/Babylon.js/pull/14020))
- Animations: Add a weight property to AnimationGroup - by [Popov72](https://github.com/Popov72) ([#14057](https://github.com/BabylonJS/Babylon.js/pull/14057))
- Screenshot tools: Fallback on regular canvas if offscreen canvas not supported - by [Popov72](https://github.com/Popov72) ([#14059](https://github.com/BabylonJS/Babylon.js/pull/14059))
- Fix loading skeletons using ImportMesh when the skeleton id is not a number. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14054](https://github.com/BabylonJS/Babylon.js/pull/14054))
- fix `Bone.returnToRest()`, `Bone.updateMatrix()` does not work properly - [_Bug Fix_] by [noname0310](https://github.com/noname0310) ([#14051](https://github.com/BabylonJS/Babylon.js/pull/14051))
- ParticleSystem: Fix update function when particle array is not internal array - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14053](https://github.com/BabylonJS/Babylon.js/pull/14053))

### GUI

- Fix invalidateRect of a Rectangle Control with thickness - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14058](https://github.com/BabylonJS/Babylon.js/pull/14058))

## 6.12.3

### Core

- Fix setting spatial sound option to false - [_Bug Fix_] by [docEdub](https://github.com/docEdub) ([#14048](https://github.com/BabylonJS/Babylon.js/pull/14048))

## 6.12.2

### Core

- Shaders: Fix shader parsing - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14049](https://github.com/BabylonJS/Babylon.js/pull/14049))

## 6.12.1

### Core

- Fix sound pileup issue - [_Bug Fix_] by [docEdub](https://github.com/docEdub) ([#14047](https://github.com/BabylonJS/Babylon.js/pull/14047))

## 6.12.0

### Core

- Fix SerializeMesh method to account for non-mesh ob… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14041](https://github.com/BabylonJS/Babylon.js/pull/14041))
- Input transformation should be applied during the XR loop - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#14037](https://github.com/BabylonJS/Babylon.js/pull/14037))
- ShaderCodeCursor. Optimization of lines parsing - by [Dok11](https://github.com/Dok11) ([#13935](https://github.com/BabylonJS/Babylon.js/pull/13935))
- Effect layer stencil - by [kv-bh](https://github.com/kv-bh) ([#14046](https://github.com/BabylonJS/Babylon.js/pull/14046))
- Skeleton viewer bug - by [newbeea](https://github.com/newbeea) ([#14039](https://github.com/BabylonJS/Babylon.js/pull/14039))
- DeviceEventFactory: Modified event factory to provide correct value for buttons property (part deux) - by [PolygonalSun](https://github.com/PolygonalSun) ([#14043](https://github.com/BabylonJS/Babylon.js/pull/14043))
- GRL - resolution added - by [RolandCsibrei](https://github.com/RolandCsibrei) ([#14031](https://github.com/BabylonJS/Babylon.js/pull/14031))
- Fixes for includeChildMeshes:true when constructing physics shapes - by [eoineoineoin](https://github.com/eoineoineoin) ([#14030](https://github.com/BabylonJS/Babylon.js/pull/14030))
- Add the missing loaders tests - by [RaananW](https://github.com/RaananW) ([#14012](https://github.com/BabylonJS/Babylon.js/pull/14012))
- Fix for invalidated TypedArray objects preventing mesh construction - [_Bug Fix_] by [eoineoineoin](https://github.com/eoineoineoin) ([#14040](https://github.com/BabylonJS/Babylon.js/pull/14040))
- GPU particle systems: Fix current active count - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14036](https://github.com/BabylonJS/Babylon.js/pull/14036))

### Loaders

- Add the missing loaders tests - by [RaananW](https://github.com/RaananW) ([#14012](https://github.com/BabylonJS/Babylon.js/pull/14012))

## 6.11.2

### Core

- Material: Adds a property to define the relative order in which decals and detailed maps are rendered - by [Popov72](https://github.com/Popov72) ([#14025](https://github.com/BabylonJS/Babylon.js/pull/14025))

## 6.11.1

### Core

- getter/setter aproach - by [RolandCsibrei](https://github.com/RolandCsibrei) ([#13997](https://github.com/BabylonJS/Babylon.js/pull/13997))
- Picking: Fix ray picking when using reverse depth buffer - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14027](https://github.com/BabylonJS/Babylon.js/pull/14027))
- GPU Particle systems: Fix BILLBOARDMODE_STRETCHED - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14026](https://github.com/BabylonJS/Babylon.js/pull/14026))

### Inspector

- When changing relevant properties on the Camera, Light an… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14028](https://github.com/BabylonJS/Babylon.js/pull/14028))

## 6.11.0

### Core

- Transform LTS to support ESM transformations - by [RaananW](https://github.com/RaananW) ([#14018](https://github.com/BabylonJS/Babylon.js/pull/14018))
- Reset body and body index on PhysicsRaycastResult - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14022](https://github.com/BabylonJS/Babylon.js/pull/14022))
- Engine: Fix crash when disposing effect or engine while shader compiled in parallel - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14021](https://github.com/BabylonJS/Babylon.js/pull/14021))
- Avoid cloning physics body twice and set body properties when cloning - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#14019](https://github.com/BabylonJS/Babylon.js/pull/14019))
- MorphTargetManager: Fix creation of texture when partial support for morph types - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#14017](https://github.com/BabylonJS/Babylon.js/pull/14017))
- Add bump map debug mode and remove extraneous return - by [alexchuber](https://github.com/alexchuber) ([#14011](https://github.com/BabylonJS/Babylon.js/pull/14011))

### GUI

- Transform LTS to support ESM transformations - by [RaananW](https://github.com/RaananW) ([#14018](https://github.com/BabylonJS/Babylon.js/pull/14018))

### Inspector

- Add bump map debug mode and remove extraneous return - by [alexchuber](https://github.com/alexchuber) ([#14011](https://github.com/BabylonJS/Babylon.js/pull/14011))

### Loaders

- Transform LTS to support ESM transformations - by [RaananW](https://github.com/RaananW) ([#14018](https://github.com/BabylonJS/Babylon.js/pull/14018))

### Materials

- Transform LTS to support ESM transformations - by [RaananW](https://github.com/RaananW) ([#14018](https://github.com/BabylonJS/Babylon.js/pull/14018))
- Water material: Add removeFromRenderList method - by [Popov72](https://github.com/Popov72) ([#14023](https://github.com/BabylonJS/Babylon.js/pull/14023))

### Procedural Textures

- Transform LTS to support ESM transformations - by [RaananW](https://github.com/RaananW) ([#14018](https://github.com/BabylonJS/Babylon.js/pull/14018))

### Serializers

- Transform LTS to support ESM transformations - by [RaananW](https://github.com/RaananW) ([#14018](https://github.com/BabylonJS/Babylon.js/pull/14018))

## 6.10.0

### Core

- Refactoring of the Bone class - by [Popov72](https://github.com/Popov72) ([#14007](https://github.com/BabylonJS/Babylon.js/pull/14007))
- Add raycast filtering to physics engine interface - by [carolhmj](https://github.com/carolhmj) ([#13998](https://github.com/BabylonJS/Babylon.js/pull/13998))
- Improve convertToUnIndexedMesh and convertToFlatShadedMesh vertex data handling with support for morph targets - [_New Feature_] by [alexchuber](https://github.com/alexchuber) ([#14002](https://github.com/BabylonJS/Babylon.js/pull/14002))
- needMoveForGravity public access - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14006](https://github.com/BabylonJS/Babylon.js/pull/14006))
- Optimized mesh.subdivide function by delaying the BB refresh to once … - by [JonathanIcon](https://github.com/JonathanIcon) ([#13999](https://github.com/BabylonJS/Babylon.js/pull/13999))
- Gizmo+inspector world/local coordinates switch - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14001](https://github.com/BabylonJS/Babylon.js/pull/14001))
- CubeTexture: Fix parsing when name has been overwritten - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13996](https://github.com/BabylonJS/Babylon.js/pull/13996))
- Input manager :  PointerEvent pick with boundingBox - by [deltakosh](https://github.com/deltakosh) ([#13988](https://github.com/BabylonJS/Babylon.js/pull/13988))
- docs: improve EnvironmentHelper docstring - by [yedpodtrzitko](https://github.com/yedpodtrzitko) ([#13995](https://github.com/BabylonJS/Babylon.js/pull/13995))

### Inspector

- Gizmo+inspector world/local coordinates switch - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#14001](https://github.com/BabylonJS/Babylon.js/pull/14001))

### Loaders

- Refactoring of the Bone class - by [Popov72](https://github.com/Popov72) ([#14007](https://github.com/BabylonJS/Babylon.js/pull/14007))

## 6.9.0

### Core

- Call the onInitial observable in AR mode as well - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#13993](https://github.com/BabylonJS/Babylon.js/pull/13993))
- SSR: Fix crash when using a PBR material in glossiness/specular mode - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13992](https://github.com/BabylonJS/Babylon.js/pull/13992))
- Move away from declare type - by [RaananW](https://github.com/RaananW) ([#13990](https://github.com/BabylonJS/Babylon.js/pull/13990))
- GreasedLineTools.GetPointsFromText - by [RolandCsibrei](https://github.com/RolandCsibrei) ([#13989](https://github.com/BabylonJS/Babylon.js/pull/13989))

### Playground

- fix for the monaco editor - by [RaananW](https://github.com/RaananW) ([#13991](https://github.com/BabylonJS/Babylon.js/pull/13991))

## 6.8.1

### Core

- Allow Add, Divide, Subtract and Multiply Node to use float as second … - by [deltakosh](https://github.com/deltakosh) ([#13987](https://github.com/BabylonJS/Babylon.js/pull/13987))
- use exec instead of matchAll while keeping structure - by [RaananW](https://github.com/RaananW) ([#13986](https://github.com/BabylonJS/Babylon.js/pull/13986))
- GreasedLine - [_New Feature_] by [RolandCsibrei](https://github.com/RolandCsibrei) ([#13840](https://github.com/BabylonJS/Babylon.js/pull/13840))
- changeable epsilon for (typeof Quaternion).FromUnitVectorsToRef - by [nekochanoide](https://github.com/nekochanoide) ([#13983](https://github.com/BabylonJS/Babylon.js/pull/13983))
- Typescript 5.1 For core - by [RaananW](https://github.com/RaananW) ([#13975](https://github.com/BabylonJS/Babylon.js/pull/13975))
- VideoTexture: Revert changes - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13985](https://github.com/BabylonJS/Babylon.js/pull/13985))
- InputManager: Move-based Picking not working with SpriteManager and specific flag - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13982](https://github.com/BabylonJS/Babylon.js/pull/13982))
- Update animationGroup.ts - by [aWeirdo](https://github.com/aWeirdo) ([#13971](https://github.com/BabylonJS/Babylon.js/pull/13971))
- Add Vector2/3/4 tests - by [dr-vortex](https://github.com/dr-vortex) ([#13973](https://github.com/BabylonJS/Babylon.js/pull/13973))
- NME: Add support for sampler types to CustomBlock - by [Popov72](https://github.com/Popov72) ([#13974](https://github.com/BabylonJS/Babylon.js/pull/13974))
- Decal: Fix crash when the mesh is an instanced mesh - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13976](https://github.com/BabylonJS/Babylon.js/pull/13976))
- Materials: Add support for plugins when cloning materials - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13978](https://github.com/BabylonJS/Babylon.js/pull/13978))
- Add parameter to control jpg/webp quality of screenshots - by [kircher1](https://github.com/kircher1) ([#13972](https://github.com/BabylonJS/Babylon.js/pull/13972))
- "Does not exist" view in PBR debug mode - by [alexchuber](https://github.com/alexchuber) ([#13969](https://github.com/BabylonJS/Babylon.js/pull/13969))
- Material: Add serialization and parsing of material plugins - by [Popov72](https://github.com/Popov72) ([#13970](https://github.com/BabylonJS/Babylon.js/pull/13970))
- Fix typo computeBonesUsingShaders default value - by [noname0310](https://github.com/noname0310) ([#13965](https://github.com/BabylonJS/Babylon.js/pull/13965))
- Raycast filtering - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#13966](https://github.com/BabylonJS/Babylon.js/pull/13966))
- Add debug mode to show albedo texture's alpha channel - [_New Feature_] by [alexchuber](https://github.com/alexchuber) ([#13953](https://github.com/BabylonJS/Babylon.js/pull/13953))

### GUI

- Typescript 5.1 For core - by [RaananW](https://github.com/RaananW) ([#13975](https://github.com/BabylonJS/Babylon.js/pull/13975))

### GUI Editor

- Typescript 5.1 For core - by [RaananW](https://github.com/RaananW) ([#13975](https://github.com/BabylonJS/Babylon.js/pull/13975))

### Inspector

- Typescript 5.1 For core - by [RaananW](https://github.com/RaananW) ([#13975](https://github.com/BabylonJS/Babylon.js/pull/13975))
- Add debug mode to show albedo texture's alpha channel - [_New Feature_] by [alexchuber](https://github.com/alexchuber) ([#13953](https://github.com/BabylonJS/Babylon.js/pull/13953))

### Loaders

- Typescript 5.1 For core - by [RaananW](https://github.com/RaananW) ([#13975](https://github.com/BabylonJS/Babylon.js/pull/13975))

### Materials

- Typescript 5.1 For core - by [RaananW](https://github.com/RaananW) ([#13975](https://github.com/BabylonJS/Babylon.js/pull/13975))
- Water material: Fix support for mesh instances - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13968](https://github.com/BabylonJS/Babylon.js/pull/13968))

### Node Editor

- Typescript 5.1 For core - by [RaananW](https://github.com/RaananW) ([#13975](https://github.com/BabylonJS/Babylon.js/pull/13975))

### Playground

- Typescript 5.1 For core - by [RaananW](https://github.com/RaananW) ([#13975](https://github.com/BabylonJS/Babylon.js/pull/13975))
- Add recast to downloadable playgrounds - by [RaananW](https://github.com/RaananW) ([#13980](https://github.com/BabylonJS/Babylon.js/pull/13980))

### Procedural Textures

- Typescript 5.1 For core - by [RaananW](https://github.com/RaananW) ([#13975](https://github.com/BabylonJS/Babylon.js/pull/13975))

### Serializers

- Typescript 5.1 For core - by [RaananW](https://github.com/RaananW) ([#13975](https://github.com/BabylonJS/Babylon.js/pull/13975))

### Viewer

- Typescript 5.1 For core - by [RaananW](https://github.com/RaananW) ([#13975](https://github.com/BabylonJS/Babylon.js/pull/13975))

## 6.8.0

### Core

- When opening NME from PG, use the PG's scene clear color - by [carolhmj](https://github.com/carolhmj) ([#13962](https://github.com/BabylonJS/Babylon.js/pull/13962))
- Allow removing an observer without knowing its observable - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#13964](https://github.com/BabylonJS/Babylon.js/pull/13964))
- Add NativeEngine enableScissor and disableScissor - [_New Feature_] by [docEdub](https://github.com/docEdub) ([#13960](https://github.com/BabylonJS/Babylon.js/pull/13960))
- Fix an issue with NME canvas resizing - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#13961](https://github.com/BabylonJS/Babylon.js/pull/13961))
- Allows colour changes from bboxrenderer observers - by [aaloksg](https://github.com/aaloksg) ([#13956](https://github.com/BabylonJS/Babylon.js/pull/13956))
- First version of Space Warp support - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#13955](https://github.com/BabylonJS/Babylon.js/pull/13955))
- Added ArrayBufferView to possible input types to load scene content. - [_Breaking Change_] by [SergioRZMasson](https://github.com/SergioRZMasson) ([#13946](https://github.com/BabylonJS/Babylon.js/pull/13946))
- Use addFunction to add MultiMaterial to a scene - by [noname0310](https://github.com/noname0310) ([#13957](https://github.com/BabylonJS/Babylon.js/pull/13957))
- Add same parameters from AbstractMesh.intersects to Ray.intersectsMesh - by [carolhmj](https://github.com/carolhmj) ([#13954](https://github.com/BabylonJS/Babylon.js/pull/13954))
- Fix warning on copying a mesh with physics body - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13951](https://github.com/BabylonJS/Babylon.js/pull/13951))
- Shader define expression optimization - by [Dok11](https://github.com/Dok11) ([#13936](https://github.com/BabylonJS/Babylon.js/pull/13936))
- Fix FluidRenderer required side effects. - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13948](https://github.com/BabylonJS/Babylon.js/pull/13948))
- Add function to ShaderMaterial for setting defines at run time - by [kircher1](https://github.com/kircher1) ([#13932](https://github.com/BabylonJS/Babylon.js/pull/13932))
- Shader processor include optimization - by [Dok11](https://github.com/Dok11) ([#13934](https://github.com/BabylonJS/Babylon.js/pull/13934))
- Add glossiness, base color, specular color, and emissive color to material debug modes - [_New Feature_] by [alexchuber](https://github.com/alexchuber) ([#13947](https://github.com/BabylonJS/Babylon.js/pull/13947))

### GUI

- Fix fixedRatioMasterIsWidth not being preserved on the GUI Editor - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13958](https://github.com/BabylonJS/Babylon.js/pull/13958))

### GUI Editor

- Add isVisible property on the common control properties … - by [carolhmj](https://github.com/carolhmj) ([#13952](https://github.com/BabylonJS/Babylon.js/pull/13952))

### Inspector

- When opening NME from PG, use the PG's scene clear color - by [carolhmj](https://github.com/carolhmj) ([#13962](https://github.com/BabylonJS/Babylon.js/pull/13962))
- Add glossiness, base color, specular color, and emissive color to material debug modes - [_New Feature_] by [alexchuber](https://github.com/alexchuber) ([#13947](https://github.com/BabylonJS/Babylon.js/pull/13947))

### Loaders

- Added ArrayBufferView to possible input types to load scene content. - [_Breaking Change_] by [SergioRZMasson](https://github.com/SergioRZMasson) ([#13946](https://github.com/BabylonJS/Babylon.js/pull/13946))
- Fix mtl loader being ignored - by [deltakosh](https://github.com/deltakosh) ([#13950](https://github.com/BabylonJS/Babylon.js/pull/13950))

### Materials

- Tri-planar material: Fix uniform scaling - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13949](https://github.com/BabylonJS/Babylon.js/pull/13949))

### Node Editor

- When opening NME from PG, use the PG's scene clear color - by [carolhmj](https://github.com/carolhmj) ([#13962](https://github.com/BabylonJS/Babylon.js/pull/13962))

## 6.7.0

### Core

- Stop baking LH to RH in glTF serializer - [_Breaking Change_] by [bghgary](https://github.com/bghgary) ([#13909](https://github.com/BabylonJS/Babylon.js/pull/13909))

### GUI Editor

- Fix Control item being draggable while renaming - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13942](https://github.com/BabylonJS/Babylon.js/pull/13942))

### Inspector

- Avoid crashes with bad name/id assignments - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13941](https://github.com/BabylonJS/Babylon.js/pull/13941))

### Loaders

- Stop baking LH to RH in glTF serializer - [_Breaking Change_] by [bghgary](https://github.com/bghgary) ([#13909](https://github.com/BabylonJS/Babylon.js/pull/13909))

### Materials

- Tri-planar material: Add support for non uniform scaling - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13943](https://github.com/BabylonJS/Babylon.js/pull/13943))

### Serializers

- Stop baking LH to RH in glTF serializer - [_Breaking Change_] by [bghgary](https://github.com/bghgary) ([#13909](https://github.com/BabylonJS/Babylon.js/pull/13909))

## 6.6.1

### Core

- Revert changes from PR 13927 - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13938](https://github.com/BabylonJS/Babylon.js/pull/13938))
- WebGPU: Add support for post processes written in WGSL - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13937](https://github.com/BabylonJS/Babylon.js/pull/13937))
- Add anchor options for gizmos - by [MBecherKurz](https://github.com/MBecherKurz) ([#13933](https://github.com/BabylonJS/Babylon.js/pull/13933))
- DeviceEventFactory: Modified event factory to provide correct value for buttons property - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13927](https://github.com/BabylonJS/Babylon.js/pull/13927))
- Better handling of parented bodies - by [carolhmj](https://github.com/carolhmj) ([#13914](https://github.com/BabylonJS/Babylon.js/pull/13914))
- fix anisotropic texture debug mode - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13931](https://github.com/BabylonJS/Babylon.js/pull/13931))
- Fix to instantiateModelsToScene - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13929](https://github.com/BabylonJS/Babylon.js/pull/13929))

### GUI Editor

- Fix conversion from % to px throwing error - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13930](https://github.com/BabylonJS/Babylon.js/pull/13930))

### Loaders

- OBJ loader: add support for lines - by [deltakosh](https://github.com/deltakosh) ([#13928](https://github.com/BabylonJS/Babylon.js/pull/13928))

## 6.6.0

### Core

- Create snapshot of a scene not using the main canvas fails - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#13925](https://github.com/BabylonJS/Babylon.js/pull/13925))

## 6.5.1

### Core

- Fix type checking for mesh parameter in aggregate - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13919](https://github.com/BabylonJS/Babylon.js/pull/13919))
- Havok Physics Plugin: Fix applied impulse in Collision Event - [_Bug Fix_] by [RaggarDK](https://github.com/RaggarDK) ([#13918](https://github.com/BabylonJS/Babylon.js/pull/13918))
- SSR: add the useFresnel property to generate more physically accurate results - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13917](https://github.com/BabylonJS/Babylon.js/pull/13917))
- Physics fix getEventMask - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13913](https://github.com/BabylonJS/Babylon.js/pull/13913))
- Shader processor optimization - by [Dok11](https://github.com/Dok11) ([#13912](https://github.com/BabylonJS/Babylon.js/pull/13912))
- Bone look controller: Add useAbsoluteValueForYaw property - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13911](https://github.com/BabylonJS/Babylon.js/pull/13911))
- Fix sound distance not respecting Scene `audioListenerProvider` when set - [_Bug Fix_] by [docEdub](https://github.com/docEdub) ([#13910](https://github.com/BabylonJS/Babylon.js/pull/13910))
- WebGPU: Support the flat qualifier on varyings - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13908](https://github.com/BabylonJS/Babylon.js/pull/13908))
- Effect layer: Intensity also affects emissive color - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13906](https://github.com/BabylonJS/Babylon.js/pull/13906))
- Pre-pass renderer: Fix bloom and depth renderer - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13905](https://github.com/BabylonJS/Babylon.js/pull/13905))
- Add earcut entry point - by [deltakosh](https://github.com/deltakosh) ([#13902](https://github.com/BabylonJS/Babylon.js/pull/13902))
- Fix typo in files input class - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#13903](https://github.com/BabylonJS/Babylon.js/pull/13903))
- Yoyo loop mode for animations - by [deltakosh](https://github.com/deltakosh) ([#13901](https://github.com/BabylonJS/Babylon.js/pull/13901))
- Asset manager needs addAnimationTask to load animation only files - by [deltakosh](https://github.com/deltakosh) ([#13900](https://github.com/BabylonJS/Babylon.js/pull/13900))
- Scene: Make sure the layers are ready in scene.isReady - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13896](https://github.com/BabylonJS/Babylon.js/pull/13896))
- MultiRenderTarget: Fix texture size calculation - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13895](https://github.com/BabylonJS/Babylon.js/pull/13895))
- Add GLTF Anisotropy extension. - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#13894](https://github.com/BabylonJS/Babylon.js/pull/13894))

### Inspector

- Inspector fix parenting - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13915](https://github.com/BabylonJS/Babylon.js/pull/13915))
- Add Backspace key to delete keyframe so it works on Mac - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13904](https://github.com/BabylonJS/Babylon.js/pull/13904))
- Prevent crashing when a mesh's name is of the wrong type. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13893](https://github.com/BabylonJS/Babylon.js/pull/13893))
- Add GLTF Anisotropy extension. - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#13894](https://github.com/BabylonJS/Babylon.js/pull/13894))

### Loaders

- Add GLTF Anisotropy extension. - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#13894](https://github.com/BabylonJS/Babylon.js/pull/13894))

### Serializers

- Add GLTF Anisotropy extension. - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#13894](https://github.com/BabylonJS/Babylon.js/pull/13894))

## 6.5.0

### Core

- Shadows: Fix CSM in infinite far plane mode - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13892](https://github.com/BabylonJS/Babylon.js/pull/13892))
- Pre-Pass renderer: Fix scene.isReady when using the prepass renderer - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13888](https://github.com/BabylonJS/Babylon.js/pull/13888))
- RenderTargetTexture: Fix render pass ids when resizing the texture - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13889](https://github.com/BabylonJS/Babylon.js/pull/13889))
- Mesh: Fix billboards in right-handed systems - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13885](https://github.com/BabylonJS/Babylon.js/pull/13885))
- WebGPU: Allow to pass to a compute shader the gpu buffer used in a bundle to render instances - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13881](https://github.com/BabylonJS/Babylon.js/pull/13881))
- Curve interpolation node - [_New Feature_] by [deltakosh](https://github.com/deltakosh) ([#13878](https://github.com/BabylonJS/Babylon.js/pull/13878))

### GUI

- Fix the underline/strike-through line to use the color of the text when there is no outline. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13890](https://github.com/BabylonJS/Babylon.js/pull/13890))
- Babylon Gui Editor, Free corner radius - by [J3F31](https://github.com/J3F31) ([#13835](https://github.com/BabylonJS/Babylon.js/pull/13835))

### GUI Editor

- Babylon Gui Editor, Free corner radius - by [J3F31](https://github.com/J3F31) ([#13835](https://github.com/BabylonJS/Babylon.js/pull/13835))

### Node Editor

- Curve interpolation node - [_New Feature_] by [deltakosh](https://github.com/deltakosh) ([#13878](https://github.com/BabylonJS/Babylon.js/pull/13878))

### Serializers

- STL export multiple meshes - by [Bulisor](https://github.com/Bulisor) ([#13886](https://github.com/BabylonJS/Babylon.js/pull/13886))

## 6.4.1

### Core

- Adds a new MeshBuilder function to create 3D Text - [_New Feature_] by [deltakosh](https://github.com/deltakosh) ([#13876](https://github.com/BabylonJS/Babylon.js/pull/13876))
- WebGPU: Fix errors when using float32 textures in materials - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13874](https://github.com/BabylonJS/Babylon.js/pull/13874))

## 6.4.0

### Core

- WebGPU: add support for new texture formats - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13871](https://github.com/BabylonJS/Babylon.js/pull/13871))
- Fix Scene performance counters - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13870](https://github.com/BabylonJS/Babylon.js/pull/13870))
- Physics: Add debug inertia view - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#13853](https://github.com/BabylonJS/Babylon.js/pull/13853))
- Allow `scene.audioListenerPositionProvider` to be set to null - [_Bug Fix_] by [docEdub](https://github.com/docEdub) ([#13864](https://github.com/BabylonJS/Babylon.js/pull/13864))
- core not supported in declare module - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#13869](https://github.com/BabylonJS/Babylon.js/pull/13869))
- WebGPU: Fix morphTargetTextureIndices overwritting morphTargetTextureInfo - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13868](https://github.com/BabylonJS/Babylon.js/pull/13868))
- Material plugin: Fix cleaning when engine is disposed - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13866](https://github.com/BabylonJS/Babylon.js/pull/13866))
- add `enabledFeatures` to the session manager - by [RaananW](https://github.com/RaananW) ([#13863](https://github.com/BabylonJS/Babylon.js/pull/13863))
- Sprite: Fix picking when angle is not zero - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13860](https://github.com/BabylonJS/Babylon.js/pull/13860))
- Fix bug where constraint perp axes were ignored - [_Bug Fix_] by [eoineoineoin](https://github.com/eoineoineoin) ([#13859](https://github.com/BabylonJS/Babylon.js/pull/13859))
- Decal: Add support for thin instances - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13857](https://github.com/BabylonJS/Babylon.js/pull/13857))
- ArcRotateCamera: Account for offset when using zoom to mouse location - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13856](https://github.com/BabylonJS/Babylon.js/pull/13856))
- DecalMap: Fix the isReady function - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13855](https://github.com/BabylonJS/Babylon.js/pull/13855))

### Node Editor

- Node Material Editor: Allow loading GLTF format files in preview window, add drag and drop, revert to cube when loading fails - by [carolhmj](https://github.com/carolhmj) ([#13842](https://github.com/BabylonJS/Babylon.js/pull/13842))

### Playground

- Material plugin: Fix cleaning when engine is disposed - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13866](https://github.com/BabylonJS/Babylon.js/pull/13866))

## 6.3.1

### Core

- Fix Dump tools clamping - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13850](https://github.com/BabylonJS/Babylon.js/pull/13850))
- SSR: Make the jitter centered - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13848](https://github.com/BabylonJS/Babylon.js/pull/13848))
- Make sure not to add rootUrl to data URLs when parsing textures - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#13847](https://github.com/BabylonJS/Babylon.js/pull/13847))
- Add texture LOD input to NME TextureBlock - by [MiikaH](https://github.com/MiikaH) ([#13846](https://github.com/BabylonJS/Babylon.js/pull/13846))
- Fix Required dependency in HTMLElementTexture - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13844](https://github.com/BabylonJS/Babylon.js/pull/13844))
- Fix polynomials not being ready in PBR and env - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13845](https://github.com/BabylonJS/Babylon.js/pull/13845))
- Fix video texture bootstrap data. - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13843](https://github.com/BabylonJS/Babylon.js/pull/13843))

## 6.3.0

### Core

- Video: Fix video not played when using multiple videos in a shader - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13841](https://github.com/BabylonJS/Babylon.js/pull/13841))
- Gizmo, Physics fixes - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13827](https://github.com/BabylonJS/Babylon.js/pull/13827))
- Use getBoundingClientRect instead of width - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#13830](https://github.com/BabylonJS/Babylon.js/pull/13830))
- Update dependencies, move to sass away from node-sass - by [RaananW](https://github.com/RaananW) ([#13825](https://github.com/BabylonJS/Babylon.js/pull/13825))
- NME Triplanar block: Add a switch to better project the textures in the case of a cube - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13833](https://github.com/BabylonJS/Babylon.js/pull/13833))
- Fix Asset Container typings - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13805](https://github.com/BabylonJS/Babylon.js/pull/13805))
- Update havokPlugin.ts - by [RaananW](https://github.com/RaananW) ([#13829](https://github.com/BabylonJS/Babylon.js/pull/13829))
- Add option to material cloning to not clone the same texture multiple times - [_Breaking Change_] by [carolhmj](https://github.com/carolhmj) ([#13807](https://github.com/BabylonJS/Babylon.js/pull/13807))
- Add max value clamping and preserve colors options to CubeMapToSphericalPolynomialTools - by [MiikaH](https://github.com/MiikaH) ([#13809](https://github.com/BabylonJS/Babylon.js/pull/13809))
- PBR: Fix refraction texture in right handed system - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13818](https://github.com/BabylonJS/Babylon.js/pull/13818))
- Fix BABYLON.Tools.DumpData ignoring the `fileName` parameter. - by [kv-bh](https://github.com/kv-bh) ([#13817](https://github.com/BabylonJS/Babylon.js/pull/13817))
- WebGPU: Fix MSAA texture release - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13823](https://github.com/BabylonJS/Babylon.js/pull/13823))
- WebGPU: Fix viewport reset too often - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13816](https://github.com/BabylonJS/Babylon.js/pull/13816))
- Add set/getGravityFactor to PhysicsBody - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#13811](https://github.com/BabylonJS/Babylon.js/pull/13811))
- Reset raycast result when no hit - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13815](https://github.com/BabylonJS/Babylon.js/pull/13815))

### GUI Editor

- Update dependencies, move to sass away from node-sass - by [RaananW](https://github.com/RaananW) ([#13825](https://github.com/BabylonJS/Babylon.js/pull/13825))
- adds save and load single control - by [YifeiShi99](https://github.com/YifeiShi99) ([#13812](https://github.com/BabylonJS/Babylon.js/pull/13812))

### Inspector

- Update dependencies, move to sass away from node-sass - by [RaananW](https://github.com/RaananW) ([#13825](https://github.com/BabylonJS/Babylon.js/pull/13825))

### Node Editor

- Update dependencies, move to sass away from node-sass - by [RaananW](https://github.com/RaananW) ([#13825](https://github.com/BabylonJS/Babylon.js/pull/13825))

### Playground

- Update dependencies, move to sass away from node-sass - by [RaananW](https://github.com/RaananW) ([#13825](https://github.com/BabylonJS/Babylon.js/pull/13825))
- make sure PG load correctly on safari - by [RaananW](https://github.com/RaananW) ([#13832](https://github.com/BabylonJS/Babylon.js/pull/13832))

### Viewer

- Update dependencies, move to sass away from node-sass - by [RaananW](https://github.com/RaananW) ([#13825](https://github.com/BabylonJS/Babylon.js/pull/13825))

## 6.2.0

### Core

- HDRCubeTexture: Fix texture being ready too soon - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13810](https://github.com/BabylonJS/Babylon.js/pull/13810))
- cylinder/capsule size computation fix - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13808](https://github.com/BabylonJS/Babylon.js/pull/13808))
- GamepadManager: Fixed issue where providing scene object to constructor would prevent status updates - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13798](https://github.com/BabylonJS/Babylon.js/pull/13798))
- OIT: Fix wrong prepass state when mesh visibility changes - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13802](https://github.com/BabylonJS/Babylon.js/pull/13802))
- Dump Tools: Use an offscreen canvas - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13803](https://github.com/BabylonJS/Babylon.js/pull/13803))
- Update havokPlugin.ts - [_Bug Fix_] by [aWeirdo](https://github.com/aWeirdo) ([#13783](https://github.com/BabylonJS/Babylon.js/pull/13783))
- PickingInfo: Handle unindexed meshes in getNormal - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13780](https://github.com/BabylonJS/Babylon.js/pull/13780))
- OIT: Fix wrong prepass state when material transparency changes - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13781](https://github.com/BabylonJS/Babylon.js/pull/13781))
- Node Material Editor: Fix automatic creation of inputs for "sourceY" … - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13773](https://github.com/BabylonJS/Babylon.js/pull/13773))
- Fix for RTT rendering in an XR session - by [RaananW](https://github.com/RaananW) ([#13777](https://github.com/BabylonJS/Babylon.js/pull/13777))
- Physics: Fix aggregate size calculation and allow passing box rotatio… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13778](https://github.com/BabylonJS/Babylon.js/pull/13778))

### GUI

- Fix GUI cloning - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13806](https://github.com/BabylonJS/Babylon.js/pull/13806))

### Inspector

- Inspector: METADATA pop-up window feature - by [j-te](https://github.com/j-te) ([#13671](https://github.com/BabylonJS/Babylon.js/pull/13671))

### Playground

- allow ts playground in full and frame - by [RaananW](https://github.com/RaananW) ([#13804](https://github.com/BabylonJS/Babylon.js/pull/13804))

## 6.1.0

### Core

- Fix typing to fit ts 4 and ts 5 - by [RaananW](https://github.com/RaananW) ([#13772](https://github.com/BabylonJS/Babylon.js/pull/13772))
- Animation: Fix animation.runtimeAnimations array not cleaned up on stop - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13774](https://github.com/BabylonJS/Babylon.js/pull/13774))
- Add possibility to apply supersampling when generating HDRCubeTexture() - by [MiikaH](https://github.com/MiikaH) ([#13766](https://github.com/BabylonJS/Babylon.js/pull/13766))
- Effect Layer: Set intensity of effect per mesh - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13768](https://github.com/BabylonJS/Babylon.js/pull/13768))
- Add NME MeshAttributeExistsBlock - [_New Feature_] by [MiikaH](https://github.com/MiikaH) ([#13727](https://github.com/BabylonJS/Babylon.js/pull/13727))
- SSR: Fix ghosting when using large step values - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13767](https://github.com/BabylonJS/Babylon.js/pull/13767))
- PrePass renderer: Save memory by using a Red format for the depth texture - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13753](https://github.com/BabylonJS/Babylon.js/pull/13753))

### Node Editor

- Add NME MeshAttributeExistsBlock - [_New Feature_] by [MiikaH](https://github.com/MiikaH) ([#13727](https://github.com/BabylonJS/Babylon.js/pull/13727))

### Playground

- add havok to download mode - by [RaananW](https://github.com/RaananW) ([#13764](https://github.com/BabylonJS/Babylon.js/pull/13764))

## 6.0.0

### Core

- Small fix for webxr declaration (consistency) - by [RaananW](https://github.com/RaananW) ([#13758](https://github.com/BabylonJS/Babylon.js/pull/13758))
- WebGPU: MultiRenderTarget extended support - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13751](https://github.com/BabylonJS/Babylon.js/pull/13751))

### Playground


## 5.57.1

### Core

- no premature result mutation for Vec2.rotateToRef - by [nekochanoide](https://github.com/nekochanoide) ([#13748](https://github.com/BabylonJS/Babylon.js/pull/13748))

### GUI

- Round values coming from grid width calculation to avoid gaps between… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13743](https://github.com/BabylonJS/Babylon.js/pull/13743))

### Serializers

- Fix GLTF export of ambient texture with texture transforms - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13746](https://github.com/BabylonJS/Babylon.js/pull/13746))

## 5.57.0

### Core

- Compute shader: Fix wrong ubo bound to the shader in some cases - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13745](https://github.com/BabylonJS/Babylon.js/pull/13745))
- Clip planes defines perf - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13742](https://github.com/BabylonJS/Babylon.js/pull/13742))
- Adding no-op setters to instancedMesh - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#13744](https://github.com/BabylonJS/Babylon.js/pull/13744))
- BoundingInfo: Fix encapsulateBoundingInfo method - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13741](https://github.com/BabylonJS/Babylon.js/pull/13741))

## 5.56.0

### Core

- Engine: Rollback changes because of perf problems - by [Popov72](https://github.com/Popov72) ([#13740](https://github.com/BabylonJS/Babylon.js/pull/13740))
- Fix Imports - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13738](https://github.com/BabylonJS/Babylon.js/pull/13738))
- HDRFiltering: Fix final cube texture not having the right type - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13737](https://github.com/BabylonJS/Babylon.js/pull/13737))
- CascadedShadowMaps: Allows setting min and max number of cascades - by [Popov72](https://github.com/Popov72) ([#13739](https://github.com/BabylonJS/Babylon.js/pull/13739))
- Highlight layer: Fix wrong stencil state - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13734](https://github.com/BabylonJS/Babylon.js/pull/13734))
- Post Process: Add a property to clear the buffer even when alpha blending is enabled - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13736](https://github.com/BabylonJS/Babylon.js/pull/13736))
- Sprite manager: Force the sampling mode in pixel perfect mode - by [Popov72](https://github.com/Popov72) ([#13733](https://github.com/BabylonJS/Babylon.js/pull/13733))

### Serializers

- fix import path - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13735](https://github.com/BabylonJS/Babylon.js/pull/13735))

## 5.55.0

### Core

- GPU particle system: Fix particles not rendered in water PG - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13728](https://github.com/BabylonJS/Babylon.js/pull/13728))
- Add option to keep context menu entries open, but close them by default. - by [carolhmj](https://github.com/carolhmj) ([#13725](https://github.com/BabylonJS/Babylon.js/pull/13725))
- Inspector. Add custom items to context menus or override them - by [Dok11](https://github.com/Dok11) ([#13721](https://github.com/BabylonJS/Babylon.js/pull/13721))
- Fix asset Container crash with predicate - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13720](https://github.com/BabylonJS/Babylon.js/pull/13720))
- Morph targets: Workaround for Mali-G72 and morph target texture - by [Popov72](https://github.com/Popov72) ([#13717](https://github.com/BabylonJS/Babylon.js/pull/13717))
- Add overrideRenderingFillMode property to Mesh - by [sebavan](https://github.com/sebavan) ([#13708](https://github.com/BabylonJS/Babylon.js/pull/13708))
- Fluid renderer: Fix alpha not preserved - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13716](https://github.com/BabylonJS/Babylon.js/pull/13716))

### GUI

- Pass clipContent/clipChildren down to Grid's internal containers - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13715](https://github.com/BabylonJS/Babylon.js/pull/13715))
- Round up ideal width/height calculations so no control is cut off - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13724](https://github.com/BabylonJS/Babylon.js/pull/13724))

### GUI Editor


### Inspector

- Prevent previous element props to be selected - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13732](https://github.com/BabylonJS/Babylon.js/pull/13732))
- Add option to keep context menu entries open, but close them by default. - by [carolhmj](https://github.com/carolhmj) ([#13725](https://github.com/BabylonJS/Babylon.js/pull/13725))
- Inspector. Add custom items to context menus or override them - by [Dok11](https://github.com/Dok11) ([#13721](https://github.com/BabylonJS/Babylon.js/pull/13721))
- Inspector. Custom context menu for additional nodes - by [Dok11](https://github.com/Dok11) ([#13719](https://github.com/BabylonJS/Babylon.js/pull/13719))

### Procedural Textures


### Serializers

- glTF exporter: Fix warning message - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13729](https://github.com/BabylonJS/Babylon.js/pull/13729))
- Add overrideRenderingFillMode property to Mesh - by [sebavan](https://github.com/sebavan) ([#13708](https://github.com/BabylonJS/Babylon.js/pull/13708))

## 5.54.0

### Core

- Fix scene recorder - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13707](https://github.com/BabylonJS/Babylon.js/pull/13707))
- Make trailmesh diameter public - by [sebavan](https://github.com/sebavan) ([#13706](https://github.com/BabylonJS/Babylon.js/pull/13706))

## 5.53.1

### Core

- PBR: Fix crash when enabling/disabling anisotropy - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13705](https://github.com/BabylonJS/Babylon.js/pull/13705))
- feat: support formats option for multirendertarget - by [newbeea](https://github.com/newbeea) ([#13678](https://github.com/BabylonJS/Babylon.js/pull/13678))
- Reflection Probe: Fix Z inversion in right handed system - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13704](https://github.com/BabylonJS/Babylon.js/pull/13704))
- Screenshot: Add finalWidth and finalHeight to the size object - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13702](https://github.com/BabylonJS/Babylon.js/pull/13702))
- Animation: Fix infinite loop when mutating scene._activeAnimatables - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13703](https://github.com/BabylonJS/Babylon.js/pull/13703))
- Properly dispose of default rendering pipeline in the postProcessRend… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13698](https://github.com/BabylonJS/Babylon.js/pull/13698))
- NativeEngine: Override updateRenderTargetTextureSampleCount to prevent crashes - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13697](https://github.com/BabylonJS/Babylon.js/pull/13697))
- Add inspector option for DepthOfFieldBlurLevel - by [kircher1](https://github.com/kircher1) ([#13694](https://github.com/BabylonJS/Babylon.js/pull/13694))
- WebGPU: synchronize with Spec / multiple improvements and fixes - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13691](https://github.com/BabylonJS/Babylon.js/pull/13691))
- MultiRenderTarget extended support - by [Orikson](https://github.com/Orikson) ([#13435](https://github.com/BabylonJS/Babylon.js/pull/13435))

### GUI

- Fixes to Grid behaviors in GUI Editor - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13649](https://github.com/BabylonJS/Babylon.js/pull/13649))

### GUI Editor

- Fixes to Grid behaviors in GUI Editor - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13649](https://github.com/BabylonJS/Babylon.js/pull/13649))

### Inspector

- Properly dispose of default rendering pipeline in the postProcessRend… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13698](https://github.com/BabylonJS/Babylon.js/pull/13698))
- Add inspector option for DepthOfFieldBlurLevel - by [kircher1](https://github.com/kircher1) ([#13694](https://github.com/BabylonJS/Babylon.js/pull/13694))
- Inspector. Particle System. Fix broken links to the documentation - [_Bug Fix_] by [Dok11](https://github.com/Dok11) ([#13695](https://github.com/BabylonJS/Babylon.js/pull/13695))
- MultiRenderTarget extended support - by [Orikson](https://github.com/Orikson) ([#13435](https://github.com/BabylonJS/Babylon.js/pull/13435))

### Loaders

- Fix bug with glTF accessor min/max code - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#13696](https://github.com/BabylonJS/Babylon.js/pull/13696))

### Playground

- Playground download: Make sure that the canvas area occupies 100% of the surface. - by [Popov72](https://github.com/Popov72) ([#13701](https://github.com/BabylonJS/Babylon.js/pull/13701))
- WebGPU: synchronize with Spec / multiple improvements and fixes - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13691](https://github.com/BabylonJS/Babylon.js/pull/13691))

## 5.53.0

### Core

- Fix stopAllAnimatables stop loop order. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13683](https://github.com/BabylonJS/Babylon.js/pull/13683))
- Allow FilesInput to append to scene (instead of creating a new one) - by [RaananW](https://github.com/RaananW) ([#13686](https://github.com/BabylonJS/Babylon.js/pull/13686))
- Clear internal instance containers in Mesh when disposed - by [RaananW](https://github.com/RaananW) ([#13685](https://github.com/BabylonJS/Babylon.js/pull/13685))
- Scene optimizer: Don't merge meshes without positions - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13684](https://github.com/BabylonJS/Babylon.js/pull/13684))
- Material plugins: Add support for uniform array - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13681](https://github.com/BabylonJS/Babylon.js/pull/13681))
- Frustum: Add IsPointInFrustum helper - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13679](https://github.com/BabylonJS/Babylon.js/pull/13679))
- Respect options.powerPreference without doNotHandleContextLost flag - [_Bug Fix_] by [afrokick](https://github.com/afrokick) ([#13680](https://github.com/BabylonJS/Babylon.js/pull/13680))
- glTF exporter: Fix export with instances - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13677](https://github.com/BabylonJS/Babylon.js/pull/13677))
- Engine: Modified isPointerLock to update when called instead of during pointerlockchange event - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13650](https://github.com/BabylonJS/Babylon.js/pull/13650))
- PickingInfo getTextureCoordinates: Allow to choose the uv set - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13673](https://github.com/BabylonJS/Babylon.js/pull/13673))
- Display teleport ray in red color when intersecting with pickBlockerMeshes - by [RaananW](https://github.com/RaananW) ([#13668](https://github.com/BabylonJS/Babylon.js/pull/13668))
- WebDeviceInputSystem: Add pointerId to WheelEvents when dispatching to InputManager - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13661](https://github.com/BabylonJS/Babylon.js/pull/13661))

### GUI

- Fix word wrap ellipsis algorithm. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13669](https://github.com/BabylonJS/Babylon.js/pull/13669))
- Use Matrix.IdentityReadonly instead of Matrix.Identity() for a couple of GUI math operations - [_Bug Fix_] by [kircher1](https://github.com/kircher1) ([#13666](https://github.com/BabylonJS/Babylon.js/pull/13666))

### GUI Editor

- Fix GUI Editor not saving Control observables - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13682](https://github.com/BabylonJS/Babylon.js/pull/13682))

### Inspector

- Inspector: Fix crash when changing edges color - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13664](https://github.com/BabylonJS/Babylon.js/pull/13664))

### Loaders

- Transmission helper: Fix opaque meshes being rendered two times - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13676](https://github.com/BabylonJS/Babylon.js/pull/13676))

### Playground

- Playground: Make more PGs work after download - by [Popov72](https://github.com/Popov72) ([#13670](https://github.com/BabylonJS/Babylon.js/pull/13670))
- Playground: Fix engine displayed when using ?webgpu - by [RaananW](https://github.com/RaananW) ([#13665](https://github.com/BabylonJS/Babylon.js/pull/13665))

### Serializers

- glTF exporter: Fix export with instances - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13677](https://github.com/BabylonJS/Babylon.js/pull/13677))

## 5.52.0

### Core

- Improved SSAO2 when samples <16. Added more control over SSAO2 denoising filter. - by [fooware](https://github.com/fooware) ([#13621](https://github.com/BabylonJS/Babylon.js/pull/13621))
- Improved SSAO2 for sample count <16 - by [fooware](https://github.com/fooware) ([#13652](https://github.com/BabylonJS/Babylon.js/pull/13652))
- Observable: Fix wrong value returned by hasObservers - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13655](https://github.com/BabylonJS/Babylon.js/pull/13655))
- Add iridescence configuration to PBR material cloning - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13657](https://github.com/BabylonJS/Babylon.js/pull/13657))
- Check if the node exists before adding to the list of nodes to sort. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13640](https://github.com/BabylonJS/Babylon.js/pull/13640))
- Improve how we delete massive group of animatables from animationgroup - by [deltakosh](https://github.com/deltakosh) ([#13641](https://github.com/BabylonJS/Babylon.js/pull/13641))
- GPU particle system: Fix problem when using color gradients - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13646](https://github.com/BabylonJS/Babylon.js/pull/13646))
- NME SceneDepthBlock: Add support for storeCameraSpaceZ property - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13638](https://github.com/BabylonJS/Babylon.js/pull/13638))
- Fix env texture creation from gamma space - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13642](https://github.com/BabylonJS/Babylon.js/pull/13642))
- Sprites: Add pixel perfect mode - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13636](https://github.com/BabylonJS/Babylon.js/pull/13636))
- Clear an extra 1-pixel border around the virtual puck - by [RaananW](https://github.com/RaananW) ([#13639](https://github.com/BabylonJS/Babylon.js/pull/13639))

### GUI

- Button3D: Allow setting the dimensions at creation time - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13637](https://github.com/BabylonJS/Babylon.js/pull/13637))
- Fix a condition in _moveToProjectedPosition causing bugs with linked TextBlocks - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13634](https://github.com/BabylonJS/Babylon.js/pull/13634))

### GUI Editor

- Allow local dev using IPs - by [RaananW](https://github.com/RaananW) ([#13648](https://github.com/BabylonJS/Babylon.js/pull/13648))

### Inspector

- Improved SSAO2 when samples <16. Added more control over SSAO2 denoising filter. - by [fooware](https://github.com/fooware) ([#13621](https://github.com/BabylonJS/Babylon.js/pull/13621))

### Node Editor

- Allow local dev using IPs - by [RaananW](https://github.com/RaananW) ([#13648](https://github.com/BabylonJS/Babylon.js/pull/13648))
- NME SceneDepthBlock: Add support for storeCameraSpaceZ property - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13638](https://github.com/BabylonJS/Babylon.js/pull/13638))

### Playground

- Allow local dev using IPs - by [RaananW](https://github.com/RaananW) ([#13648](https://github.com/BabylonJS/Babylon.js/pull/13648))

### Serializers

- Add shouldExportAnimation option on GLTF exporter to filter out animations - by [carolhmj](https://github.com/carolhmj) ([#13659](https://github.com/BabylonJS/Babylon.js/pull/13659))

## 5.51.0

### Core

- On SceneRecorder, use the same parsing method as the decorators to en… - by [carolhmj](https://github.com/carolhmj) ([#13626](https://github.com/BabylonJS/Babylon.js/pull/13626))
- Adds: keysRotateUp/keysRotateDown (Free Camera) - by [Nawarius](https://github.com/Nawarius) ([#13628](https://github.com/BabylonJS/Babylon.js/pull/13628))
- Import fix for UMD modules typing - by [RaananW](https://github.com/RaananW) ([#13624](https://github.com/BabylonJS/Babylon.js/pull/13624))
- KTX container: Improve error handling when texture format not supported - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13620](https://github.com/BabylonJS/Babylon.js/pull/13620))
- SSAO2: Fix expensive blur that could not be disabled - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13617](https://github.com/BabylonJS/Babylon.js/pull/13617))
- Fixing an issue with follow camera and physics - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#13618](https://github.com/BabylonJS/Babylon.js/pull/13618))
- InputManager: Modified Logic for ExclusiveDoubleClickMode For Click/DoubleClick Mutual Exclusivity - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13582](https://github.com/BabylonJS/Babylon.js/pull/13582))
- Leak Fix - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13616](https://github.com/BabylonJS/Babylon.js/pull/13616))

### GUI

- adt.useInvalidateRectOptimization using scale incorrectly when toggling visibility and redrawing invalidated parts of canvas - by [RaananW](https://github.com/RaananW) ([#13627](https://github.com/BabylonJS/Babylon.js/pull/13627))
- Fix pointer out event on 3D GUI in XR (mobile ar) - by [RaananW](https://github.com/RaananW) ([#13625](https://github.com/BabylonJS/Babylon.js/pull/13625))

### Inspector


### Loaders

- Stl Loader Less Restrictive - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13623](https://github.com/BabylonJS/Babylon.js/pull/13623))
- Leak Fix - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13616](https://github.com/BabylonJS/Babylon.js/pull/13616))

### Node Editor

- Dragging a port and dropping on the same port throws a console error … - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#13630](https://github.com/BabylonJS/Babylon.js/pull/13630))

## 5.50.1

### Core

- Only set last notified value if the feature is on - by [RaananW](https://github.com/RaananW) ([#13613](https://github.com/BabylonJS/Babylon.js/pull/13613))
- fix declaration - by [RaananW](https://github.com/RaananW) ([#13614](https://github.com/BabylonJS/Babylon.js/pull/13614))
- Set back the checkReadyOnlyOnce when reverting performance mode - by [RaananW](https://github.com/RaananW) ([#13612](https://github.com/BabylonJS/Babylon.js/pull/13612))
- PBR material in Inspector: Fix debug split and factor - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13611](https://github.com/BabylonJS/Babylon.js/pull/13611))

### GUI

- Fix horizontal StackPanel width calculation when a child has forceRes… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13610](https://github.com/BabylonJS/Babylon.js/pull/13610))

## 5.50.0

### Core

- NME: Add missing extra indice and weight matrices blocks - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13600](https://github.com/BabylonJS/Babylon.js/pull/13600))
- Mesh: Fix crash with instanced rendering - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13608](https://github.com/BabylonJS/Babylon.js/pull/13608))
- NME Texture block: Add support for 2DArrayTexture - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13598](https://github.com/BabylonJS/Babylon.js/pull/13598))

### Node Editor

- NME: Add missing extra indice and weight matrices blocks - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13600](https://github.com/BabylonJS/Babylon.js/pull/13600))
- NME Texture block: Add support for 2DArrayTexture - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13598](https://github.com/BabylonJS/Babylon.js/pull/13598))

## 5.49.2

### Core

- Fix weird linting issues that slipped past CI - by [bghgary](https://github.com/bghgary) ([#13606](https://github.com/BabylonJS/Babylon.js/pull/13606))
- Asynchronous shader compilation in Babylon Native - by [glangstonb](https://github.com/glangstonb) ([#13587](https://github.com/BabylonJS/Babylon.js/pull/13587))

## 5.49.1

### Core

- spriteManagers array is optional - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#13603](https://github.com/BabylonJS/Babylon.js/pull/13603))
- correct rotation application in RHS - by [RaananW](https://github.com/RaananW) ([#13596](https://github.com/BabylonJS/Babylon.js/pull/13596))
- RTT: Use same logic for particle systems than in the main path - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13588](https://github.com/BabylonJS/Babylon.js/pull/13588))
- Particle systems: Fix crash when setting updateInAnimate to true - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13589](https://github.com/BabylonJS/Babylon.js/pull/13589))
- SSR2: Fix local cubemap support - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13592](https://github.com/BabylonJS/Babylon.js/pull/13592))
- Geometry Buffer Renderer: Fix specular color not in linear space - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13593](https://github.com/BabylonJS/Babylon.js/pull/13593))
- Add Left/RightHandedBackwardReadOnly vectors - by [kv-ep](https://github.com/kv-ep) ([#13586](https://github.com/BabylonJS/Babylon.js/pull/13586))
- Clean up and improve logic for instantiating nodes in AssetContainer.… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13584](https://github.com/BabylonJS/Babylon.js/pull/13584))
- Implementation of WebXR Depth Sensing Feature - by [drumath2237](https://github.com/drumath2237) ([#13159](https://github.com/BabylonJS/Babylon.js/pull/13159))
- Implementation of WebXR Depth Sensing Feature - by [drumath2237](https://github.com/drumath2237) ([#13563](https://github.com/BabylonJS/Babylon.js/pull/13563))
- Decals: Add Decal Map support - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13562](https://github.com/BabylonJS/Babylon.js/pull/13562))
- Fluid renderer: Fix stencil usage - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13579](https://github.com/BabylonJS/Babylon.js/pull/13579))

### GUI Editor

- Fix connected controls being unset when opening the editor - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13580](https://github.com/BabylonJS/Babylon.js/pull/13580))

### Inspector

- Inspector: Add missing support for inspectableCustomProperties - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13599](https://github.com/BabylonJS/Babylon.js/pull/13599))
- Decals: Add Decal Map support - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13562](https://github.com/BabylonJS/Babylon.js/pull/13562))

### Serializers

- Don't export bones of nodes that are not exported. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13604](https://github.com/BabylonJS/Babylon.js/pull/13604))

## 5.49.0

### Core

- InputManager: Fix scenario where click can occur when ExclusiveDoubleClickMode = true - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13577](https://github.com/BabylonJS/Babylon.js/pull/13577))
- PointerDragBehavior: Added check to force releaseDrag to fire when no active button is present - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13578](https://github.com/BabylonJS/Babylon.js/pull/13578))

## 5.48.1

### Core

- Update wrapNativeTexture and wrapWebGLTexture with explicit hasMipMaps and samplingMode - by [bghgary](https://github.com/bghgary) ([#13574](https://github.com/BabylonJS/Babylon.js/pull/13574))
- Add URL filter to the securitypolicyviolation event handler - by [kv-bh](https://github.com/kv-bh) ([#13570](https://github.com/BabylonJS/Babylon.js/pull/13570))
- Fix adaptToDeviceRatio for native engine - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#13575](https://github.com/BabylonJS/Babylon.js/pull/13575))
- Notify added observer if observable was triggered. - by [RaananW](https://github.com/RaananW) ([#13565](https://github.com/BabylonJS/Babylon.js/pull/13565))
- Always pass default KTX2 decoder options - [_Bug Fix_] by [jure](https://github.com/jure) ([#13568](https://github.com/BabylonJS/Babylon.js/pull/13568))
- Fix Skeleton Bounding Box Timing issue - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13561](https://github.com/BabylonJS/Babylon.js/pull/13561))
- fix tag assignment when copying - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#13555](https://github.com/BabylonJS/Babylon.js/pull/13555))

### Inspector

- Fix Inspector Additional Nodes - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13560](https://github.com/BabylonJS/Babylon.js/pull/13560))

### Loaders


### Node Editor

- Prevent NME Crash with old light block - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13566](https://github.com/BabylonJS/Babylon.js/pull/13566))

### Serializers


## 5.48.0

### Core

- SSR improvements - by [Popov72](https://github.com/Popov72) ([#13336](https://github.com/BabylonJS/Babylon.js/pull/13336))
- Camera: Add code to update View and Projection Matrices in update function - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13552](https://github.com/BabylonJS/Babylon.js/pull/13552))
- make sure setTarget works as expected in WebXR. - by [RaananW](https://github.com/RaananW) ([#13553](https://github.com/BabylonJS/Babylon.js/pull/13553))
- Scene clearColor is not used in WebXR with multiview enabled - by [RaananW](https://github.com/RaananW) ([#13554](https://github.com/BabylonJS/Babylon.js/pull/13554))

## 5.47.1

### Core

- Touch init was reversed - by [RaananW](https://github.com/RaananW) ([#13549](https://github.com/BabylonJS/Babylon.js/pull/13549))
- PBR: Don't apply radiance occlusion to clearcoat - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13548](https://github.com/BabylonJS/Babylon.js/pull/13548))
- Materials: Fix depth state not set correctly with transparent meshes - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13547](https://github.com/BabylonJS/Babylon.js/pull/13547))
- Physics Iteration 9 - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13545](https://github.com/BabylonJS/Babylon.js/pull/13545))
- WebGPU: Fix engine initialization - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13541](https://github.com/BabylonJS/Babylon.js/pull/13541))

## 5.47.0

### Core

- Add VectorN.Random functions - by [dr-vortex](https://github.com/dr-vortex) ([#13532](https://github.com/BabylonJS/Babylon.js/pull/13532))
- Added ability to pass callback as key trigger parameter. - [_New Feature_] by [reimund](https://github.com/reimund) ([#13538](https://github.com/BabylonJS/Babylon.js/pull/13538))
- PBR: Fix realtime filtering for refraction - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13540](https://github.com/BabylonJS/Babylon.js/pull/13540))
- Physics Iteration 8 - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13539](https://github.com/BabylonJS/Babylon.js/pull/13539))
- Add Clip plane support in Geometry Buffer - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13537](https://github.com/BabylonJS/Babylon.js/pull/13537))
- DefaultRenderingPipeline: Fix image processing not being reset in some cases - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13535](https://github.com/BabylonJS/Babylon.js/pull/13535))
- Fix ANIMATESHEET for custom particle effect - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13533](https://github.com/BabylonJS/Babylon.js/pull/13533))
- Fluid renderer: Fix rendering in right handed system - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13531](https://github.com/BabylonJS/Babylon.js/pull/13531))
- Physics Iteration 7 - by [carolhmj](https://github.com/carolhmj) ([#13530](https://github.com/BabylonJS/Babylon.js/pull/13530))
- PBRMaterial: Fix INVERTCUBICMAP not being reset - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13528](https://github.com/BabylonJS/Babylon.js/pull/13528))
- Fix to instantiate hierarchy - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13524](https://github.com/BabylonJS/Babylon.js/pull/13524))
- Missing raycast export - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13523](https://github.com/BabylonJS/Babylon.js/pull/13523))
- DeviceInputSystem: Use correct pointerId for touch inputs on blur and pointercancel event - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13516](https://github.com/BabylonJS/Babylon.js/pull/13516))
- Delay resize event listener to after video internal texture is created. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13520](https://github.com/BabylonJS/Babylon.js/pull/13520))
- Set event.sourceEvent in ExecuteCodeAction callback for pointer triggers - [_New Feature_] by [docEdub](https://github.com/docEdub) ([#13518](https://github.com/BabylonJS/Babylon.js/pull/13518))

### Materials

- CustomMaterial: Don't prevent support for uniform arrays - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13519](https://github.com/BabylonJS/Babylon.js/pull/13519))

### Node Editor

- Fix option properties in InputNodePropertyComponent - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13529](https://github.com/BabylonJS/Babylon.js/pull/13529))

## 5.46.0

### Core

- Move to TypeScript 4.9.5 - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#13512](https://github.com/BabylonJS/Babylon.js/pull/13512))

### Viewer

- Move to TypeScript 4.9.5 - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#13512](https://github.com/BabylonJS/Babylon.js/pull/13512))

## 5.45.2

### Core

- VideoTexture - Fix texture refresh bug - by [CoPrez](https://github.com/CoPrez) ([#13514](https://github.com/BabylonJS/Babylon.js/pull/13514))
- VideoTexture - Resize the internal texture when the video size changes - [_Bug Fix_] by [CoPrez](https://github.com/CoPrez) ([#13513](https://github.com/BabylonJS/Babylon.js/pull/13513))
- InputManager: Refine logic for handling non-captured pointerup events - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13507](https://github.com/BabylonJS/Babylon.js/pull/13507))
- Physics Iteration 5 - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13498](https://github.com/BabylonJS/Babylon.js/pull/13498))

### Inspector

- Add support for node 18 by updating node-sass - by [852Kerfunkle](https://github.com/852Kerfunkle) ([#13493](https://github.com/BabylonJS/Babylon.js/pull/13493))

## 5.45.1

### Core

- Add Object Space mapping to NME PerturbNormal block - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#13501](https://github.com/BabylonJS/Babylon.js/pull/13501))
- KTXDecoder: Fix crash with "buffer already detached" - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13500](https://github.com/BabylonJS/Babylon.js/pull/13500))
- Physics Iteration 4 - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13485](https://github.com/BabylonJS/Babylon.js/pull/13485))

### GUI


### Node Editor

- Nme updates part 2 - [_New Feature_] by [deltakosh](https://github.com/deltakosh) ([#13495](https://github.com/BabylonJS/Babylon.js/pull/13495))
- Nme updates - by [deltakosh](https://github.com/deltakosh) ([#13491](https://github.com/BabylonJS/Babylon.js/pull/13491))

## 5.45.0

### Core

- Check for invalid hierarchies in the asset container and warn the user - by [carolhmj](https://github.com/carolhmj) ([#13490](https://github.com/BabylonJS/Babylon.js/pull/13490))
- Handle pointerlock rejections, if promise based - by [852Kerfunkle](https://github.com/852Kerfunkle) ([#13487](https://github.com/BabylonJS/Babylon.js/pull/13487))
- Fix ImportMesh of babylon files that share a geometry uniqueId - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13489](https://github.com/BabylonJS/Babylon.js/pull/13489))
- Fix asset container instantiation with parented instanced nodes - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13467](https://github.com/BabylonJS/Babylon.js/pull/13467))
- Texture: Allow ImageBitmap for the buffer parameter of updateURL - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13486](https://github.com/BabylonJS/Babylon.js/pull/13486))
- WebGPU: Fix stencil buffer creation with RTT - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13484](https://github.com/BabylonJS/Babylon.js/pull/13484))
- MorphTargetMgr: Fallback to vertex attribute mode if too many targets - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13480](https://github.com/BabylonJS/Babylon.js/pull/13480))
- Fix GLTF Variants Clone - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13481](https://github.com/BabylonJS/Babylon.js/pull/13481))
- Fix hit detection in a multi-cam scenario with billboarded meshes. - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13479](https://github.com/BabylonJS/Babylon.js/pull/13479))
- Fix sound current time after it ends on its own - [_Bug Fix_] by [docEdub](https://github.com/docEdub) ([#13478](https://github.com/BabylonJS/Babylon.js/pull/13478))
- Fix sound source `onended` handling - [_Bug Fix_] by [docEdub](https://github.com/docEdub) ([#13472](https://github.com/BabylonJS/Babylon.js/pull/13472))
- Performance optimization for vector methods - by [myfreeer](https://github.com/myfreeer) ([#13474](https://github.com/BabylonJS/Babylon.js/pull/13474))
- KTX2 decoding: Add default KTX2 decoder configuration - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13469](https://github.com/BabylonJS/Babylon.js/pull/13469))
- Babylon serializer: Serialize actions for instances - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13470](https://github.com/BabylonJS/Babylon.js/pull/13470))

### GUI

- Add GUI is ready function and add it on visualization tests - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#13475](https://github.com/BabylonJS/Babylon.js/pull/13475))

## 5.44.0

### Core

- InputManager: Fix for POINTERTAP firing during multi-touch gesture - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13466](https://github.com/BabylonJS/Babylon.js/pull/13466))
- BaseCameraPointerInputs: Fixed logic to ignore extra touches - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13468](https://github.com/BabylonJS/Babylon.js/pull/13468))

## 5.43.2

### Core

- Observable: Fix single fire events not working sometimes - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13465](https://github.com/BabylonJS/Babylon.js/pull/13465))
- Gradients on GUI - by [carolhmj](https://github.com/carolhmj) ([#13361](https://github.com/BabylonJS/Babylon.js/pull/13361))
- Fluid Renderer: Fixes WebGPU support - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13459](https://github.com/BabylonJS/Babylon.js/pull/13459))
- Update assetContainer.ts - by [aWeirdo](https://github.com/aWeirdo) ([#13451](https://github.com/BabylonJS/Babylon.js/pull/13451))

### GUI

- Add forceResizeWidth on GUI Text Block to allow for width resize even… - by [carolhmj](https://github.com/carolhmj) ([#13460](https://github.com/BabylonJS/Babylon.js/pull/13460))
- Gradients on GUI - by [carolhmj](https://github.com/carolhmj) ([#13361](https://github.com/BabylonJS/Babylon.js/pull/13361))

### GUI Editor

- Fixes to GUI Editor Zoom Behavior - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13462](https://github.com/BabylonJS/Babylon.js/pull/13462))

## 5.43.1

### Core

- Physics V2 Iteration 3 - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13450](https://github.com/BabylonJS/Babylon.js/pull/13450))
- Fix Lines Mesh with Push Material - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13457](https://github.com/BabylonJS/Babylon.js/pull/13457))
- Fix Sound current time when pause is called, and refactor pause system - [_Bug Fix_] by [docEdub](https://github.com/docEdub) ([#13455](https://github.com/BabylonJS/Babylon.js/pull/13455))
- Fix back-compat issue in physics (es6) - by [RaananW](https://github.com/RaananW) ([#13453](https://github.com/BabylonJS/Babylon.js/pull/13453))

### GUI

- Fix GUI Image caching to consider images that have been created but n… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13440](https://github.com/BabylonJS/Babylon.js/pull/13440))

### Serializers

- Optimizing performance of _BinaryWriter._resizeBuffer - by [myfreeer](https://github.com/myfreeer) ([#13456](https://github.com/BabylonJS/Babylon.js/pull/13456))

## 5.43.0

### Core

- Fix memory leaks - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13452](https://github.com/BabylonJS/Babylon.js/pull/13452))
- Material: Make the frozen mode more user friendly - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13437](https://github.com/BabylonJS/Babylon.js/pull/13437))
- Better error handling in XR Hand constraint behavior - by [RaananW](https://github.com/RaananW) ([#13449](https://github.com/BabylonJS/Babylon.js/pull/13449))
- Remove a 180 degree flip (an old relic) - by [RaananW](https://github.com/RaananW) ([#13448](https://github.com/BabylonJS/Babylon.js/pull/13448))
- Fix Sound current time when stop is called while paused - [_Bug Fix_] by [docEdub](https://github.com/docEdub) ([#13444](https://github.com/BabylonJS/Babylon.js/pull/13444))
- Add support for unsigned int uniform - by [newbeea](https://github.com/newbeea) ([#13433](https://github.com/BabylonJS/Babylon.js/pull/13433))
- Fix Action Deserialization - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13436](https://github.com/BabylonJS/Babylon.js/pull/13436))

### GUI Editor

- Pan torwards cursor when zooming on GUI Editor - by [carolhmj](https://github.com/carolhmj) ([#13387](https://github.com/BabylonJS/Babylon.js/pull/13387))

### Serializers

- Add support for instanced meshes in STLEXPORT - by [d-0-s-t](https://github.com/d-0-s-t) ([#13439](https://github.com/BabylonJS/Babylon.js/pull/13439))

## 5.42.2

### Core

- Fixed issue when setting ViewPort multiple times per frame in Native - by [SergioRZMasson](https://github.com/SergioRZMasson) ([#13367](https://github.com/BabylonJS/Babylon.js/pull/13367))

## 5.42.1

### Core

- Add touch release detection to draggable parts of BoundingBoxGizmo - by [Hsifnus](https://github.com/Hsifnus) ([#13428](https://github.com/BabylonJS/Babylon.js/pull/13428))
- Fix broken sound offset backward compatibility - [_Bug Fix_] by [docEdub](https://github.com/docEdub) ([#13431](https://github.com/BabylonJS/Babylon.js/pull/13431))
- GPUParticleSystem: Fix crash when update effect not ready - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13432](https://github.com/BabylonJS/Babylon.js/pull/13432))

### GUI

- Fixes and performance improvement for linked GUI - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13430](https://github.com/BabylonJS/Babylon.js/pull/13430))

## 5.42.0

### Core

- Fix broken use of TmpVectors in BoundingBoxGizmo - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13429](https://github.com/BabylonJS/Babylon.js/pull/13429))
- Add location to glFragColor in WebGL preprocessor - by [OrigamiDev-Pete](https://github.com/OrigamiDev-Pete) ([#13427](https://github.com/BabylonJS/Babylon.js/pull/13427))
- Fix sound play function not accepting zero as a valid offset - [_Bug Fix_] by [docEdub](https://github.com/docEdub) ([#13425](https://github.com/BabylonJS/Babylon.js/pull/13425))
- ActionManager: Add support for Material in serialization and parsing - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13423](https://github.com/BabylonJS/Babylon.js/pull/13423))
- NME: Add a RealTime input - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13418](https://github.com/BabylonJS/Babylon.js/pull/13418))
- Fix LoadScriptAsync to reject with proper error - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#13415](https://github.com/BabylonJS/Babylon.js/pull/13415))
- Prevent Uncaught Exception from `ThinEngine.runRenderLoop` when `window.SetTimeout` in not defined - by [barroij](https://github.com/barroij) ([#13401](https://github.com/BabylonJS/Babylon.js/pull/13401))
- Add a fade out delay to FadeInOutBehavior - by [ericwood73](https://github.com/ericwood73) ([#13389](https://github.com/BabylonJS/Babylon.js/pull/13389))
- NME : Use flag IgnoreTexturesAtLoadTime in ReflectionTextureBaseBlock - by [GMM-Monumento](https://github.com/GMM-Monumento) ([#13409](https://github.com/BabylonJS/Babylon.js/pull/13409))

### GUI

- Cache loaded dom images on Image class so the playground-editor doesn't have to reload them often - by [carolhmj](https://github.com/carolhmj) ([#13388](https://github.com/BabylonJS/Babylon.js/pull/13388))
- Fix 2 slider3D issues - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#13411](https://github.com/BabylonJS/Babylon.js/pull/13411))
- Properly notify textHighlightObservable - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13410](https://github.com/BabylonJS/Babylon.js/pull/13410))

### Inspector

- Prevent Uncaught Exception from `ThinEngine.runRenderLoop` when `window.SetTimeout` in not defined - by [barroij](https://github.com/barroij) ([#13401](https://github.com/BabylonJS/Babylon.js/pull/13401))

### Materials

- Add dithering option to SkyMaterial - by [852Kerfunkle](https://github.com/852Kerfunkle) ([#13426](https://github.com/BabylonJS/Babylon.js/pull/13426))

### Node Editor

- NME: Add a RealTime input - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13418](https://github.com/BabylonJS/Babylon.js/pull/13418))

### Serializers

- Export gltf scene level metadata - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13419](https://github.com/BabylonJS/Babylon.js/pull/13419))

## 5.41.0

### Core

- Gizmos use TmpVectors and exposed materials - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13402](https://github.com/BabylonJS/Babylon.js/pull/13402))
- Physics V2 plugin iteration - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13352](https://github.com/BabylonJS/Babylon.js/pull/13352))
- Hide teleportation mesh on creation - by [RaananW](https://github.com/RaananW) ([#13397](https://github.com/BabylonJS/Babylon.js/pull/13397))
- Add a _internalMetadata to avoid side effects with metadata - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13365](https://github.com/BabylonJS/Babylon.js/pull/13365))

### GUI

- Fix calculation of text height in InputTextArea - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13404](https://github.com/BabylonJS/Babylon.js/pull/13404))
- GUI Editor Line Gizmo Improvements - by [carolhmj](https://github.com/carolhmj) ([#13394](https://github.com/BabylonJS/Babylon.js/pull/13394))
- Force the control's old rect position to be invalidated before moving - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13399](https://github.com/BabylonJS/Babylon.js/pull/13399))

### GUI Editor

- GUI Editor Line Gizmo Improvements - by [carolhmj](https://github.com/carolhmj) ([#13394](https://github.com/BabylonJS/Babylon.js/pull/13394))

### Loaders

- Add a _internalMetadata to avoid side effects with metadata - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13365](https://github.com/BabylonJS/Babylon.js/pull/13365))

### Playground


## 5.40.1

### Core

- Release 5.39.0 Has IPhysicsEnginePLugin Errors - by [RaananW](https://github.com/RaananW) ([#13393](https://github.com/BabylonJS/Babylon.js/pull/13393))

### GUI Editor

- Fix font style options on gui editor. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13392](https://github.com/BabylonJS/Babylon.js/pull/13392))

### Playground

- Allow loading unicode-based playgrounds in older versions - by [RaananW](https://github.com/RaananW) ([#13395](https://github.com/BabylonJS/Babylon.js/pull/13395))

## 5.40.0

### Core

- Add a parameter to CreateScreenshotUsingRenderTarget(Async) to allow … - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13384](https://github.com/BabylonJS/Babylon.js/pull/13384))
- Add some comments on docs reinforcing that it's only possible to upda… - by [carolhmj](https://github.com/carolhmj) ([#13383](https://github.com/BabylonJS/Babylon.js/pull/13383))
- Don't serialize internal shader materials - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13379](https://github.com/BabylonJS/Babylon.js/pull/13379))
- Fix crash when calling getGlowLayerByName when no effects have been created yet - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13377](https://github.com/BabylonJS/Babylon.js/pull/13377))
- Fix doc comment for audio listener rotation provider - by [docEdub](https://github.com/docEdub) ([#13376](https://github.com/BabylonJS/Babylon.js/pull/13376))
- Fix audio offset issues - [_Bug Fix_] by [docEdub](https://github.com/docEdub) ([#13373](https://github.com/BabylonJS/Babylon.js/pull/13373))
- Add audioListenerRotationProvider - by [sebavan](https://github.com/sebavan) ([#13375](https://github.com/BabylonJS/Babylon.js/pull/13375))
- Material plugins: Allow custom flags when injecting code with regexp - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13371](https://github.com/BabylonJS/Babylon.js/pull/13371))
- Allow accessing private fields and methods of SPS - by [s207152](https://github.com/s207152) ([#13369](https://github.com/BabylonJS/Babylon.js/pull/13369))

### GUI

- Hold shift when resizing to lock aspect ratio in GUI Editor - by [carolhmj](https://github.com/carolhmj) ([#13386](https://github.com/BabylonJS/Babylon.js/pull/13386))
- If a new control is added on root, call the camera update function to… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13372](https://github.com/BabylonJS/Babylon.js/pull/13372))

### GUI Editor

- Hold shift when resizing to lock aspect ratio in GUI Editor - by [carolhmj](https://github.com/carolhmj) ([#13386](https://github.com/BabylonJS/Babylon.js/pull/13386))
- Change GUI Editor default image URL - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13380](https://github.com/BabylonJS/Babylon.js/pull/13380))

### Inspector

- More defensive handling of name property in Inspector - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13382](https://github.com/BabylonJS/Babylon.js/pull/13382))

## 5.39.0

### Core

- Add Transpose and Determinant matrix blocks - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#13368](https://github.com/BabylonJS/Babylon.js/pull/13368))
- Fix PBR Emissive with lightmap - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13362](https://github.com/BabylonJS/Babylon.js/pull/13362))
- LineMesh: Add an option to not dispose the material - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13358](https://github.com/BabylonJS/Babylon.js/pull/13358))
- RenderTargetTexture: Add forceLayerMaskCheck property - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13359](https://github.com/BabylonJS/Babylon.js/pull/13359))
- Fix rtt option default - by [thscott](https://github.com/thscott) ([#13340](https://github.com/BabylonJS/Babylon.js/pull/13340))
- VolumetricLightScattering: Add support for included only meshes - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13355](https://github.com/BabylonJS/Babylon.js/pull/13355))
- Some examples for matrices - by [BabylonJSGuide](https://github.com/BabylonJSGuide) ([#13351](https://github.com/BabylonJS/Babylon.js/pull/13351))
- DepthRenderer: Allow passing the sampling mode to the scene depth renderer - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13349](https://github.com/BabylonJS/Babylon.js/pull/13349))

### GUI

- Rework Scene and GUI Editor connection - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13353](https://github.com/BabylonJS/Babylon.js/pull/13353))

### GUI Editor

- Rework Scene and GUI Editor connection - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13353](https://github.com/BabylonJS/Babylon.js/pull/13353))

### Node Editor

- Add Transpose and Determinant matrix blocks - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#13368](https://github.com/BabylonJS/Babylon.js/pull/13368))

### Serializers

- Fix bug in glTF animation export - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#13356](https://github.com/BabylonJS/Babylon.js/pull/13356))

## 5.38.0

### Core

- EffectLayer: Allows to set the type of the main texture - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13343](https://github.com/BabylonJS/Babylon.js/pull/13343))
- NME: Fix of input types allowed for some blocks - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13339](https://github.com/BabylonJS/Babylon.js/pull/13339))

### Node Editor


### Playground


## 5.37.0

### Core

- NME: Fix reusing the same temporary variable name in TextureBlock - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13335](https://github.com/BabylonJS/Babylon.js/pull/13335))
- fix missing plugin when enabling physics - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13334](https://github.com/BabylonJS/Babylon.js/pull/13334))
- NME: Add a rgb output to the ImageProcessing block - by [Popov72](https://github.com/Popov72) ([#13328](https://github.com/BabylonJS/Babylon.js/pull/13328))
- allow independent video sources in VideoTexture - by [RaananW](https://github.com/RaananW) ([#13331](https://github.com/BabylonJS/Babylon.js/pull/13331))
- VirtualJoystick - Stop iterating when canvas is released - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#13332](https://github.com/BabylonJS/Babylon.js/pull/13332))
- ArcRotateCamera: Fix lower and upper beta limit type - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13330](https://github.com/BabylonJS/Babylon.js/pull/13330))

### Loaders


## 5.36.0

### Core

- NME: fixed slowdowns when working in the editor - by [Popov72](https://github.com/Popov72) ([#13326](https://github.com/BabylonJS/Babylon.js/pull/13326))
- When rendering in a multi-canvas setup, always render the input view … - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13320](https://github.com/BabylonJS/Babylon.js/pull/13320))
- Mirror: Fix rendering when cullBackFaces is false - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13322](https://github.com/BabylonJS/Babylon.js/pull/13322))
- PhysicsPlugin refactor - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13279](https://github.com/BabylonJS/Babylon.js/pull/13279))
- InputManager: Update logic for detecting when to pick - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13321](https://github.com/BabylonJS/Babylon.js/pull/13321))
- Particle System: Add a parameter to also clone textures when cloning a particle system - by [Popov72](https://github.com/Popov72) ([#13318](https://github.com/BabylonJS/Babylon.js/pull/13318))
- Fix bad uniform scale check for rotation gizmo - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13319](https://github.com/BabylonJS/Babylon.js/pull/13319))
- Add a Fluid Renderer component - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13291](https://github.com/BabylonJS/Babylon.js/pull/13291))
- Add playback rate getter - by [sebavan](https://github.com/sebavan) ([#13312](https://github.com/BabylonJS/Babylon.js/pull/13312))
- typedoc update for POV methods - by [ssatguru](https://github.com/ssatguru) ([#13310](https://github.com/BabylonJS/Babylon.js/pull/13310))

### Inspector

- Fix: ACE always opening with the first targeted animation selected - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13327](https://github.com/BabylonJS/Babylon.js/pull/13327))
- PhysicsPlugin refactor - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13279](https://github.com/BabylonJS/Babylon.js/pull/13279))
- Fix: Animation Groups not showing the correct current frame value in … - by [carolhmj](https://github.com/carolhmj) ([#13307](https://github.com/BabylonJS/Babylon.js/pull/13307))

### Materials

- Mirror: Fix rendering when cullBackFaces is false - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13322](https://github.com/BabylonJS/Babylon.js/pull/13322))

### Node Editor

- NME: fixed slowdowns when working in the editor - by [Popov72](https://github.com/Popov72) ([#13326](https://github.com/BabylonJS/Babylon.js/pull/13326))

### Playground

- clear metadata when a new pg is created - by [RaananW](https://github.com/RaananW) ([#13323](https://github.com/BabylonJS/Babylon.js/pull/13323))
- Add a Fluid Renderer component - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13291](https://github.com/BabylonJS/Babylon.js/pull/13291))

### Serializers

- Support KHR_materials_emissive_stength in glTF export - by [tboggs300](https://github.com/tboggs300) ([#13303](https://github.com/BabylonJS/Babylon.js/pull/13303))
- Call the KHR_texture_transform exporter when exporting a GLTF file - by [carolhmj](https://github.com/carolhmj) ([#13305](https://github.com/BabylonJS/Babylon.js/pull/13305))

## 5.35.1

### Core

- Fix restore context in WebGL1 when using non POT textures - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13308](https://github.com/BabylonJS/Babylon.js/pull/13308))
- Fixed NativeEngine render target assignment - [_Bug Fix_] by [SergioRZMasson](https://github.com/SergioRZMasson) ([#13306](https://github.com/BabylonJS/Babylon.js/pull/13306))
- Support create RTT from internal texture directly - [_New Feature_] by [bghgary](https://github.com/bghgary) ([#13275](https://github.com/BabylonJS/Babylon.js/pull/13275))

## 5.35.0

### Core

- Preserve camera control settings when reattaching camera controls - [_Bug Fix_] by [ericwood73](https://github.com/ericwood73) ([#13300](https://github.com/BabylonJS/Babylon.js/pull/13300))
- Fix Texture rebuild on context lost - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13299](https://github.com/BabylonJS/Babylon.js/pull/13299))
- Fix teleportation bug When changing controllers - by [RaananW](https://github.com/RaananW) ([#13298](https://github.com/BabylonJS/Babylon.js/pull/13298))
- clear as default when in layers multiview - by [RaananW](https://github.com/RaananW) ([#13297](https://github.com/BabylonJS/Babylon.js/pull/13297))
- InputManager: Fix Order and Execution of onPrePointerObservable - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13295](https://github.com/BabylonJS/Babylon.js/pull/13295))
- KTXDecoder: Update and add new universal transcoders - by [Popov72](https://github.com/Popov72) ([#13284](https://github.com/BabylonJS/Babylon.js/pull/13284))
- Cameras: Modified cameras to work under onPointerObservable - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13293](https://github.com/BabylonJS/Babylon.js/pull/13293))
- Add static Reflect function to Vector3 - by [AlvaroHerreroDev](https://github.com/AlvaroHerreroDev) ([#13281](https://github.com/BabylonJS/Babylon.js/pull/13281))
- Test the PickingInfo class - by [Dok11](https://github.com/Dok11) ([#13290](https://github.com/BabylonJS/Babylon.js/pull/13290))
- RTT: Make sure we increment scene frameId even in "check readiness" mode - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13289](https://github.com/BabylonJS/Babylon.js/pull/13289))
- PBRBaseMaterial fix getAnimatables JSDoc - by [Dok11](https://github.com/Dok11) ([#13288](https://github.com/BabylonJS/Babylon.js/pull/13288))
- Bump: Fix black spots in bump when no uv gradients - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13287](https://github.com/BabylonJS/Babylon.js/pull/13287))
- Ensure bloom blur size is consistent across hardware scaling levels - [_Bug Fix_] by [kircher1](https://github.com/kircher1) ([#13286](https://github.com/BabylonJS/Babylon.js/pull/13286))
- Test babylon scene materials - by [Dok11](https://github.com/Dok11) ([#13285](https://github.com/BabylonJS/Babylon.js/pull/13285))
- Mesh: Add forceWorldMatrixInstancedBufferUpdate property - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13282](https://github.com/BabylonJS/Babylon.js/pull/13282))
- Observable: Do not include deleted observers in hasObservers result - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13283](https://github.com/BabylonJS/Babylon.js/pull/13283))

### GUI

- remove prepublish step, fix node.js issue on windows - by [RaananW](https://github.com/RaananW) ([#13280](https://github.com/BabylonJS/Babylon.js/pull/13280))

### Inspector

- remove prepublish step, fix node.js issue on windows - by [RaananW](https://github.com/RaananW) ([#13280](https://github.com/BabylonJS/Babylon.js/pull/13280))

## 5.34.0

### Core

- NME: multiple changes to support ray marching in the NME - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13272](https://github.com/BabylonJS/Babylon.js/pull/13272))

### Node Editor

- NME: multiple changes to support ray marching in the NME - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13272](https://github.com/BabylonJS/Babylon.js/pull/13272))

### Playground

- define engine and canvas as globals - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#13278](https://github.com/BabylonJS/Babylon.js/pull/13278))

## 5.33.2

### Core

- Test babylon pbrmaterial - by [Dok11](https://github.com/Dok11) ([#13268](https://github.com/BabylonJS/Babylon.js/pull/13268))

### Loaders

- adding integration tests for loaders and serializers - by [RaananW](https://github.com/RaananW) ([#13266](https://github.com/BabylonJS/Babylon.js/pull/13266))

### Playground

- Add accessibility package to playground - by [RaananW](https://github.com/RaananW) ([#13271](https://github.com/BabylonJS/Babylon.js/pull/13271))

### Serializers

- adding integration tests for loaders and serializers - by [RaananW](https://github.com/RaananW) ([#13266](https://github.com/BabylonJS/Babylon.js/pull/13266))

## 5.33.1

### Core

- fixing billboardMode mode for instanced meshes - by [Bastl34](https://github.com/Bastl34) ([#13265](https://github.com/BabylonJS/Babylon.js/pull/13265))
- PBR material: Add missing test for the emissive texture in hasTexture - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13261](https://github.com/BabylonJS/Babylon.js/pull/13261))
- Add Sprite Manager Metadata - by [sebavan](https://github.com/sebavan) ([#13259](https://github.com/BabylonJS/Babylon.js/pull/13259))

### Playground


### Serializers

- Fix glTF export texture dedupe code - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#13263](https://github.com/BabylonJS/Babylon.js/pull/13263))
- glTF export root node removal fix - by [bghgary](https://github.com/bghgary) ([#13214](https://github.com/BabylonJS/Babylon.js/pull/13214))

## 5.33.0

### Core

- FreeCameraMouseInput: Fix for PointerLock Movement - by [PolygonalSun](https://github.com/PolygonalSun) ([#13258](https://github.com/BabylonJS/Babylon.js/pull/13258))
- Fix IKController with leaf node - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13257](https://github.com/BabylonJS/Babylon.js/pull/13257))
- PostProcess: Add hooks to alter shader code used by post processes - by [Popov72](https://github.com/Popov72) ([#13256](https://github.com/BabylonJS/Babylon.js/pull/13256))
- Fix dump tools premultiplied alpha. - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13251](https://github.com/BabylonJS/Babylon.js/pull/13251))
- Support ClipPlanes in Materials - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#13249](https://github.com/BabylonJS/Babylon.js/pull/13249))
- WebGPU: Improve copy video to texture - by [Popov72](https://github.com/Popov72) ([#13254](https://github.com/BabylonJS/Babylon.js/pull/13254))

### Materials

- Support ClipPlanes in Materials - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#13249](https://github.com/BabylonJS/Babylon.js/pull/13249))

### Serializers

- Fix dump tools premultiplied alpha. - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13251](https://github.com/BabylonJS/Babylon.js/pull/13251))

## 5.32.2

### Core

- InputManager: Fixed up/down picking on callback - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13250](https://github.com/BabylonJS/Babylon.js/pull/13250))
- Fix for FreeCameraMouseInput fluxuating input on multi-touch - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13233](https://github.com/BabylonJS/Babylon.js/pull/13233))
- array flat polyfill for Chakra - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13246](https://github.com/BabylonJS/Babylon.js/pull/13246))
- Extend dragPlanePoint doc on onDrag*Observables - by [dennemark](https://github.com/dennemark) ([#13245](https://github.com/BabylonJS/Babylon.js/pull/13245))
- Fix Gizmo Release Drag - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13237](https://github.com/BabylonJS/Babylon.js/pull/13237))
- Rotation gizmos with non uniform scaling - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13240](https://github.com/BabylonJS/Babylon.js/pull/13240))
- Support matrix in reciproqual block - by [sebavan](https://github.com/sebavan) ([#13241](https://github.com/BabylonJS/Babylon.js/pull/13241))
- Test babylon mesh lod 2 - by [Dok11](https://github.com/Dok11) ([#13234](https://github.com/BabylonJS/Babylon.js/pull/13234))
- ShadowDepthWrapper: Fix shadows when wrapping a material using custom material plugins - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13236](https://github.com/BabylonJS/Babylon.js/pull/13236))
- InputManager: Modify Picking to only happen with necessary scenarios - by [PolygonalSun](https://github.com/PolygonalSun) ([#13145](https://github.com/BabylonJS/Babylon.js/pull/13145))
- Fix redirects in code doc - by [RaananW](https://github.com/RaananW) ([#13228](https://github.com/BabylonJS/Babylon.js/pull/13228))

### GUI

- 3d slider - dispose textures correctly - by [RaananW](https://github.com/RaananW) ([#13235](https://github.com/BabylonJS/Babylon.js/pull/13235))
- Fix memory leaks - by [RaananW](https://github.com/RaananW) ([#13231](https://github.com/BabylonJS/Babylon.js/pull/13231))

### Playground


### Serializers

- Improve glTF material export code - by [bghgary](https://github.com/bghgary) ([#13229](https://github.com/BabylonJS/Babylon.js/pull/13229))

## 5.32.1

### Core

- EffectRender: Fix culling state not reset properly - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13227](https://github.com/BabylonJS/Babylon.js/pull/13227))

## 5.32.0

### Core

- Texture: Add new copy texture to texture class - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13222](https://github.com/BabylonJS/Babylon.js/pull/13222))
- Support correct spelling on center - by [sebavan](https://github.com/sebavan) ([#13220](https://github.com/BabylonJS/Babylon.js/pull/13220))
- MeshExploder bugfix - [_Bug Fix_] by [SergioRZMasson](https://github.com/SergioRZMasson) ([#13219](https://github.com/BabylonJS/Babylon.js/pull/13219))
- Fix aliasing issue in webxr multiview - by [RaananW](https://github.com/RaananW) ([#13217](https://github.com/BabylonJS/Babylon.js/pull/13217))
- Change doc to match code - by [Lowclouds](https://github.com/Lowclouds) ([#13215](https://github.com/BabylonJS/Babylon.js/pull/13215))
- Test babylon mesh baking - by [Dok11](https://github.com/Dok11) ([#13206](https://github.com/BabylonJS/Babylon.js/pull/13206))

### GUI Editor


### Inspector

- Support correct spelling on center - by [sebavan](https://github.com/sebavan) ([#13220](https://github.com/BabylonJS/Babylon.js/pull/13220))

### Loaders


### Node Editor


### Viewer

- Support correct spelling on center - by [sebavan](https://github.com/sebavan) ([#13220](https://github.com/BabylonJS/Babylon.js/pull/13220))

## 5.31.2

### Core


## 5.31.1

### Core

- Test babylon octree block - by [Dok11](https://github.com/Dok11) ([#13201](https://github.com/BabylonJS/Babylon.js/pull/13201))
- Test babylon mesh lod screen coverage - by [Dok11](https://github.com/Dok11) ([#13202](https://github.com/BabylonJS/Babylon.js/pull/13202))
- fix: switch back to the main scene using multiple canvases, and rende… - [_Bug Fix_] by [MILIFIRE](https://github.com/MILIFIRE) ([#13204](https://github.com/BabylonJS/Babylon.js/pull/13204))
- Cube textures: Fix updating data with engine.updateTextureData - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13205](https://github.com/BabylonJS/Babylon.js/pull/13205))
- Xr camera - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13190](https://github.com/BabylonJS/Babylon.js/pull/13190))
- Motion blur: Fix motion blur when not in the "object based" mode - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13200](https://github.com/BabylonJS/Babylon.js/pull/13200))
- AssetContainer: Fix crash when calling moveAllFromScene if environmentTexture is present - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13199](https://github.com/BabylonJS/Babylon.js/pull/13199))
- Add missing samplers to motion blur post process - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13198](https://github.com/BabylonJS/Babylon.js/pull/13198))
- Fix animatable loop - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13196](https://github.com/BabylonJS/Babylon.js/pull/13196))
- Shadows: Fix transparent shadows with ALPHABLEND transparency mode - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13197](https://github.com/BabylonJS/Babylon.js/pull/13197))

## 5.31.0

### Core

- Reduce memory usage in bakeTransformIntoVertices - by [rgerd](https://github.com/rgerd) ([#13193](https://github.com/BabylonJS/Babylon.js/pull/13193))
- NME: fix wrong perturbed normals when using pre-existing tangents - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13186](https://github.com/BabylonJS/Babylon.js/pull/13186))
- Test babylon camera inputs manager - by [Dok11](https://github.com/Dok11) ([#13188](https://github.com/BabylonJS/Babylon.js/pull/13188))
- WebGPU: Add support for GLES3 to WebGPU GLSL processing - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13191](https://github.com/BabylonJS/Babylon.js/pull/13191))
- Test babylon octree block - by [Dok11](https://github.com/Dok11) ([#13189](https://github.com/BabylonJS/Babylon.js/pull/13189))
- Test babylon mesh lod - by [Dok11](https://github.com/Dok11) ([#13184](https://github.com/BabylonJS/Babylon.js/pull/13184))
- Test babylon transform node - by [Dok11](https://github.com/Dok11) ([#13181](https://github.com/BabylonJS/Babylon.js/pull/13181))
- Lights: Add support for multiple shadow generators - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13177](https://github.com/BabylonJS/Babylon.js/pull/13177))
- Fix bug rendering transparent meshes using their own materials in effect layer - [_Bug Fix_] by [djn24](https://github.com/djn24) ([#13179](https://github.com/BabylonJS/Babylon.js/pull/13179))
- fix nightly for BN - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13178](https://github.com/BabylonJS/Babylon.js/pull/13178))

### Node Editor

- NME: Fix preview not updated when changing the clamp settings in the Texture block - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13187](https://github.com/BabylonJS/Babylon.js/pull/13187))

### Viewer

- Lights: Add support for multiple shadow generators - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13177](https://github.com/BabylonJS/Babylon.js/pull/13177))

## 5.30.0

### Core

- Small fix for types in the webxr typing - by [RaananW](https://github.com/RaananW) ([#13172](https://github.com/BabylonJS/Babylon.js/pull/13172))
- Revert "Use the latest CDN nightly version and not unpkg" - by [RaananW](https://github.com/RaananW) ([#13173](https://github.com/BabylonJS/Babylon.js/pull/13173))
- NME: Fix and improve the HeightToNormal block - by [Popov72](https://github.com/Popov72) ([#13171](https://github.com/BabylonJS/Babylon.js/pull/13171))
- fixing screen coverage LOD for ortho camera - [_Bug Fix_] by [CraigFeldspar](https://github.com/CraigFeldspar) ([#13170](https://github.com/BabylonJS/Babylon.js/pull/13170))
- Use the latest CDN nightly version and not unpkg - by [RaananW](https://github.com/RaananW) ([#13169](https://github.com/BabylonJS/Babylon.js/pull/13169))
- Support relative urls in KTX2 configuration - by [bghgary](https://github.com/bghgary) ([#13160](https://github.com/BabylonJS/Babylon.js/pull/13160))
- Fix Camera Order Back Compat - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13162](https://github.com/BabylonJS/Babylon.js/pull/13162))
- ParticleSystem: Add BILLBOARDMODE_STRETCHED_LOCAL mode - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13156](https://github.com/BabylonJS/Babylon.js/pull/13156))
- WebGPU: Fix PGs errors / warnings - by [Popov72](https://github.com/Popov72) ([#13154](https://github.com/BabylonJS/Babylon.js/pull/13154))
- OIT fix : clearing front render target when no transparent mesh are rendered - by [CraigFeldspar](https://github.com/CraigFeldspar) ([#13151](https://github.com/BabylonJS/Babylon.js/pull/13151))
- quaternion PG examples - by [BabylonJSGuide](https://github.com/BabylonJSGuide) ([#13152](https://github.com/BabylonJS/Babylon.js/pull/13152))
- Attempting to fix missing renderingManager() typescript definition - by [kircher1](https://github.com/kircher1) ([#13155](https://github.com/BabylonJS/Babylon.js/pull/13155))
- Update Pressure Observer to latest version of the WICG spec - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13146](https://github.com/BabylonJS/Babylon.js/pull/13146))
- InputManager: Reset Swipe Status if we skip the next Observable notify - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13148](https://github.com/BabylonJS/Babylon.js/pull/13148))
- Build Accessibility Tree from scene - by [mysunnytime](https://github.com/mysunnytime) ([#12074](https://github.com/BabylonJS/Babylon.js/pull/12074))
- remove new methods - by [BabylonJSGuide](https://github.com/BabylonJSGuide) ([#13137](https://github.com/BabylonJS/Babylon.js/pull/13137))
- Flip normal if picking ray is in the same direction - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#13128](https://github.com/BabylonJS/Babylon.js/pull/13128))
- Add Vector2 type to custom inspector properties - by [BlakeOne](https://github.com/BlakeOne) ([#13141](https://github.com/BabylonJS/Babylon.js/pull/13141))

### GUI

- ADT: Added check to attachToMesh to prevent potential memory leak - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#13175](https://github.com/BabylonJS/Babylon.js/pull/13175))
- Build Accessibility Tree from scene - by [mysunnytime](https://github.com/mysunnytime) ([#12074](https://github.com/BabylonJS/Babylon.js/pull/12074))
- Take into account adaptWidth/HeightToChildren in the StackPanel - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13144](https://github.com/BabylonJS/Babylon.js/pull/13144))

### GUI Editor

- Different ports for our hosted tools - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#13166](https://github.com/BabylonJS/Babylon.js/pull/13166))

### Inspector

- Revert "Use the latest CDN nightly version and not unpkg" - by [RaananW](https://github.com/RaananW) ([#13173](https://github.com/BabylonJS/Babylon.js/pull/13173))
- Use the latest CDN nightly version and not unpkg - by [RaananW](https://github.com/RaananW) ([#13169](https://github.com/BabylonJS/Babylon.js/pull/13169))
- Fix Camera Order Back Compat - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13162](https://github.com/BabylonJS/Babylon.js/pull/13162))
- Update Pressure Observer to latest version of the WICG spec - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13146](https://github.com/BabylonJS/Babylon.js/pull/13146))
- Add Vector2 type to custom inspector properties - by [BlakeOne](https://github.com/BlakeOne) ([#13141](https://github.com/BabylonJS/Babylon.js/pull/13141))

### Node Editor

- Different ports for our hosted tools - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#13166](https://github.com/BabylonJS/Babylon.js/pull/13166))

### Playground

- Different ports for our hosted tools - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#13166](https://github.com/BabylonJS/Babylon.js/pull/13166))

### Procedural Textures

- WebGPU: Fix PGs errors / warnings - by [Popov72](https://github.com/Popov72) ([#13154](https://github.com/BabylonJS/Babylon.js/pull/13154))

## 5.29.0

### Core

- InputManager: Fix for POINTERTAP firing when cursor is moved - by [PolygonalSun](https://github.com/PolygonalSun) ([#13136](https://github.com/BabylonJS/Babylon.js/pull/13136))
- Fix infinite sprites draw in frozen scenes - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13131](https://github.com/BabylonJS/Babylon.js/pull/13131))
- Fix usage of useReverseDepthBuffer with orthographic cameras - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13134](https://github.com/BabylonJS/Babylon.js/pull/13134))
- Workaround Firefox Leak - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13127](https://github.com/BabylonJS/Babylon.js/pull/13127))
- Implement Lazy Picking for POINTERMOVE - by [PolygonalSun](https://github.com/PolygonalSun) ([#13044](https://github.com/BabylonJS/Babylon.js/pull/13044))
- Normalized return values and made vector classes use extendable types - by [LostInClams](https://github.com/LostInClams) ([#13076](https://github.com/BabylonJS/Babylon.js/pull/13076))
- Fix crash when using a custom material for LineMesh with an effect layer - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13116](https://github.com/BabylonJS/Babylon.js/pull/13116))
- forceSharedVertices with skinmesh support - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13114](https://github.com/BabylonJS/Babylon.js/pull/13114))
- Decals: Add support for rigged meshes + optimization for speed - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13111](https://github.com/BabylonJS/Babylon.js/pull/13111))
- Depth of field optimizations and cleanup - by [kircher1](https://github.com/kircher1) ([#13110](https://github.com/BabylonJS/Babylon.js/pull/13110))
- fix the samples returned when using multiview in WebXR - by [RaananW](https://github.com/RaananW) ([#13108](https://github.com/BabylonJS/Babylon.js/pull/13108))

### GUI

- Fix GUI json load. - by [carolhmj](https://github.com/carolhmj) ([#13120](https://github.com/BabylonJS/Babylon.js/pull/13120))
- Encode and decode GUI Editor snippet as JSON when needed. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13107](https://github.com/BabylonJS/Babylon.js/pull/13107))

### GUI Editor

- Fix loading of GUIs with custom fonts and add font controls to InputText and InputPassword - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13129](https://github.com/BabylonJS/Babylon.js/pull/13129))
- Encode and decode GUI Editor snippet as JSON when needed. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13107](https://github.com/BabylonJS/Babylon.js/pull/13107))

### Inspector

- Increase the maximum bloom threshold value on the inspector slider - by [kircher1](https://github.com/kircher1) ([#13123](https://github.com/BabylonJS/Babylon.js/pull/13123))

### Loaders

- GLB header length check from exception to warning - by [bghgary](https://github.com/bghgary) ([#13071](https://github.com/BabylonJS/Babylon.js/pull/13071))

### Serializers


## 5.28.0

### Core

- WebGPU fix PCF shadows - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13105](https://github.com/BabylonJS/Babylon.js/pull/13105))
- update the webxr typings to match current state - by [RaananW](https://github.com/RaananW) ([#13104](https://github.com/BabylonJS/Babylon.js/pull/13104))
- A little fix: links referenced in sceneLoader.ts are not found - by [drumath2237](https://github.com/drumath2237) ([#13102](https://github.com/BabylonJS/Babylon.js/pull/13102))
- Adding a parameter for setParent() method that takes into account the pivot change - by [deltakosh](https://github.com/deltakosh) ([#13098](https://github.com/BabylonJS/Babylon.js/pull/13098))
- Add extension support to assetsManager - by [deltakosh](https://github.com/deltakosh) ([#13097](https://github.com/BabylonJS/Babylon.js/pull/13097))
- NullEngine Cannot use a ShadowGenerator - by [sebavan](https://github.com/sebavan) ([#13088](https://github.com/BabylonJS/Babylon.js/pull/13088))
- Hide change for billboard hierarchy with a static flag - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13089](https://github.com/BabylonJS/Babylon.js/pull/13089))

### GUI

- Implement IAnimatable on GUI controls - by [deltakosh](https://github.com/deltakosh) ([#13099](https://github.com/BabylonJS/Babylon.js/pull/13099))

### Inspector

- Texture inspector in Sandbox does not function correctly - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#13090](https://github.com/BabylonJS/Babylon.js/pull/13090))

## 5.27.1

### Core

- Fixed transform gizmos screen size - by [EvgenyRodygin](https://github.com/EvgenyRodygin) ([#13079](https://github.com/BabylonJS/Babylon.js/pull/13079))
- Add epsilon to Quaternion.AreClose - by [BabylonJSGuide](https://github.com/BabylonJSGuide) ([#13083](https://github.com/BabylonJS/Babylon.js/pull/13083))
- Handle CSP violation errors when loading images. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13060](https://github.com/BabylonJS/Babylon.js/pull/13060))
- remove in Place from conjugate comments - by [BabylonJSGuide](https://github.com/BabylonJSGuide) ([#13078](https://github.com/BabylonJS/Babylon.js/pull/13078))
- change CustomProceduralTexture constructor size type - by [Hypnosss](https://github.com/Hypnosss) ([#13080](https://github.com/BabylonJS/Babylon.js/pull/13080))
- prepass reflectivity channel support unlit materials - by [Hypnosss](https://github.com/Hypnosss) ([#13081](https://github.com/BabylonJS/Babylon.js/pull/13081))
- Material block-dirty mechanism - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#13074](https://github.com/BabylonJS/Babylon.js/pull/13074))
- Depth peeling renderer: Add excluded mesh support - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13070](https://github.com/BabylonJS/Babylon.js/pull/13070))

### GUI

- Fix declaration generation when "as" is used - by [RaananW](https://github.com/RaananW) ([#13085](https://github.com/BabylonJS/Babylon.js/pull/13085))

### Materials

- Update waterMaterial.ts - by [xg-qd](https://github.com/xg-qd) ([#13077](https://github.com/BabylonJS/Babylon.js/pull/13077))

## 5.27.0

### Core

- fix glow layer kernel set - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13068](https://github.com/BabylonJS/Babylon.js/pull/13068))
- PBR: Reset all defines when enabling/disabling pbr components - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13067](https://github.com/BabylonJS/Babylon.js/pull/13067))
- Fix Texture Cache - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13057](https://github.com/BabylonJS/Babylon.js/pull/13057))
- InputManager: add a property to disable mesh checking in the onPointerOver event - [_New Feature_] by [Popov72](https://github.com/Popov72) ([#13054](https://github.com/BabylonJS/Babylon.js/pull/13054))
- Fix negative scaling issue with instances - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#13055](https://github.com/BabylonJS/Babylon.js/pull/13055))
- Fix TmpVectors usage in Polar/Spherical toVector methods - by [dr-vortex](https://github.com/dr-vortex) ([#13053](https://github.com/BabylonJS/Babylon.js/pull/13053))
- Optional camera for all post processes - by [EvgenyRodygin](https://github.com/EvgenyRodygin) ([#13051](https://github.com/BabylonJS/Babylon.js/pull/13051))
- Provide Example PGs for Vector2s, for new Vector3s and a couple of Quaternions - by [BabylonJSGuide](https://github.com/BabylonJSGuide) ([#13050](https://github.com/BabylonJS/Babylon.js/pull/13050))
- Don't alter the scene's active cameras in the middle of taking a scre… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13040](https://github.com/BabylonJS/Babylon.js/pull/13040))
- Fix wrong plugin name check for babylon serialization - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#13043](https://github.com/BabylonJS/Babylon.js/pull/13043))

### GUI

- deal with dead codes correctly - by [RaananW](https://github.com/RaananW) ([#13064](https://github.com/BabylonJS/Babylon.js/pull/13064))
- Create mrtkv3 button - by [tayomadein](https://github.com/tayomadein) ([#12989](https://github.com/BabylonJS/Babylon.js/pull/12989))

### Inspector

- Inspector: Raise the limit of samples in SSAO - by [Popov72](https://github.com/Popov72) ([#13052](https://github.com/BabylonJS/Babylon.js/pull/13052))

### Serializers

- Allow GLTF Exporter to export WebP images - by [christaggart](https://github.com/christaggart) ([#13062](https://github.com/BabylonJS/Babylon.js/pull/13062))

## 5.26.1

### Core

- fix declaration generation - by [RaananW](https://github.com/RaananW) ([#13041](https://github.com/BabylonJS/Babylon.js/pull/13041))

### Node Editor

- fix declaration generation - by [RaananW](https://github.com/RaananW) ([#13041](https://github.com/BabylonJS/Babylon.js/pull/13041))

## 5.26.0

### Core

- Add applyPostProcess flag on ADV to optionally draw it after the post… - by [carolhmj](https://github.com/carolhmj) ([#13036](https://github.com/BabylonJS/Babylon.js/pull/13036))
- Remove unneeded prefixes and unused code - by [RaananW](https://github.com/RaananW) ([#13035](https://github.com/BabylonJS/Babylon.js/pull/13035))
- Fix creation of cube textures from URL - by [HoferMarkus](https://github.com/HoferMarkus) ([#13038](https://github.com/BabylonJS/Babylon.js/pull/13038))
- correction - by [BabylonJSGuide](https://github.com/BabylonJSGuide) ([#13031](https://github.com/BabylonJS/Babylon.js/pull/13031))
- Add function to get angles between two vectors (Vector3.GetAnglesBetweenVectorsForDirectionChange) - by [dr-vortex](https://github.com/dr-vortex) ([#13012](https://github.com/BabylonJS/Babylon.js/pull/13012))
- Add smoothing for freeCameraDeviceOrientationInputs - [_New Feature_] by [ilrico](https://github.com/ilrico) ([#13006](https://github.com/BabylonJS/Babylon.js/pull/13006))
- Test babylon octree scene component active meshes - by [Dok11](https://github.com/Dok11) ([#13022](https://github.com/BabylonJS/Babylon.js/pull/13022))
- Add rotation from one vector3 to another - by [BabylonJSGuide](https://github.com/BabylonJSGuide) ([#13004](https://github.com/BabylonJS/Babylon.js/pull/13004))
- Fix instance buffer - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#13021](https://github.com/BabylonJS/Babylon.js/pull/13021))
- Fix SSAO2 sample generation - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#13023](https://github.com/BabylonJS/Babylon.js/pull/13023))
- Adding memory leak tests using heap snapshots - by [RaananW](https://github.com/RaananW) ([#13016](https://github.com/BabylonJS/Babylon.js/pull/13016))
- More features for the aggressive performance mode - by [deltakosh](https://github.com/deltakosh) ([#13014](https://github.com/BabylonJS/Babylon.js/pull/13014))
- Fix fast - by [deltakosh](https://github.com/deltakosh) ([#13015](https://github.com/BabylonJS/Babylon.js/pull/13015))
- Tiny perf fix - by [deltakosh](https://github.com/deltakosh) ([#13011](https://github.com/BabylonJS/Babylon.js/pull/13011))
- Add Logarithmic Depth Support on ParticleSystem - by [deltakosh](https://github.com/deltakosh) ([#13010](https://github.com/BabylonJS/Babylon.js/pull/13010))

### GUI

- add picking for fullscreen ADTs - by [RaananW](https://github.com/RaananW) ([#13039](https://github.com/BabylonJS/Babylon.js/pull/13039))

### GUI Editor

- Some fixes to OptionLineComponent related to wrong parent info showin… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#13026](https://github.com/BabylonJS/Babylon.js/pull/13026))

### Loaders


### Materials

- Fix instance buffer - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#13021](https://github.com/BabylonJS/Babylon.js/pull/13021))

## 5.25.0

### Core

- Move from @hidden to @internal - by [RaananW](https://github.com/RaananW) ([#12999](https://github.com/BabylonJS/Babylon.js/pull/12999))
- Fix effects onError notifications - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#13007](https://github.com/BabylonJS/Babylon.js/pull/13007))
- Fix XR picking in utility laters - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#12998](https://github.com/BabylonJS/Babylon.js/pull/12998))
- Add camera refresh rate support in XR enableSpectatorMode(). - by [daoshengmu](https://github.com/daoshengmu) ([#12958](https://github.com/BabylonJS/Babylon.js/pull/12958))
- Update tubeBuilder docs. - by [carolhmj](https://github.com/carolhmj) ([#12997](https://github.com/BabylonJS/Babylon.js/pull/12997))
- Texture UV animation performance - by [deltakosh](https://github.com/deltakosh) ([#12995](https://github.com/BabylonJS/Babylon.js/pull/12995))
- test(particles.cloudPoint): add tests for intersectsMesh function - by [Dok11](https://github.com/Dok11) ([#12992](https://github.com/BabylonJS/Babylon.js/pull/12992))
- WebGPU: Fix geometry buffer renderer in WebGPU - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#12991](https://github.com/BabylonJS/Babylon.js/pull/12991))
- Fix typings for the options passed - by [RaananW](https://github.com/RaananW) ([#12994](https://github.com/BabylonJS/Babylon.js/pull/12994))
- PrePass renderer: Fix engine current render pass id set too early - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#12988](https://github.com/BabylonJS/Babylon.js/pull/12988))
- distance and normal in collision callback for ammojs - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12986](https://github.com/BabylonJS/Babylon.js/pull/12986))

### GUI Editor

- Issue158 - by [amritanarasimhan](https://github.com/amritanarasimhan) ([#12962](https://github.com/BabylonJS/Babylon.js/pull/12962))
- Font Family Drowpdown - by [amritanarasimhan](https://github.com/amritanarasimhan) ([#12920](https://github.com/BabylonJS/Babylon.js/pull/12920))

## 5.24.0

### Core

- GeometryBufferRenderer: Allow setting the depth texture format - by [Popov72](https://github.com/Popov72) ([#12983](https://github.com/BabylonJS/Babylon.js/pull/12983))
- Fix billboard translation with parenting - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12984](https://github.com/BabylonJS/Babylon.js/pull/12984))
- Add polar and spherical coordinate system support - by [dr-vortex](https://github.com/dr-vortex) ([#12942](https://github.com/BabylonJS/Babylon.js/pull/12942))
- Fix Typos in Physics - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12980](https://github.com/BabylonJS/Babylon.js/pull/12980))
- If blob or data load the image directly, as no caching is needed. - by [RaananW](https://github.com/RaananW) ([#12979](https://github.com/BabylonJS/Babylon.js/pull/12979))
- Add teleportationCircleMaterial to WebXR teleportation options - by [yuripourre](https://github.com/yuripourre) ([#12975](https://github.com/BabylonJS/Babylon.js/pull/12975))
- Add createRadialGradient to ICanvas - by [yuripourre](https://github.com/yuripourre) ([#12976](https://github.com/BabylonJS/Babylon.js/pull/12976))
- test(math.vector): add tests for GetAngleBetweenVectorsOnPlane function - by [Dok11](https://github.com/Dok11) ([#12974](https://github.com/BabylonJS/Babylon.js/pull/12974))
- Babylon eslint plugin - by [RaananW](https://github.com/RaananW) ([#12970](https://github.com/BabylonJS/Babylon.js/pull/12970))
- Fix WebGPU for mobile support. - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12973](https://github.com/BabylonJS/Babylon.js/pull/12973))
- OIT aliasing fixes - by [CraigFeldspar](https://github.com/CraigFeldspar) ([#12916](https://github.com/BabylonJS/Babylon.js/pull/12916))
- ts config for tests (older syntax) for older node.js - by [RaananW](https://github.com/RaananW) ([#12972](https://github.com/BabylonJS/Babylon.js/pull/12972))
- 404 error trying to load “config.json” when using custom procedural texture with ShadersStore - by [deltakosh](https://github.com/deltakosh) ([#12971](https://github.com/BabylonJS/Babylon.js/pull/12971))
- Giz misc - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12969](https://github.com/BabylonJS/Babylon.js/pull/12969))
- Freeze instance storage - by [deltakosh](https://github.com/deltakosh) ([#12966](https://github.com/BabylonJS/Babylon.js/pull/12966))
- Better support for freeze in aggressive mode - by [deltakosh](https://github.com/deltakosh) ([#12964](https://github.com/BabylonJS/Babylon.js/pull/12964))
- Minimize code in effect and pipeline context - by [RaananW](https://github.com/RaananW) ([#12952](https://github.com/BabylonJS/Babylon.js/pull/12952))
- new options for aggressive mode - by [deltakosh](https://github.com/deltakosh) ([#12963](https://github.com/BabylonJS/Babylon.js/pull/12963))
- Introduce autoFixFaceOrientation feature to solidParticleSystem - by [Michalzr](https://github.com/Michalzr) ([#12960](https://github.com/BabylonJS/Babylon.js/pull/12960))

### GUI

- Babylon eslint plugin - by [RaananW](https://github.com/RaananW) ([#12970](https://github.com/BabylonJS/Babylon.js/pull/12970))

### Loaders

- Babylon eslint plugin - by [RaananW](https://github.com/RaananW) ([#12970](https://github.com/BabylonJS/Babylon.js/pull/12970))

### Node Editor

- Some fixes for NME CSS - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12978](https://github.com/BabylonJS/Babylon.js/pull/12978))

### Serializers

- Babylon eslint plugin - by [RaananW](https://github.com/RaananW) ([#12970](https://github.com/BabylonJS/Babylon.js/pull/12970))

## 5.23.0

### Core

- Optimize animation interpolate function - by [bghgary](https://github.com/bghgary) ([#12945](https://github.com/BabylonJS/Babylon.js/pull/12945))
- Performance mode - by [deltakosh](https://github.com/deltakosh) ([#12954](https://github.com/BabylonJS/Babylon.js/pull/12954))
- Fix Rendering Pipeline cameras - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12961](https://github.com/BabylonJS/Babylon.js/pull/12961))
- Fix quaternion blending math - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#12955](https://github.com/BabylonJS/Babylon.js/pull/12955))
- DeviceInputSystem: Pull browser specific code into WebDeviceInputSystem - [_New Feature_] by [PolygonalSun](https://github.com/PolygonalSun) ([#12865](https://github.com/BabylonJS/Babylon.js/pull/12865))
- Fix some NME bugs. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12951](https://github.com/BabylonJS/Babylon.js/pull/12951))
- Sprite double pick - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12949](https://github.com/BabylonJS/Babylon.js/pull/12949))
- Fix Basis Loader - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12947](https://github.com/BabylonJS/Babylon.js/pull/12947))
- Animation perf improvments - by [sebavan](https://github.com/sebavan) ([#12944](https://github.com/BabylonJS/Babylon.js/pull/12944))
- Clear some values used during loading at the end of the load - by [carolhmj](https://github.com/carolhmj) ([#12946](https://github.com/BabylonJS/Babylon.js/pull/12946))
- Added AudioBuffer as parameter for Sound - by [sorskoot](https://github.com/sorskoot) ([#12943](https://github.com/BabylonJS/Babylon.js/pull/12943))

### Loaders

- Fix stl loader right handed - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12957](https://github.com/BabylonJS/Babylon.js/pull/12957))

### Node Editor

- Fix some NME bugs. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12951](https://github.com/BabylonJS/Babylon.js/pull/12951))

## 5.22.1

### Core

- Fix reflection block empty output - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12940](https://github.com/BabylonJS/Babylon.js/pull/12940))
- Fix loading of base64 svgs - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12937](https://github.com/BabylonJS/Babylon.js/pull/12937))
- Empty array, no reassign - by [RaananW](https://github.com/RaananW) ([#12939](https://github.com/BabylonJS/Babylon.js/pull/12939))
- Reducing amount of code in Observable and Logger - by [RaananW](https://github.com/RaananW) ([#12936](https://github.com/BabylonJS/Babylon.js/pull/12936))
- Add dithering effect to image processing. - by [kircher1](https://github.com/kircher1) ([#12932](https://github.com/BabylonJS/Babylon.js/pull/12932))
- Time Factor for crowd agents update - [_New Feature_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12934](https://github.com/BabylonJS/Babylon.js/pull/12934))
- Fix scene not clearing in some Default Rendering Pipeline with multicamera cases - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12905](https://github.com/BabylonJS/Babylon.js/pull/12905))

### GUI

- ADT clone method needs special version - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12935](https://github.com/BabylonJS/Babylon.js/pull/12935))

### GUI Editor

- Add Link offset properties to Gui Editor - by [carolhmj](https://github.com/carolhmj) ([#12933](https://github.com/BabylonJS/Babylon.js/pull/12933))

### Inspector

- Add dithering effect to image processing. - by [kircher1](https://github.com/kircher1) ([#12932](https://github.com/BabylonJS/Babylon.js/pull/12932))

### Materials

- Add dithering effect to image processing. - by [kircher1](https://github.com/kircher1) ([#12932](https://github.com/BabylonJS/Babylon.js/pull/12932))

### Viewer

- Reducing amount of code in Observable and Logger - by [RaananW](https://github.com/RaananW) ([#12936](https://github.com/BabylonJS/Babylon.js/pull/12936))

## 5.22.0

### Core

- Add support of clipplanes in GlowLayer - by [sebavan](https://github.com/sebavan) ([#12925](https://github.com/BabylonJS/Babylon.js/pull/12925))
- Cameras: Add noPreventDefault as argument to attachControl call - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#12927](https://github.com/BabylonJS/Babylon.js/pull/12927))
- Fix Loading Cube Texture from basis file - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12924](https://github.com/BabylonJS/Babylon.js/pull/12924))
- Enforce parent blocks being empty in octree - [_Bug Fix_] by [normanb](https://github.com/normanb) ([#12923](https://github.com/BabylonJS/Babylon.js/pull/12923))
- Two small fixes - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#12918](https://github.com/BabylonJS/Babylon.js/pull/12918))
- Generate sampler name in buildBlock - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12913](https://github.com/BabylonJS/Babylon.js/pull/12913))
- Add type on blob creation - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12912](https://github.com/BabylonJS/Babylon.js/pull/12912))
- Clamp negative rgb values to zero to avoid parse errors in native - [_Bug Fix_] by [docEdub](https://github.com/docEdub) ([#12914](https://github.com/BabylonJS/Babylon.js/pull/12914))
- Fixing oit + derivatives branching - by [CraigFeldspar](https://github.com/CraigFeldspar) ([#12907](https://github.com/BabylonJS/Babylon.js/pull/12907))
- Add "metadata" support to "ReflectionProbe" class - by [julien-moreau](https://github.com/julien-moreau) ([#12911](https://github.com/BabylonJS/Babylon.js/pull/12911))
- Document the ranges of FromHSV's parameters - by [BlakeOne](https://github.com/BlakeOne) ([#12901](https://github.com/BabylonJS/Babylon.js/pull/12901))
- Fix null error in late animation bindings - by [jjv360](https://github.com/jjv360) ([#12909](https://github.com/BabylonJS/Babylon.js/pull/12909))
- InstancedMesh should be cloned with the new source mesh - by [RaananW](https://github.com/RaananW) ([#12904](https://github.com/BabylonJS/Babylon.js/pull/12904))
- Remove tslib reference in es6 packages (First step towards esm) - by [RaananW](https://github.com/RaananW) ([#12897](https://github.com/BabylonJS/Babylon.js/pull/12897))
- Fix picking on ADV to account for texture coordinates - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12902](https://github.com/BabylonJS/Babylon.js/pull/12902))

### GUI

- TouchButton3D's getPressDepth(position) call has depth discrepancy - by [RaananW](https://github.com/RaananW) ([#12910](https://github.com/BabylonJS/Babylon.js/pull/12910))
- Fix drawing a rounded rectangle - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12908](https://github.com/BabylonJS/Babylon.js/pull/12908))
- Fix picking on ADV to account for texture coordinates - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12902](https://github.com/BabylonJS/Babylon.js/pull/12902))

### GUI Editor

- Revert "Fixed a bug from opening editor from PG" - by [RaananW](https://github.com/RaananW) ([#12929](https://github.com/BabylonJS/Babylon.js/pull/12929))
- Fixed a bug from opening editor from PG - by [amritanarasimhan](https://github.com/amritanarasimhan) ([#12899](https://github.com/BabylonJS/Babylon.js/pull/12899))
- Fixed a bug from opening editor from PG - by [amritanarasimhan](https://github.com/amritanarasimhan) ([#12899](https://github.com/BabylonJS/Babylon.js/pull/12899))

### Node Editor


## 5.21.0

### Core

- Use LoadFile when loading images so that WebRequest custom headers ar… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12891](https://github.com/BabylonJS/Babylon.js/pull/12891))
- Allow package name in local files. - by [RaananW](https://github.com/RaananW) ([#12886](https://github.com/BabylonJS/Babylon.js/pull/12886))
- Create a separate callback for the FileButton - by [kircher1](https://github.com/kircher1) ([#12888](https://github.com/BabylonJS/Babylon.js/pull/12888))
- Enable use of Tools.LoadScript in a WebWorker - by [wmurphyrd](https://github.com/wmurphyrd) ([#12884](https://github.com/BabylonJS/Babylon.js/pull/12884))
- Fix is ready in a few scenari (light dirty, rendering pass id, material changes outside render loop) - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12880](https://github.com/BabylonJS/Babylon.js/pull/12880))
- Improve MergeMeshes documentation. - by [carolhmj](https://github.com/carolhmj) ([#12881](https://github.com/BabylonJS/Babylon.js/pull/12881))

### GUI

- Fix Drag/Release Behavior in GUI and Photo Dome - [_New Feature_] by [stevendelapena](https://github.com/stevendelapena) ([#12887](https://github.com/BabylonJS/Babylon.js/pull/12887))
- Allow package name in local files. - by [RaananW](https://github.com/RaananW) ([#12886](https://github.com/BabylonJS/Babylon.js/pull/12886))

### GUI Editor

- Fix a bug where deleting a row/column with a control inside wouldn't … - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12890](https://github.com/BabylonJS/Babylon.js/pull/12890))
- Allow package name in local files. - by [RaananW](https://github.com/RaananW) ([#12886](https://github.com/BabylonJS/Babylon.js/pull/12886))

### Inspector

- Allow package name in local files. - by [RaananW](https://github.com/RaananW) ([#12886](https://github.com/BabylonJS/Babylon.js/pull/12886))
- Create a separate callback for the FileButton - by [kircher1](https://github.com/kircher1) ([#12888](https://github.com/BabylonJS/Babylon.js/pull/12888))

### Loaders

- Allow package name in local files. - by [RaananW](https://github.com/RaananW) ([#12886](https://github.com/BabylonJS/Babylon.js/pull/12886))

### Materials

- Allow package name in local files. - by [RaananW](https://github.com/RaananW) ([#12886](https://github.com/BabylonJS/Babylon.js/pull/12886))

### Node Editor

- Allow package name in local files. - by [RaananW](https://github.com/RaananW) ([#12886](https://github.com/BabylonJS/Babylon.js/pull/12886))

### Playground

- Allow package name in local files. - by [RaananW](https://github.com/RaananW) ([#12886](https://github.com/BabylonJS/Babylon.js/pull/12886))

### Procedural Textures

- Allow package name in local files. - by [RaananW](https://github.com/RaananW) ([#12886](https://github.com/BabylonJS/Babylon.js/pull/12886))

### Serializers

- Allow package name in local files. - by [RaananW](https://github.com/RaananW) ([#12886](https://github.com/BabylonJS/Babylon.js/pull/12886))

## 5.20.0

### Core

- add the ability to configure teleportation and near interaction - by [RaananW](https://github.com/RaananW) ([#12879](https://github.com/BabylonJS/Babylon.js/pull/12879))
- Example Playgrounds for Properties and Methods of Vector3 - by [BabylonJSGuide](https://github.com/BabylonJSGuide) ([#12874](https://github.com/BabylonJS/Babylon.js/pull/12874))
- Fix invisible particles being visible again after a call of buildMesh - by [carolhmj](https://github.com/carolhmj) ([#12878](https://github.com/BabylonJS/Babylon.js/pull/12878))
- Fix tests running locally - by [RaananW](https://github.com/RaananW) ([#12877](https://github.com/BabylonJS/Babylon.js/pull/12877))
- fix signature in scene.ts - by [RaananW](https://github.com/RaananW) ([#12873](https://github.com/BabylonJS/Babylon.js/pull/12873))
- Adds a FileButton to the InspectableTypes - by [kircher1](https://github.com/kircher1) ([#12871](https://github.com/BabylonJS/Babylon.js/pull/12871))
- comment corrections - by [BabylonJSGuide](https://github.com/BabylonJSGuide) ([#12872](https://github.com/BabylonJS/Babylon.js/pull/12872))
- Restore viewport on Procedural Texture Render - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12864](https://github.com/BabylonJS/Babylon.js/pull/12864))
- Fix WebXR helper - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12859](https://github.com/BabylonJS/Babylon.js/pull/12859))
- Nme height2normal - by [deltakosh](https://github.com/deltakosh) ([#12857](https://github.com/BabylonJS/Babylon.js/pull/12857))
- Fix scene serialization and loading issues. - by [carolhmj](https://github.com/carolhmj) ([#12856](https://github.com/BabylonJS/Babylon.js/pull/12856))

### GUI

- Add boolean invertDirection to allow inverting the scrollbar navigati… - by [carolhmj](https://github.com/carolhmj) ([#12867](https://github.com/BabylonJS/Babylon.js/pull/12867))
- Draw rectangles with properly rounded corners - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12876](https://github.com/BabylonJS/Babylon.js/pull/12876))
- Rectangles couldn't get correctly rounded because -2 was subtracted f… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12863](https://github.com/BabylonJS/Babylon.js/pull/12863))

### GUI Editor

- GUI Editor launches from PG with correct size - by [amritanarasimhan](https://github.com/amritanarasimhan) ([#12868](https://github.com/BabylonJS/Babylon.js/pull/12868))
- Created an offset when pasting controls - by [amritanarasimhan](https://github.com/amritanarasimhan) ([#12850](https://github.com/BabylonJS/Babylon.js/pull/12850))
- Pasted controls are selectable - by [amritanarasimhan](https://github.com/amritanarasimhan) ([#12870](https://github.com/BabylonJS/Babylon.js/pull/12870))

### Inspector

- GUI Editor launches from PG with correct size - by [amritanarasimhan](https://github.com/amritanarasimhan) ([#12868](https://github.com/BabylonJS/Babylon.js/pull/12868))
- Adds a FileButton to the InspectableTypes - by [kircher1](https://github.com/kircher1) ([#12871](https://github.com/BabylonJS/Babylon.js/pull/12871))

### Node Editor

- Use glb meshes for sphere and plane in NME preview window - by [deltakosh](https://github.com/deltakosh) ([#12866](https://github.com/BabylonJS/Babylon.js/pull/12866))
- Nme height2normal - by [deltakosh](https://github.com/deltakosh) ([#12857](https://github.com/BabylonJS/Babylon.js/pull/12857))

## 5.19.0

### Core

- Update ComputePressureObserver - by [stefansundin](https://github.com/stefansundin) ([#12858](https://github.com/BabylonJS/Babylon.js/pull/12858))
- Fix issues with basis texture and inspector (display format, preview window and broken texture) - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12853](https://github.com/BabylonJS/Babylon.js/pull/12853))
- Add IGizmo-extending interfaces for standard Gizmo variants - by [Hsifnus](https://github.com/Hsifnus) ([#12852](https://github.com/BabylonJS/Babylon.js/pull/12852))
- Add transform nodes result to assetManager - by [sebavan](https://github.com/sebavan) ([#12849](https://github.com/BabylonJS/Babylon.js/pull/12849))
- Avoid hooking rtt renderList multiple times - by [fchoisy](https://github.com/fchoisy) ([#12843](https://github.com/BabylonJS/Babylon.js/pull/12843))
- Fixed removal of the last geometry in the "scene.geometries" array - by [EvgenyRodygin](https://github.com/EvgenyRodygin) ([#12845](https://github.com/BabylonJS/Babylon.js/pull/12845))
- Add `ZeroReadOnly` to Vector2 and Vector4 - by [chapmankyle](https://github.com/chapmankyle) ([#12846](https://github.com/BabylonJS/Babylon.js/pull/12846))
- Fix getHeightAtCoordinates with Impostors and out of bound - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12842](https://github.com/BabylonJS/Babylon.js/pull/12842))
- Add the possiblity to create custom top level nodes in the scene tree. - [_New Feature_] by [deltakosh](https://github.com/deltakosh) ([#12841](https://github.com/BabylonJS/Babylon.js/pull/12841))
- Export Material Plugin Events - by [sebavan](https://github.com/sebavan) ([#12836](https://github.com/BabylonJS/Babylon.js/pull/12836))
- Move typings to Webgl2RenderingContext - by [sebavan](https://github.com/sebavan) ([#12835](https://github.com/BabylonJS/Babylon.js/pull/12835))

### GUI

- Serialize scrollbar properties. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12854](https://github.com/BabylonJS/Babylon.js/pull/12854))

### GUI Editor

- Fix shortcuts firing while user inputs text - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12855](https://github.com/BabylonJS/Babylon.js/pull/12855))
- GUI Editor Tool buttons now respond on the entire document instead of… - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12844](https://github.com/BabylonJS/Babylon.js/pull/12844))
- Support for scss modules - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#12832](https://github.com/BabylonJS/Babylon.js/pull/12832))

### Inspector

- Fix issues with basis texture and inspector (display format, preview window and broken texture) - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12853](https://github.com/BabylonJS/Babylon.js/pull/12853))
- Add the possiblity to create custom top level nodes in the scene tree. - [_New Feature_] by [deltakosh](https://github.com/deltakosh) ([#12841](https://github.com/BabylonJS/Babylon.js/pull/12841))

### Node Editor

- Support for scss modules - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#12832](https://github.com/BabylonJS/Babylon.js/pull/12832))

### Playground

- allow saving a playground when using snapshots - by [RaananW](https://github.com/RaananW) ([#12834](https://github.com/BabylonJS/Babylon.js/pull/12834))

## 5.18.0

### Core

- Change private members in gizmo to protected - by [braineo](https://github.com/braineo) ([#12796](https://github.com/BabylonJS/Babylon.js/pull/12796))
- Reinstate original version of projectOnPlaneToRef with small amendment - by [sebavan](https://github.com/sebavan) ([#12831](https://github.com/BabylonJS/Babylon.js/pull/12831))
- Add support for Integer attributes - by [sebavan](https://github.com/sebavan) ([#12830](https://github.com/BabylonJS/Babylon.js/pull/12830))
- Fix babylon native sprites - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12819](https://github.com/BabylonJS/Babylon.js/pull/12819))
- Fxi heightmap impostor with Cannon - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12818](https://github.com/BabylonJS/Babylon.js/pull/12818))
- fix missing indexedDB reference in nodejs - by [RaananW](https://github.com/RaananW) ([#12814](https://github.com/BabylonJS/Babylon.js/pull/12814))
- Small changes to EngineView - by [RaananW](https://github.com/RaananW) ([#12816](https://github.com/BabylonJS/Babylon.js/pull/12816))
- Physics typos - by [eoineoineoin](https://github.com/eoineoineoin) ([#12809](https://github.com/BabylonJS/Babylon.js/pull/12809))
- Defensive URL detection - by [RaananW](https://github.com/RaananW) ([#12810](https://github.com/BabylonJS/Babylon.js/pull/12810))
- Use Custom NME Material for shadow map shaders - by [deltakosh](https://github.com/deltakosh) ([#12806](https://github.com/BabylonJS/Babylon.js/pull/12806))

### GUI Editor

- Make sure artboard is resized correctly when resizing the canvas - by [RaananW](https://github.com/RaananW) ([#12828](https://github.com/BabylonJS/Babylon.js/pull/12828))
- differentiating where control is dropped - by [amritanarasimhan](https://github.com/amritanarasimhan) ([#12825](https://github.com/BabylonJS/Babylon.js/pull/12825))
- Moved copy, paste, delete to toolbar - by [amritanarasimhan](https://github.com/amritanarasimhan) ([#12807](https://github.com/BabylonJS/Babylon.js/pull/12807))

### Loaders

- KHR animation pointer - [_New Feature_] by [pandaGaume](https://github.com/pandaGaume) ([#12767](https://github.com/BabylonJS/Babylon.js/pull/12767))

### Serializers

- KHR animation pointer - [_New Feature_] by [pandaGaume](https://github.com/pandaGaume) ([#12767](https://github.com/BabylonJS/Babylon.js/pull/12767))

## 5.17.1

### Core

- Fix crash when loading node material with loadasync - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12805](https://github.com/BabylonJS/Babylon.js/pull/12805))
- Allow creation of baseTexture from internalTexture - by [sebavan](https://github.com/sebavan) ([#12804](https://github.com/BabylonJS/Babylon.js/pull/12804))

## 5.17.0

### Core

- Expose tbn lines - by [deltakosh](https://github.com/deltakosh) ([#12803](https://github.com/BabylonJS/Babylon.js/pull/12803))
- Switch `= ` to `.length = 0` where possible - by [RaananW](https://github.com/RaananW) ([#12802](https://github.com/BabylonJS/Babylon.js/pull/12802))
- InputManager: Removed pointerup check that prevented event from being processed. - by [PolygonalSun](https://github.com/PolygonalSun) ([#12800](https://github.com/BabylonJS/Babylon.js/pull/12800))
- Added `Color3.FromHSV` - by [BarthPaleologue](https://github.com/BarthPaleologue) ([#12799](https://github.com/BabylonJS/Babylon.js/pull/12799))
- Fix render method of RTT not using its active camera - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12794](https://github.com/BabylonJS/Babylon.js/pull/12794))
- Vertex buffer override for native - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12792](https://github.com/BabylonJS/Babylon.js/pull/12792))
- Fix naming convention for parsing from File or snippet - by [RaananW](https://github.com/RaananW) ([#12791](https://github.com/BabylonJS/Babylon.js/pull/12791))
- Fix distorted normals in large-radius flat IcoSpheres. - [_Bug Fix_] by [jemc](https://github.com/jemc) ([#12789](https://github.com/BabylonJS/Babylon.js/pull/12789))
- fix splice hook - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12786](https://github.com/BabylonJS/Babylon.js/pull/12786))
- Add thinInstance creation check if instanced arrays are not supported. - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12782](https://github.com/BabylonJS/Babylon.js/pull/12782))
- Wait to add pending data to the scene before loading screen logic - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12785](https://github.com/BabylonJS/Babylon.js/pull/12785))
- Gizmo/camera fixes - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12779](https://github.com/BabylonJS/Babylon.js/pull/12779))
- Fix crash on smooth shading for meshes with no index buffers on Babylon Native. - [_Bug Fix_] by [SergioRZMasson](https://github.com/SergioRZMasson) ([#12781](https://github.com/BabylonJS/Babylon.js/pull/12781))
- Add computeBoundingBox as a constructor option on SPS. - by [carolhmj](https://github.com/carolhmj) ([#12778](https://github.com/BabylonJS/Babylon.js/pull/12778))
- Check autoClear for RTT to fix utility layer on native OpenXR - [_Bug Fix_] by [rgerd](https://github.com/rgerd) ([#12774](https://github.com/BabylonJS/Babylon.js/pull/12774))

### GUI

- Switch `= ` to `.length = 0` where possible - by [RaananW](https://github.com/RaananW) ([#12802](https://github.com/BabylonJS/Babylon.js/pull/12802))
- Fix naming convention for parsing from File or snippet - by [RaananW](https://github.com/RaananW) ([#12791](https://github.com/BabylonJS/Babylon.js/pull/12791))
- isPointerBlocker fixes - by [carolhmj](https://github.com/carolhmj) ([#12787](https://github.com/BabylonJS/Babylon.js/pull/12787))

### GUI Editor

- Fix gui loading from snippet - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12798](https://github.com/BabylonJS/Babylon.js/pull/12798))
- Fixing design issue with toolbar - by [amritanarasimhan](https://github.com/amritanarasimhan) ([#12797](https://github.com/BabylonJS/Babylon.js/pull/12797))
- pasted controls in the right container - by [amritanarasimhan](https://github.com/amritanarasimhan) ([#12788](https://github.com/BabylonJS/Babylon.js/pull/12788))
- Rolldown Hierarchy - by [amritanarasimhan](https://github.com/amritanarasimhan) ([#12775](https://github.com/BabylonJS/Babylon.js/pull/12775))

### Inspector

- Fix naming convention for parsing from File or snippet - by [RaananW](https://github.com/RaananW) ([#12791](https://github.com/BabylonJS/Babylon.js/pull/12791))
- Gizmo/camera fixes - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12779](https://github.com/BabylonJS/Babylon.js/pull/12779))

### Loaders

- Switch `= ` to `.length = 0` where possible - by [RaananW](https://github.com/RaananW) ([#12802](https://github.com/BabylonJS/Babylon.js/pull/12802))

### Playground

- Fix naming convention for parsing from File or snippet - by [RaananW](https://github.com/RaananW) ([#12791](https://github.com/BabylonJS/Babylon.js/pull/12791))

## 5.16.0

### Core

- Native readPixels implementation - by [ryantrem](https://github.com/ryantrem) ([#12768](https://github.com/BabylonJS/Babylon.js/pull/12768))
- perf: Improve `MaterialHelper` tree-shaking with `LightConstants` - by [yvele](https://github.com/yvele) ([#12771](https://github.com/BabylonJS/Babylon.js/pull/12771))
- Skip some WebAPI calls when setting up VideoTexture in the context of Babylon Native - by [ryantrem](https://github.com/ryantrem) ([#12769](https://github.com/BabylonJS/Babylon.js/pull/12769))
- Use only the mesh's enabled state, not its parent's, when cloning. - by [carolhmj](https://github.com/carolhmj) ([#12766](https://github.com/BabylonJS/Babylon.js/pull/12766))
- Always clone skinned meshes for AssetContainer.instantiateModelsToScene - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#12764](https://github.com/BabylonJS/Babylon.js/pull/12764))
- InputManager: Added mouse buttons 4 and 5 to InputManager mouse handling - by [PolygonalSun](https://github.com/PolygonalSun) ([#12765](https://github.com/BabylonJS/Babylon.js/pull/12765))
- ArcRotateCamera: Modify rotation logic to use invertRotation flag - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#12762](https://github.com/BabylonJS/Babylon.js/pull/12762))
- Expose pendingData APIs publicly - by [sebavan](https://github.com/sebavan) ([#12760](https://github.com/BabylonJS/Babylon.js/pull/12760))
- DeviceInputSystem: Made mousewheel passive option set to false when supported - by [PolygonalSun](https://github.com/PolygonalSun) ([#12761](https://github.com/BabylonJS/Babylon.js/pull/12761))
- Serialize getters instead of private vars - by [carolhmj](https://github.com/carolhmj) ([#12758](https://github.com/BabylonJS/Babylon.js/pull/12758))
- Fix camera cloning of ortho params - by [carolhmj](https://github.com/carolhmj) ([#12753](https://github.com/BabylonJS/Babylon.js/pull/12753))
- Add engine option for using exact sRGB conversions in the shader. - by [kircher1](https://github.com/kircher1) ([#12750](https://github.com/BabylonJS/Babylon.js/pull/12750))

### GUI

- Fix 3D slider observables and visibility - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12759](https://github.com/BabylonJS/Babylon.js/pull/12759))

### GUI Editor

- toolbar can expand now - [_New Feature_] by [amritanarasimhan](https://github.com/amritanarasimhan) ([#12755](https://github.com/BabylonJS/Babylon.js/pull/12755))
- fixed scene tree not sticking - by [amritanarasimhan](https://github.com/amritanarasimhan) ([#12754](https://github.com/BabylonJS/Babylon.js/pull/12754))

### Node Editor

- Remove loading of GLTF files as the current architecture doesn't support them - by [carolhmj](https://github.com/carolhmj) ([#12751](https://github.com/BabylonJS/Babylon.js/pull/12751))

## 5.15.1

### GUI

- Add VirtualKeyboard support to InputTextArea - by [ycaptain](https://github.com/ycaptain) ([#12746](https://github.com/BabylonJS/Babylon.js/pull/12746))

## 5.15.0

### Core

- Make sure legacy support doesn't throw exceptions - by [RaananW](https://github.com/RaananW) ([#12744](https://github.com/BabylonJS/Babylon.js/pull/12744))
- Do not style overlay if custom buttons provided - by [RaananW](https://github.com/RaananW) ([#12738](https://github.com/BabylonJS/Babylon.js/pull/12738))
- Pass ortho camera values down to rigCameras - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12741](https://github.com/BabylonJS/Babylon.js/pull/12741))
- Fix internal plugins that use prepareDefines - by [BlakeOne](https://github.com/BlakeOne) ([#12740](https://github.com/BabylonJS/Babylon.js/pull/12740))
- Export method 'CreateDiscVertexData' - by [chapmankyle](https://github.com/chapmankyle) ([#12725](https://github.com/BabylonJS/Babylon.js/pull/12725))
- Automatically change hardware scaling based on browser zoom level - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#12737](https://github.com/BabylonJS/Babylon.js/pull/12737))
- Add scaleInPlace to Color3 and Color4 - by [kircher1](https://github.com/kircher1) ([#12734](https://github.com/BabylonJS/Babylon.js/pull/12734))
- Volumetric post process: Add support for setMaterialForRendering - by [Popov72](https://github.com/Popov72) ([#12727](https://github.com/BabylonJS/Babylon.js/pull/12727))
- Create screenshot: Fix resources not recreated with the right sizes - by [Popov72](https://github.com/Popov72) ([#12726](https://github.com/BabylonJS/Babylon.js/pull/12726))
- Nme improvements - by [deltakosh](https://github.com/deltakosh) ([#12723](https://github.com/BabylonJS/Babylon.js/pull/12723))
- Basis transcoder update - [_New Feature_] by [vinhui](https://github.com/vinhui) ([#12662](https://github.com/BabylonJS/Babylon.js/pull/12662))
- Initial Device Input Test Pattern Setup: Unit Tests - by [PolygonalSun](https://github.com/PolygonalSun) ([#12702](https://github.com/BabylonJS/Babylon.js/pull/12702))

### GUI

- Make sure legacy support doesn't throw exceptions - by [RaananW](https://github.com/RaananW) ([#12744](https://github.com/BabylonJS/Babylon.js/pull/12744))
- If controls are reordered, relink them to mesh - by [carolhmj](https://github.com/carolhmj) ([#12743](https://github.com/BabylonJS/Babylon.js/pull/12743))
- updated documentation of hoverRadius - by [marpro200](https://github.com/marpro200) ([#12736](https://github.com/BabylonJS/Babylon.js/pull/12736))

### GUI Editor

- Fix gizmos on elements with padded parents - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12739](https://github.com/BabylonJS/Babylon.js/pull/12739))
- Fix delete key issue with NME - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12729](https://github.com/BabylonJS/Babylon.js/pull/12729))

### Inspector

- Fix delete key issue with NME - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12729](https://github.com/BabylonJS/Babylon.js/pull/12729))

### Loaders

- Make sure legacy support doesn't throw exceptions - by [RaananW](https://github.com/RaananW) ([#12744](https://github.com/BabylonJS/Babylon.js/pull/12744))

### Node Editor

- Shortcuts for search and placement - by [deltakosh](https://github.com/deltakosh) ([#12742](https://github.com/BabylonJS/Babylon.js/pull/12742))
- Check if the mouse is over canvas and if it is, stop the scroll from … - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12730](https://github.com/BabylonJS/Babylon.js/pull/12730))
- Remove icon from elbowblock in NME - by [deltakosh](https://github.com/deltakosh) ([#12733](https://github.com/BabylonJS/Babylon.js/pull/12733))
- Fix delete key issue with NME - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12729](https://github.com/BabylonJS/Babylon.js/pull/12729))
- Fix frame export - by [carolhmj](https://github.com/carolhmj) ([#12731](https://github.com/BabylonJS/Babylon.js/pull/12731))
- Nme improvements - by [deltakosh](https://github.com/deltakosh) ([#12723](https://github.com/BabylonJS/Babylon.js/pull/12723))

## 5.14.1

### Node Editor

- Move common controls out of NME - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12720](https://github.com/BabylonJS/Babylon.js/pull/12720))
- Warning for protected block names pops while still typing - by [deltakosh](https://github.com/deltakosh) ([#12719](https://github.com/BabylonJS/Babylon.js/pull/12719))

### Serializers

- Update GLTF Animation serializer to include Camera. - [_Bug Fix_] by [pandaGaume](https://github.com/pandaGaume) ([#12686](https://github.com/BabylonJS/Babylon.js/pull/12686))

## 5.14.0

### Core

- Camera: Remove code execute preventDefault for wheel events - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#12703](https://github.com/BabylonJS/Babylon.js/pull/12703))

### GUI Editor

- Move lock object down the graph - by [deltakosh](https://github.com/deltakosh) ([#12706](https://github.com/BabylonJS/Babylon.js/pull/12706))

### Inspector

- Move lock object down the graph - by [deltakosh](https://github.com/deltakosh) ([#12706](https://github.com/BabylonJS/Babylon.js/pull/12706))

### Node Editor

- Move lock object down the graph - by [deltakosh](https://github.com/deltakosh) ([#12706](https://github.com/BabylonJS/Babylon.js/pull/12706))
- move more code to shared-ui - by [deltakosh](https://github.com/deltakosh) ([#12691](https://github.com/BabylonJS/Babylon.js/pull/12691))

## 5.13.3

### Loaders

- Fix loading skinned model with multiple primitives - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#12701](https://github.com/BabylonJS/Babylon.js/pull/12701))

## 5.13.2

### Node Editor


## 5.13.1

### Core

- Engine: Add event listener to disable right-click menu when there's a canvas element - by [PolygonalSun](https://github.com/PolygonalSun) ([#12697](https://github.com/BabylonJS/Babylon.js/pull/12697))
- DeviceInputSystem: Fixed Passive Support Check to prevent Violation Warning - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#12696](https://github.com/BabylonJS/Babylon.js/pull/12696))

### GUI Editor

- Fix snippet loading on GUI Editor - by [carolhmj](https://github.com/carolhmj) ([#12699](https://github.com/BabylonJS/Babylon.js/pull/12699))

### Node Editor

- Fix node decomposing at drop time - by [deltakosh](https://github.com/deltakosh) ([#12698](https://github.com/BabylonJS/Babylon.js/pull/12698))

## 5.13.0

### Core

- Fix skeleton update cache - by [carolhmj](https://github.com/carolhmj) ([#12695](https://github.com/BabylonJS/Babylon.js/pull/12695))
- Added code to track buttons pressed while meta key is active on MacOS - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#12693](https://github.com/BabylonJS/Babylon.js/pull/12693))
- Fix serialization when objects have InstancedMesh parents - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12690](https://github.com/BabylonJS/Babylon.js/pull/12690))
- Turning on two eslint rules - by [RaananW](https://github.com/RaananW) ([#12681](https://github.com/BabylonJS/Babylon.js/pull/12681))
- Fix parallaxOcclusion not being reset - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12688](https://github.com/BabylonJS/Babylon.js/pull/12688))
- Add support for clip planes to the depth renderer - by [fchoisy](https://github.com/fchoisy) ([#12685](https://github.com/BabylonJS/Babylon.js/pull/12685))
- Add support for more depth stencil formats. - by [kircher1](https://github.com/kircher1) ([#12675](https://github.com/BabylonJS/Babylon.js/pull/12675))
- Add warning to Bounding Box Gizmo - by [carolhmj](https://github.com/carolhmj) ([#12679](https://github.com/BabylonJS/Babylon.js/pull/12679))
- Add warning to Bounding Box Gizmo - by [carolhmj](https://github.com/carolhmj) ([#12551](https://github.com/BabylonJS/Babylon.js/pull/12551))
- createTexture onLoad callback passes the texture as arguments - by [sebavan](https://github.com/sebavan) ([#12674](https://github.com/BabylonJS/Babylon.js/pull/12674))
- Fix GL error originating from createDepthStencilTexture on WebGL1. - by [kircher1](https://github.com/kircher1) ([#12676](https://github.com/BabylonJS/Babylon.js/pull/12676))

### GUI

- Turning on two eslint rules - by [RaananW](https://github.com/RaananW) ([#12681](https://github.com/BabylonJS/Babylon.js/pull/12681))
- Fix pointer up event on leave canvas - by [carolhmj](https://github.com/carolhmj) ([#12677](https://github.com/BabylonJS/Babylon.js/pull/12677))

### GUI Editor

- Turning on two eslint rules - by [RaananW](https://github.com/RaananW) ([#12681](https://github.com/BabylonJS/Babylon.js/pull/12681))
- Load shared-ui-components from src and not dist - by [RaananW](https://github.com/RaananW) ([#12680](https://github.com/BabylonJS/Babylon.js/pull/12680))

### Inspector

- Turning on two eslint rules - by [RaananW](https://github.com/RaananW) ([#12681](https://github.com/BabylonJS/Babylon.js/pull/12681))

### Loaders

- Turning on two eslint rules - by [RaananW](https://github.com/RaananW) ([#12681](https://github.com/BabylonJS/Babylon.js/pull/12681))
- Fix issue with glTF skin node/mesh metadata - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#12684](https://github.com/BabylonJS/Babylon.js/pull/12684))

### Node Editor

- Save the texture url in the name so its not overwritten on render. - by [carolhmj](https://github.com/carolhmj) ([#12692](https://github.com/BabylonJS/Babylon.js/pull/12692))
- Turning on two eslint rules - by [RaananW](https://github.com/RaananW) ([#12681](https://github.com/BabylonJS/Babylon.js/pull/12681))
- Load shared-ui-components from src and not dist - by [RaananW](https://github.com/RaananW) ([#12680](https://github.com/BabylonJS/Babylon.js/pull/12680))

### Playground

- Turning on two eslint rules - by [RaananW](https://github.com/RaananW) ([#12681](https://github.com/BabylonJS/Babylon.js/pull/12681))

### Serializers

- Only export material from mesh with geometry - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#12694](https://github.com/BabylonJS/Babylon.js/pull/12694))
- Turning on two eslint rules - by [RaananW](https://github.com/RaananW) ([#12681](https://github.com/BabylonJS/Babylon.js/pull/12681))
- Wrong rotation offset camera correction - [_Bug Fix_] by [pandaGaume](https://github.com/pandaGaume) ([#12682](https://github.com/BabylonJS/Babylon.js/pull/12682))

## 5.12.1

## 5.12.0

### Core

- Added referrer policy support to GUI Image to control xhr request header - by [BrunevalPE](https://github.com/BrunevalPE) ([#12664](https://github.com/BabylonJS/Babylon.js/pull/12664))
- fix cache miss with instances out of frustrum - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12672](https://github.com/BabylonJS/Babylon.js/pull/12672))
- webgpu update - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12671](https://github.com/BabylonJS/Babylon.js/pull/12671))
- Add params scene, mesh to function getAttributes - by [BlakeOne](https://github.com/BlakeOne) ([#12668](https://github.com/BabylonJS/Babylon.js/pull/12668))
- Adds ExtrudeShape* options firstNormal and adjustFrame - by [Lowclouds](https://github.com/Lowclouds) ([#12659](https://github.com/BabylonJS/Babylon.js/pull/12659))
- Inspectable options fix - [_Bug Fix_] by [GordonTombola](https://github.com/GordonTombola) ([#12669](https://github.com/BabylonJS/Babylon.js/pull/12669))
- Force render with just that camera on CreateScreenshot - by [carolhmj](https://github.com/carolhmj) ([#12656](https://github.com/BabylonJS/Babylon.js/pull/12656))
- changes to minZ and maxZ while a session is running should update the XR session - by [RaananW](https://github.com/RaananW) ([#12667](https://github.com/BabylonJS/Babylon.js/pull/12667))
- Added Quaternion support in `ShaderMaterial` - by [BarthPaleologue](https://github.com/BarthPaleologue) ([#12641](https://github.com/BabylonJS/Babylon.js/pull/12641))
- Bug Fix - Vector3 project on plane - by [strutcode](https://github.com/strutcode) ([#12663](https://github.com/BabylonJS/Babylon.js/pull/12663))
- add support for custom attributes to convertToUnIndexedMesh - by [BlakeOne](https://github.com/BlakeOne) ([#12666](https://github.com/BabylonJS/Babylon.js/pull/12666))
- Fix bug that prevents subsequent elapsed time queries from completing - by [kircher1](https://github.com/kircher1) ([#12660](https://github.com/BabylonJS/Babylon.js/pull/12660))

### GUI

- Added referrer policy support to GUI Image to control xhr request header - by [BrunevalPE](https://github.com/BrunevalPE) ([#12664](https://github.com/BabylonJS/Babylon.js/pull/12664))
- Creation of InputTextArea component - by [Valerian-Perez-Wanadev](https://github.com/Valerian-Perez-Wanadev) ([#11710](https://github.com/BabylonJS/Babylon.js/pull/11710))

### GUI Editor


### Materials

- fix cache miss with instances out of frustrum - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12672](https://github.com/BabylonJS/Babylon.js/pull/12672))

### Node Editor

- Add meta key to the possible multi selection keys on NME - by [carolhmj](https://github.com/carolhmj) ([#12657](https://github.com/BabylonJS/Babylon.js/pull/12657))

### Playground


### Viewer


## 5.11.0

### Core

- Fix texture caching. - by [carolhmj](https://github.com/carolhmj) ([#12652](https://github.com/BabylonJS/Babylon.js/pull/12652))
- Camera: Modified isMouseEvent bool logic for Safari - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#12655](https://github.com/BabylonJS/Babylon.js/pull/12655))
- Prepare plugin defines after material helper defines - by [BlakeOne](https://github.com/BlakeOne) ([#12643](https://github.com/BabylonJS/Babylon.js/pull/12643))
- Fix SSR and procedural textures clear order - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12646](https://github.com/BabylonJS/Babylon.js/pull/12646))
- Fix dirty on inactive meshes - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12645](https://github.com/BabylonJS/Babylon.js/pull/12645))
- Use the errorcallback to report errors - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#12647](https://github.com/BabylonJS/Babylon.js/pull/12647))
- Camera: Added divide by zero check FreeCameraTouchInput - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#12649](https://github.com/BabylonJS/Babylon.js/pull/12649))
- Fixed GPU Gems URL in API docs - [_Bug Fix_] by [cx20](https://github.com/cx20) ([#12644](https://github.com/BabylonJS/Babylon.js/pull/12644))
- Material plugins: Allow group replacements in injected code when using regular expression - by [Popov72](https://github.com/Popov72) ([#12642](https://github.com/BabylonJS/Babylon.js/pull/12642))
- Add custom attributes for material plugins - by [BlakeOne](https://github.com/BlakeOne) ([#12640](https://github.com/BabylonJS/Babylon.js/pull/12640))

### GUI

- make sure component init before render - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#12651](https://github.com/BabylonJS/Babylon.js/pull/12651))

### GUI Editor

- Fix deletion of Grid items in Editor, also fix... - by [carolhmj](https://github.com/carolhmj) ([#12653](https://github.com/BabylonJS/Babylon.js/pull/12653))

### Loaders

- deprecate gltf 1.0 modules - by [RaananW](https://github.com/RaananW) ([#12648](https://github.com/BabylonJS/Babylon.js/pull/12648))

## 5.10.0

### Inspector

- Disallow users to change the frame of the first key, ensuring that th… - by [carolhmj](https://github.com/carolhmj) ([#12622](https://github.com/BabylonJS/Babylon.js/pull/12622))

## 5.9.1

### Core

- Add a catch - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12638](https://github.com/BabylonJS/Babylon.js/pull/12638))
- Fix pointer hover on descendant controls when action manager is recursive - by [carolhmj](https://github.com/carolhmj) ([#12637](https://github.com/BabylonJS/Babylon.js/pull/12637))
- Support for extracting bloom highlights with luminance >1 - by [kircher1](https://github.com/kircher1) ([#12636](https://github.com/BabylonJS/Babylon.js/pull/12636))
- No need to clear (depth) in utility layer - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#12613](https://github.com/BabylonJS/Babylon.js/pull/12613))
- Serialize iridescene in PBR materials - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12632](https://github.com/BabylonJS/Babylon.js/pull/12632))
- Fix where canvas could have a blue highlight effect on tap. - by [saaratrix](https://github.com/saaratrix) ([#12635](https://github.com/BabylonJS/Babylon.js/pull/12635))
- Added ```setQuaternion``` to ```Effect``` - by [BarthPaleologue](https://github.com/BarthPaleologue) ([#12633](https://github.com/BabylonJS/Babylon.js/pull/12633))
- Force createGlobalSubmesh in Mesh.SetVerticesData if Mesh is Unindexed - by [barroij](https://github.com/barroij) ([#12629](https://github.com/BabylonJS/Babylon.js/pull/12629))

## 5.9.0

### Core

- Fix Lines vertex alpha - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12623](https://github.com/BabylonJS/Babylon.js/pull/12623))
- Fix JPEG environment texture - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12617](https://github.com/BabylonJS/Babylon.js/pull/12617))
- Improve CheckIsReady in scene - by [sebavan](https://github.com/sebavan) ([#12625](https://github.com/BabylonJS/Babylon.js/pull/12625))
- Added a few methods to Quaternion and Vector3 - by [BarthPaleologue](https://github.com/BarthPaleologue) ([#12598](https://github.com/BabylonJS/Babylon.js/pull/12598))
- deprecate action manager array in scene - by [RaananW](https://github.com/RaananW) ([#12620](https://github.com/BabylonJS/Babylon.js/pull/12620))
- Scene.multiPickWithRay signature correction - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#12621](https://github.com/BabylonJS/Babylon.js/pull/12621))
- Removed IE support. It was long overdue ;) - by [deltakosh](https://github.com/deltakosh) ([#12563](https://github.com/BabylonJS/Babylon.js/pull/12563))
- Fix registerInstancedBuffer after Mesh creation - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12609](https://github.com/BabylonJS/Babylon.js/pull/12609))
- Added forcedExtension option to textur creation - by [MBecherKurz](https://github.com/MBecherKurz) ([#12612](https://github.com/BabylonJS/Babylon.js/pull/12612))

### GUI

- Enable iridescence map in MRDL backplate material - by [rgerd](https://github.com/rgerd) ([#12618](https://github.com/BabylonJS/Babylon.js/pull/12618))
- Grid children disappear once linked mesh is outside view - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#12607](https://github.com/BabylonJS/Babylon.js/pull/12607))

### Inspector

- Move frame bar on ACE to the top of the window - by [carolhmj](https://github.com/carolhmj) ([#12590](https://github.com/BabylonJS/Babylon.js/pull/12590))

### Loaders

- Removed IE support. It was long overdue ;) - by [deltakosh](https://github.com/deltakosh) ([#12563](https://github.com/BabylonJS/Babylon.js/pull/12563))

### Materials

- Fix JPEG environment texture - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12617](https://github.com/BabylonJS/Babylon.js/pull/12617))

### Node Editor

- Fix NME dialog box styling - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12624](https://github.com/BabylonJS/Babylon.js/pull/12624))

### Viewer

- Removed IE support. It was long overdue ;) - by [deltakosh](https://github.com/deltakosh) ([#12563](https://github.com/BabylonJS/Babylon.js/pull/12563))

## 5.8.2

### Core

- Point Cloud System: Add getters - by [Popov72](https://github.com/Popov72) ([#12605](https://github.com/BabylonJS/Babylon.js/pull/12605))
- Small fixes for gizmo and navigation - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12603](https://github.com/BabylonJS/Babylon.js/pull/12603))

## 5.8.1

### Core

- Add new prepass to compute the specularity-glossiness map whatever the material type - by [Mannns](https://github.com/Mannns) ([#12523](https://github.com/BabylonJS/Babylon.js/pull/12523))
- Add missing observer trigger - onLoadedObservable notify method for hdrCubeTexture - by [slash9494](https://github.com/slash9494) ([#12601](https://github.com/BabylonJS/Babylon.js/pull/12601))
- remove private variables from WebGPU declaration - by [RaananW](https://github.com/RaananW) ([#12596](https://github.com/BabylonJS/Babylon.js/pull/12596))
- Fix render frame identification issue with instances - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12597](https://github.com/BabylonJS/Babylon.js/pull/12597))
- Fix `AssetManager` `addTextureTask` resolving with `task.texture === undefined` when using `NullEngine` - by [alvov-evo](https://github.com/alvov-evo) ([#12595](https://github.com/BabylonJS/Babylon.js/pull/12595))
- InputManager: Fix Picking on PointerUp and add bool to skip pointerup picking - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#12524](https://github.com/BabylonJS/Babylon.js/pull/12524))
- Make scene param optional for NodeMaterial.ParseFromSnippetAsync - by [BlakeOne](https://github.com/BlakeOne) ([#12592](https://github.com/BabylonJS/Babylon.js/pull/12592))
- fix memory leak - by [deltakosh](https://github.com/deltakosh) ([#12594](https://github.com/BabylonJS/Babylon.js/pull/12594))
- WebGPU: fix typescript - by [Popov72](https://github.com/Popov72) ([#12589](https://github.com/BabylonJS/Babylon.js/pull/12589))

### Serializers

- GLTFSerializer : Ext mesh gpu instancing - by [pandaGaume](https://github.com/pandaGaume) ([#12495](https://github.com/BabylonJS/Babylon.js/pull/12495))

### Viewer


## 5.8.0

### Core

- minor improvements to `toEulerAnglesTo()` - by [nmrugg](https://github.com/nmrugg) ([#12588](https://github.com/BabylonJS/Babylon.js/pull/12588))
- DeviceInputSystem: Add check for matchMedia in WebDeviceInputSystem - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#12586](https://github.com/BabylonJS/Babylon.js/pull/12586))
- Fix memoryleak - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12585](https://github.com/BabylonJS/Babylon.js/pull/12585))
- Fix ThinEngine.updateDynamicIndexBuffer - by [barroij](https://github.com/barroij) ([#12564](https://github.com/BabylonJS/Babylon.js/pull/12564))
- Add sRGB handling for ETC texture formats - by [kircher1](https://github.com/kircher1) ([#12567](https://github.com/BabylonJS/Babylon.js/pull/12567))
- Add warning to Bounding Box Gizmo - by [carolhmj](https://github.com/carolhmj) ([#12551](https://github.com/BabylonJS/Babylon.js/pull/12551))
- Check if document is available before accessing it - by [antoine-gannat](https://github.com/antoine-gannat) ([#12571](https://github.com/BabylonJS/Babylon.js/pull/12571))
- WebGPU: Synchronize with spec - by [Popov72](https://github.com/Popov72) ([#12569](https://github.com/BabylonJS/Babylon.js/pull/12569))
- Fix prepass view uniform - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12562](https://github.com/BabylonJS/Babylon.js/pull/12562))
- Make setMaterialForRenderPass call resetDrawCache - by [BlakeOne](https://github.com/BlakeOne) ([#12561](https://github.com/BabylonJS/Babylon.js/pull/12561))
- Make Mesh.increaseVertices() work without uvs or normals; set default… - by [OptiStrat](https://github.com/OptiStrat) ([#12559](https://github.com/BabylonJS/Babylon.js/pull/12559))
- Fix return type for CreateGround - by [BlakeOne](https://github.com/BlakeOne) ([#12557](https://github.com/BabylonJS/Babylon.js/pull/12557))
- Fix Instances Color Alpha - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12555](https://github.com/BabylonJS/Babylon.js/pull/12555))
- Add sRGB option to 2D RawTexture - by [kircher1](https://github.com/kircher1) ([#12553](https://github.com/BabylonJS/Babylon.js/pull/12553))
- Allow HDR texture types in DepthOfFieldBlurPostProcess - [_Bug Fix_] by [kircher1](https://github.com/kircher1) ([#12556](https://github.com/BabylonJS/Babylon.js/pull/12556))
- Fix abstractMesh scaling overloads - by [deltakosh](https://github.com/deltakosh) ([#12550](https://github.com/BabylonJS/Babylon.js/pull/12550))
- if pick exists, make sure to return it - by [RaananW](https://github.com/RaananW) ([#12552](https://github.com/BabylonJS/Babylon.js/pull/12552))
- Add param skipBuild when parsing node material - by [BlakeOne](https://github.com/BlakeOne) ([#12548](https://github.com/BabylonJS/Babylon.js/pull/12548))
- Fix nme tangents back compat and instance color - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12547](https://github.com/BabylonJS/Babylon.js/pull/12547))

### Inspector

- PBR refractionIntensityTexture in the inspector - by [sebavan](https://github.com/sebavan) ([#12572](https://github.com/BabylonJS/Babylon.js/pull/12572))

### Loaders

- Add missing interpolation to glTF animation key targeting weights - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#12584](https://github.com/BabylonJS/Babylon.js/pull/12584))
- Fix nme tangents back compat and instance color - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12547](https://github.com/BabylonJS/Babylon.js/pull/12547))

### Materials

- Fix Instances Color Alpha - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12555](https://github.com/BabylonJS/Babylon.js/pull/12555))

### Node Editor

- Fix nme tangents back compat and instance color - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12547](https://github.com/BabylonJS/Babylon.js/pull/12547))
- fix wheel behaviour and overscroll - by [3GOMESz](https://github.com/3GOMESz) ([#12537](https://github.com/BabylonJS/Babylon.js/pull/12537))

### Viewer

- Prevent calling stop recursively - by [RaananW](https://github.com/RaananW) ([#12570](https://github.com/BabylonJS/Babylon.js/pull/12570))

## 5.7.0

### Core

- Fix ClearCoat Refraction V direction - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12539](https://github.com/BabylonJS/Babylon.js/pull/12539))
- Fixed Logic for FreeCameraTouchInput to properly detect when input is mouse input - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#12541](https://github.com/BabylonJS/Babylon.js/pull/12541))

### GUI

- Add custom word divider for TextBlock - by [miudit](https://github.com/miudit) ([#12512](https://github.com/BabylonJS/Babylon.js/pull/12512))

### GUI Editor

- Add modules compilation - by [RaananW](https://github.com/RaananW) ([#12532](https://github.com/BabylonJS/Babylon.js/pull/12532))

### Loaders

- Problems loading .obj with groups. - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12546](https://github.com/BabylonJS/Babylon.js/pull/12546))

### Node Editor

- Add modules compilation - by [RaananW](https://github.com/RaananW) ([#12532](https://github.com/BabylonJS/Babylon.js/pull/12532))

### Viewer

- Add modules compilation - by [RaananW](https://github.com/RaananW) ([#12532](https://github.com/BabylonJS/Babylon.js/pull/12532))

## 5.6.1

### Core

- Add Safari 15.4 to Exception list - by [RaananW](https://github.com/RaananW) ([#12534](https://github.com/BabylonJS/Babylon.js/pull/12534))
- Add a warning when using ignored options with Dashed Lines update. - by [carolhmj](https://github.com/carolhmj) ([#12509](https://github.com/BabylonJS/Babylon.js/pull/12509))
- Exposed Native Engine capabilities to Babylon.js, fixes morph targets on Babylon Native Android - [_Bug Fix_] by [SergioRZMasson](https://github.com/SergioRZMasson) ([#12515](https://github.com/BabylonJS/Babylon.js/pull/12515))
- Fix inspector not working after download - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#12533](https://github.com/BabylonJS/Babylon.js/pull/12533))
- Fix SubMesh IsGlobal - by [BlakeOne](https://github.com/BlakeOne) ([#12529](https://github.com/BabylonJS/Babylon.js/pull/12529))
- Fix doc for property "bloomThreshold" - by [BlakeOne](https://github.com/BlakeOne) ([#12530](https://github.com/BabylonJS/Babylon.js/pull/12530))
- Add getNormalsData to AbstractMesh and refactor common part with getP… - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#12498](https://github.com/BabylonJS/Babylon.js/pull/12498))
- Fixed easing function links in API docs - by [cx20](https://github.com/cx20) ([#12527](https://github.com/BabylonJS/Babylon.js/pull/12527))
- Fix Mirror Reflection in right handed system - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12521](https://github.com/BabylonJS/Babylon.js/pull/12521))
- Add a constant for the Snippet Server URL in all dev packages. - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#12520](https://github.com/BabylonJS/Babylon.js/pull/12520))
- Fix: NME TBNBlock world input doesn't work if connected to a vertex node - [_Bug Fix_] by [MiikaH](https://github.com/MiikaH) ([#12519](https://github.com/BabylonJS/Babylon.js/pull/12519))
- Add sRGB option to MultiRenderTarget - by [kircher1](https://github.com/kircher1) ([#12516](https://github.com/BabylonJS/Babylon.js/pull/12516))
- Fix Scissor Doc - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12518](https://github.com/BabylonJS/Babylon.js/pull/12518))

### GUI

- Add a constant for the Snippet Server URL in all dev packages. - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#12520](https://github.com/BabylonJS/Babylon.js/pull/12520))

### Inspector

- Add a constant for the Snippet Server URL in all dev packages. - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#12520](https://github.com/BabylonJS/Babylon.js/pull/12520))

### Loaders


### Node Editor

- Fix: NME TBNBlock world input doesn't work if connected to a vertex node - [_Bug Fix_] by [MiikaH](https://github.com/MiikaH) ([#12519](https://github.com/BabylonJS/Babylon.js/pull/12519))

### Playground

- Add Safari 15.4 to Exception list - by [RaananW](https://github.com/RaananW) ([#12534](https://github.com/BabylonJS/Babylon.js/pull/12534))
- Fix inspector not working after download - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#12533](https://github.com/BabylonJS/Babylon.js/pull/12533))
- Add a constant for the Snippet Server URL in all dev packages. - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#12520](https://github.com/BabylonJS/Babylon.js/pull/12520))

## 5.6.0

### Core

- Plumb through useSRGBBuffer for _createInternalTexture. - by [kircher1](https://github.com/kircher1) ([#12511](https://github.com/BabylonJS/Babylon.js/pull/12511))
- Make NME TBNBlock fragment compatible - by [MiikaH](https://github.com/MiikaH) ([#12510](https://github.com/BabylonJS/Babylon.js/pull/12510))
- Fix NME Morph block with tangents - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12493](https://github.com/BabylonJS/Babylon.js/pull/12493))
- Fix PointerDragBehavior to account for button context, add button filter - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#12499](https://github.com/BabylonJS/Babylon.js/pull/12499))
- Fix BoundingBoxGizmo rotate incorrectly when using RightHand system. - by [gongsiyi123](https://github.com/gongsiyi123) ([#12505](https://github.com/BabylonJS/Babylon.js/pull/12505))
- Still test disable meshes because gltf loaders them them on later - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12487](https://github.com/BabylonJS/Babylon.js/pull/12487))

### Loaders


## 5.5.6

### Core

- Skip modifications of babylon CDN web requests - by [RaananW](https://github.com/RaananW) ([#12503](https://github.com/BabylonJS/Babylon.js/pull/12503))
- Fix ubo not of the right size when using material plugins - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#12502](https://github.com/BabylonJS/Babylon.js/pull/12502))
- Changed rendering group for local axes to make them render on top. - by [reimund](https://github.com/reimund) ([#12490](https://github.com/BabylonJS/Babylon.js/pull/12490))
- NME Generate code has error on ColorMergerBlock - by [deltakosh](https://github.com/deltakosh) ([#12494](https://github.com/BabylonJS/Babylon.js/pull/12494))
- Add support for COMPRESSED_SRGB_S3TC_DXT1_EXT - by [kircher1](https://github.com/kircher1) ([#12488](https://github.com/BabylonJS/Babylon.js/pull/12488))
- Add creation of sRGB Render Targets - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#12486](https://github.com/BabylonJS/Babylon.js/pull/12486))
- warning and checks for noimpostor children - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12482](https://github.com/BabylonJS/Babylon.js/pull/12482))
- Fixed wrong matrix used when creating local rotation axes. - by [reimund](https://github.com/reimund) ([#12485](https://github.com/BabylonJS/Babylon.js/pull/12485))
- Optimize rendering to reuse material as much as possible - by [deltakosh](https://github.com/deltakosh) ([#12477](https://github.com/BabylonJS/Babylon.js/pull/12477))
- reduce the call to dirty - by [deltakosh](https://github.com/deltakosh) ([#12475](https://github.com/BabylonJS/Babylon.js/pull/12475))

### Loaders


### Serializers

- GLTFSerializer : Prevent empty skin to export invalid GLTF - by [pandaGaume](https://github.com/pandaGaume) ([#12489](https://github.com/BabylonJS/Babylon.js/pull/12489))

### Viewer

- fix viewer import from loaders - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#12480](https://github.com/BabylonJS/Babylon.js/pull/12480))

## 5.5.5

### Core

- More perf improvements - by [deltakosh](https://github.com/deltakosh) ([#12476](https://github.com/BabylonJS/Babylon.js/pull/12476))
- Make AbstractMesh props protected instead of private - by [barroij](https://github.com/barroij) ([#12478](https://github.com/BabylonJS/Babylon.js/pull/12478))
- Instance color mixing - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12472](https://github.com/BabylonJS/Babylon.js/pull/12472))

### GUI Editor

- typescript update, fix build - by [RaananW](https://github.com/RaananW) ([#12479](https://github.com/BabylonJS/Babylon.js/pull/12479))

### Inspector

- typescript update, fix build - by [RaananW](https://github.com/RaananW) ([#12479](https://github.com/BabylonJS/Babylon.js/pull/12479))

### Materials

- Instance color mixing - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12472](https://github.com/BabylonJS/Babylon.js/pull/12472))

### Node Editor

- typescript update, fix build - by [RaananW](https://github.com/RaananW) ([#12479](https://github.com/BabylonJS/Babylon.js/pull/12479))

## 5.5.0

### Core

- better isReadyCheck - by [deltakosh](https://github.com/deltakosh) ([#12474](https://github.com/BabylonJS/Babylon.js/pull/12474))
- remove prototype morph - by [deltakosh](https://github.com/deltakosh) ([#12473](https://github.com/BabylonJS/Babylon.js/pull/12473))
- Create a TBN NME node to handle tangent space orientation - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12461](https://github.com/BabylonJS/Babylon.js/pull/12461))
- Tiny perf improvement - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12470](https://github.com/BabylonJS/Babylon.js/pull/12470))
- no plane update for axis gizmos - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12468](https://github.com/BabylonJS/Babylon.js/pull/12468))
- Add the possibility to pass forcedExtension for a serialized environment texture - by [ton-solutions](https://github.com/ton-solutions) ([#12462](https://github.com/BabylonJS/Babylon.js/pull/12462))
- Missing null for First go to frame in Animation - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12465](https://github.com/BabylonJS/Babylon.js/pull/12465))
- Fix GetAngleBetweenVectors precision issue - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12460](https://github.com/BabylonJS/Babylon.js/pull/12460))
- Add backward compatibability for param kind to be "color" for thin instance methods - by [BlakeOne](https://github.com/BlakeOne) ([#12433](https://github.com/BabylonJS/Babylon.js/pull/12433))
- fix tsdoc and add an entry point to set improvementMode for SceneOpti… - by [deltakosh](https://github.com/deltakosh) ([#12456](https://github.com/BabylonJS/Babylon.js/pull/12456))
- Save resources by not binding a color texture to a render target - by [Popov72](https://github.com/Popov72) ([#12455](https://github.com/BabylonJS/Babylon.js/pull/12455))
- Fix PBR input textures typings. - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12454](https://github.com/BabylonJS/Babylon.js/pull/12454))

### GUI

- Nine patch overlap fix - [_Bug Fix_] by [Pryme8](https://github.com/Pryme8) ([#12464](https://github.com/BabylonJS/Babylon.js/pull/12464))
- Add feature testing to text metrics width - [_Bug Fix_] by [darraghjburke](https://github.com/darraghjburke) ([#12467](https://github.com/BabylonJS/Babylon.js/pull/12467))

### GUI Editor

- Remove BABYLON namespace references in the Inspector - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#12458](https://github.com/BabylonJS/Babylon.js/pull/12458))

### Inspector

- Remove BABYLON namespace references in the Inspector - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#12458](https://github.com/BabylonJS/Babylon.js/pull/12458))

### Loaders

- Fix infinite recursion with glTF skeleton - [_Bug Fix_] by [bghgary](https://github.com/bghgary) ([#12469](https://github.com/BabylonJS/Babylon.js/pull/12469))
- Fix PBR input textures typings. - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12454](https://github.com/BabylonJS/Babylon.js/pull/12454))

### Node Editor

- Create a TBN NME node to handle tangent space orientation - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12461](https://github.com/BabylonJS/Babylon.js/pull/12461))
- Fix light selection in Light Information Block - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12466](https://github.com/BabylonJS/Babylon.js/pull/12466))

### Viewer

- fix default material init - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#12463](https://github.com/BabylonJS/Babylon.js/pull/12463))

## 5.4.0

### Core

- WebGPU: more changes and fixes for stencil support - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#12452](https://github.com/BabylonJS/Babylon.js/pull/12452))
- WebGPU: Fix crash when creating the engine without stencil buffer support - by [Popov72](https://github.com/Popov72) ([#12450](https://github.com/BabylonJS/Babylon.js/pull/12450))
- Allow arc rotate auto rotation to rotate to a certain alpha value - by [TheCrowd](https://github.com/TheCrowd) ([#12429](https://github.com/BabylonJS/Babylon.js/pull/12429))
- Fix camera cloning by adding newParent parameter - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12443](https://github.com/BabylonJS/Babylon.js/pull/12443))
- make sure pointer up only triggers once - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#12440](https://github.com/BabylonJS/Babylon.js/pull/12440))
- Fix iridescence texture transform - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12432](https://github.com/BabylonJS/Babylon.js/pull/12432))
- Fix OimoJS plugin syncMeshWithImpostor method. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12442](https://github.com/BabylonJS/Babylon.js/pull/12442))
- Fix thinInstanceCount setter to work with mesh clone - by [BlakeOne](https://github.com/BlakeOne) ([#12434](https://github.com/BabylonJS/Babylon.js/pull/12434))
- Fix crash when cloning meshes with thin instances that are using instance color - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#12436](https://github.com/BabylonJS/Babylon.js/pull/12436))
- Fix GridMaterial serialization - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12428](https://github.com/BabylonJS/Babylon.js/pull/12428))
- Fix effectLayer vertex alpha detection - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12427](https://github.com/BabylonJS/Babylon.js/pull/12427))
- NME: uploading a static cube texture in a Reflection block does not work - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12425](https://github.com/BabylonJS/Babylon.js/pull/12425))
- Remove some unnecessary computations - [_New Feature_] by [deltakosh](https://github.com/deltakosh) ([#12421](https://github.com/BabylonJS/Babylon.js/pull/12421))
- WebGPU: Fix RenderAttachment flag for 3D textures - by [Popov72](https://github.com/Popov72) ([#12420](https://github.com/BabylonJS/Babylon.js/pull/12420))
- ShaderMaterial: keep uniqueId in serialize() - by [lxq100](https://github.com/lxq100) ([#12419](https://github.com/BabylonJS/Babylon.js/pull/12419))

### Inspector

- WebGPU: more changes and fixes for stencil support - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#12452](https://github.com/BabylonJS/Babylon.js/pull/12452))

### Loaders

- Export KHR extensions: IOR, Transmission and Volume - by [pandaGaume](https://github.com/pandaGaume) ([#12389](https://github.com/BabylonJS/Babylon.js/pull/12389))

### Materials

- Fix GridMaterial serialization - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12428](https://github.com/BabylonJS/Babylon.js/pull/12428))

### Node Editor

- NME: uploading a static cube texture in a Reflection block does not work - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12425](https://github.com/BabylonJS/Babylon.js/pull/12425))

### Playground

- Enable more features for PG in JS mode - [_New Feature_] by [deltakosh](https://github.com/deltakosh) ([#12424](https://github.com/BabylonJS/Babylon.js/pull/12424))

### Serializers

- Export KHR extensions: IOR, Transmission and Volume - by [pandaGaume](https://github.com/pandaGaume) ([#12389](https://github.com/BabylonJS/Babylon.js/pull/12389))

## 5.3.0

### Core

- Added function call to focus on canvas when setting PointerLock - [_Bug Fix_] by [PolygonalSun](https://github.com/PolygonalSun) ([#12418](https://github.com/BabylonJS/Babylon.js/pull/12418))
- width height swizzle - by [Pryme8](https://github.com/Pryme8) ([#12417](https://github.com/BabylonJS/Babylon.js/pull/12417))
- Volumetric light scattering post process: Fix support for thin instances - by [Popov72](https://github.com/Popov72) ([#12416](https://github.com/BabylonJS/Babylon.js/pull/12416))
- Fix uninitialized last ray for PointerDragBehavior - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12410](https://github.com/BabylonJS/Babylon.js/pull/12410))
- Do not use determinant when preserving scaling - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12413](https://github.com/BabylonJS/Babylon.js/pull/12413))
- Skeleton._sortBones() crash for bones with parents from other skeletons - by [EvgenyRodygin](https://github.com/EvgenyRodygin) ([#12415](https://github.com/BabylonJS/Babylon.js/pull/12415))
- DeviceInputSystem: Remove pollInput calls for MouseWheel from EventFactory - [_Breaking Change_] by [PolygonalSun](https://github.com/PolygonalSun) ([#12397](https://github.com/BabylonJS/Babylon.js/pull/12397))
- Fix Transparent shadows - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12406](https://github.com/BabylonJS/Babylon.js/pull/12406))
- Scaling preservation fix for boundingBoxGizmo - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12403](https://github.com/BabylonJS/Babylon.js/pull/12403))
- Fix empty screenshot when enabling antialiasing - [_Bug Fix_] by [Popov72](https://github.com/Popov72) ([#12402](https://github.com/BabylonJS/Babylon.js/pull/12402))
- Add the possibility to pass forcedExtension for an environment texture - by [ton-solutions](https://github.com/ton-solutions) ([#12401](https://github.com/BabylonJS/Babylon.js/pull/12401))
- Add the possibility to pass prefilterOnLoad flag for an environment texture - by [ton-solutions](https://github.com/ton-solutions) ([#12396](https://github.com/BabylonJS/Babylon.js/pull/12396))

### GUI

- fix container regression - [_Bug Fix_] by [darraghjburke](https://github.com/darraghjburke) ([#12404](https://github.com/BabylonJS/Babylon.js/pull/12404))
- Block pointer events to scene when pointer is captured - [_Bug Fix_] by [darraghjburke](https://github.com/darraghjburke) ([#12400](https://github.com/BabylonJS/Babylon.js/pull/12400))

### Inspector

- Inspector: render N/A for internal texture unique ID when internal texture is undefined - [_Bug Fix_] by [darraghjburke](https://github.com/darraghjburke) ([#12409](https://github.com/BabylonJS/Babylon.js/pull/12409))
- Deselect keys when active channels are changed. - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12399](https://github.com/BabylonJS/Babylon.js/pull/12399))

### Loaders

- Fix Transparent shadows - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12406](https://github.com/BabylonJS/Babylon.js/pull/12406))

### Serializers

- Fix typo in warning message - by [Krenodeno](https://github.com/Krenodeno) ([#12414](https://github.com/BabylonJS/Babylon.js/pull/12414))
- Remove dead code - by [deltakosh](https://github.com/deltakosh) ([#12408](https://github.com/BabylonJS/Babylon.js/pull/12408))
- Fix Transparent shadows - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12406](https://github.com/BabylonJS/Babylon.js/pull/12406))

## 5.2.0

### Core

- ktxTextureLoader: Mark _useSRGBBuffers when loading an SRGB-enabled texture format - [_Bug Fix_] by [magcius](https://github.com/magcius) ([#12362](https://github.com/BabylonJS/Babylon.js/pull/12362))
- DebugLayer : Accessors onNodeSelectedObservable - [_New Feature_] by [deltakosh](https://github.com/deltakosh) ([#12395](https://github.com/BabylonJS/Babylon.js/pull/12395))
- Add normal input to clear coat Block - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#12388](https://github.com/BabylonJS/Babylon.js/pull/12388))
- Add a flag to use opacity instead of diffuse texture for transparent shadows. - by [carolhmj](https://github.com/carolhmj) ([#12390](https://github.com/BabylonJS/Babylon.js/pull/12390))
- switch sandbox to double (and fix a tiny GC issue with audio) - by [deltakosh](https://github.com/deltakosh) ([#12387](https://github.com/BabylonJS/Babylon.js/pull/12387))
- New flag to preserve scaling when using gizmos - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12385](https://github.com/BabylonJS/Babylon.js/pull/12385))
- add overrideCloneAlphaBetaRadius to ArcRotateCamera - [_Breaking Change_] by [BlakeOne](https://github.com/BlakeOne) ([#12378](https://github.com/BabylonJS/Babylon.js/pull/12378))
- fix: getPositionData missing slice of vertex positions - by [BlakeOne](https://github.com/BlakeOne) ([#12375](https://github.com/BabylonJS/Babylon.js/pull/12375))
- Additional WebXR image tracking changes for native integration - by [Alex-MSFT](https://github.com/Alex-MSFT) ([#12176](https://github.com/BabylonJS/Babylon.js/pull/12176))
- Fixing typings for camera detachControl - by [RaananW](https://github.com/RaananW) ([#12372](https://github.com/BabylonJS/Babylon.js/pull/12372))
- Physics,scene Bug fixes - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12374](https://github.com/BabylonJS/Babylon.js/pull/12374))
- Fix minor shader compiler issues - [_Bug Fix_] by [kaliatech](https://github.com/kaliatech) ([#12369](https://github.com/BabylonJS/Babylon.js/pull/12369))
- Fix babylon mesh parsing, materials were not reattached. - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12370](https://github.com/BabylonJS/Babylon.js/pull/12370))
- Revert the missing fix and add some logs - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12367](https://github.com/BabylonJS/Babylon.js/pull/12367))
- Add support for Iridescence in PBR and GLTF - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#12365](https://github.com/BabylonJS/Babylon.js/pull/12365))
- Reset cached vertex data after CPU skinning is turned off - by [BlakeOne](https://github.com/BlakeOne) ([#12366](https://github.com/BabylonJS/Babylon.js/pull/12366))
- make param defaults explicit for function getPositionData - by [BlakeOne](https://github.com/BlakeOne) ([#12361](https://github.com/BabylonJS/Babylon.js/pull/12361))
- Fix default settings in video texture - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#12356](https://github.com/BabylonJS/Babylon.js/pull/12356))

### GUI

- Skip invisible or unrenderable children in layout calculations - [_Bug Fix_] by [darraghjburke](https://github.com/darraghjburke) ([#12392](https://github.com/BabylonJS/Babylon.js/pull/12392))
- remove legacy directory - by [RaananW](https://github.com/RaananW) ([#12384](https://github.com/BabylonJS/Babylon.js/pull/12384))
- Move the local server to compile using ts-loader - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#12363](https://github.com/BabylonJS/Babylon.js/pull/12363))

### Inspector

- Add some missing onPropertyChangedObservable to inspector… - [_New Feature_] by [carolhmj](https://github.com/carolhmj) ([#12376](https://github.com/BabylonJS/Babylon.js/pull/12376))
- Physics,scene Bug fixes - [_Bug Fix_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12374](https://github.com/BabylonJS/Babylon.js/pull/12374))
- Move the local server to compile using ts-loader - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#12363](https://github.com/BabylonJS/Babylon.js/pull/12363))
- Add support for Iridescence in PBR and GLTF - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#12365](https://github.com/BabylonJS/Babylon.js/pull/12365))

### Loaders

- Add support for Iridescence in PBR and GLTF - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#12365](https://github.com/BabylonJS/Babylon.js/pull/12365))

### Node Editor

- Different selection priorities for nodes and frames dependent of marquee or click selecting - [_Bug Fix_] by [carolhmj](https://github.com/carolhmj) ([#12373](https://github.com/BabylonJS/Babylon.js/pull/12373))
- Prevent alt+click shortcut to drop elbow on complex node connections - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12359](https://github.com/BabylonJS/Babylon.js/pull/12359))

### Playground

- Unicode/emoji characters in Playground are lost upon Save - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12391](https://github.com/BabylonJS/Babylon.js/pull/12391))
- Fix wrong PG key saving - by [deltakosh](https://github.com/deltakosh) ([#12393](https://github.com/BabylonJS/Babylon.js/pull/12393))
- support debug in older versions - by [RaananW](https://github.com/RaananW) ([#12377](https://github.com/BabylonJS/Babylon.js/pull/12377))
- Avoid double loading a scene when the playground is saved. - by [carolhmj](https://github.com/carolhmj) ([#12357](https://github.com/BabylonJS/Babylon.js/pull/12357))

### Serializers

- Add support for GLTF 2.0 Serializer KHR_materials_specular - by [pandaGaume](https://github.com/pandaGaume) ([#12332](https://github.com/BabylonJS/Babylon.js/pull/12332))
- Add support for Iridescence in PBR and GLTF - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#12365](https://github.com/BabylonJS/Babylon.js/pull/12365))

## 5.1.0

### GUI Editor

- add timestamp to CDN assets - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#12353](https://github.com/BabylonJS/Babylon.js/pull/12353))

### Node Editor

- add timestamp to CDN assets - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#12353](https://github.com/BabylonJS/Babylon.js/pull/12353))

### Playground

- add timestamp to CDN assets - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#12353](https://github.com/BabylonJS/Babylon.js/pull/12353))

## 5.0.4

### Core

- Fix SSAORenderingPipeline with multi cameras - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12352](https://github.com/BabylonJS/Babylon.js/pull/12352))
- Fix Color3.asArray, Color4.asArray, Color4.toArray and docs for Color… - [_Bug Fix_] by [axeljaeger](https://github.com/axeljaeger) ([#12346](https://github.com/BabylonJS/Babylon.js/pull/12346))
- fix physics regression - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12337](https://github.com/BabylonJS/Babylon.js/pull/12337))
- Let AssetContainer add/instantiate/remove individual components - [_New Feature_] by [deltakosh](https://github.com/deltakosh) ([#12344](https://github.com/BabylonJS/Babylon.js/pull/12344))
- assign the number of textures correctly - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#12340](https://github.com/BabylonJS/Babylon.js/pull/12340))
- rotate the hand mesh opposed to the based transform node. - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#12339](https://github.com/BabylonJS/Babylon.js/pull/12339))

### GUI

- On parse, reconnects the keys of the virtual keyboard - by [darraghjburke](https://github.com/darraghjburke) ([#12348](https://github.com/BabylonJS/Babylon.js/pull/12348))
- use ignoreAdaptiveScaling on containers width adaptWidthToChildren or adaptHeightToChildren - [_Bug Fix_] by [darraghjburke](https://github.com/darraghjburke) ([#12345](https://github.com/BabylonJS/Babylon.js/pull/12345))

### GUI Editor

- Fix item duplication when gui editor is opened through the playground. - by [carolhmj](https://github.com/carolhmj) ([#12325](https://github.com/BabylonJS/Babylon.js/pull/12325))

### Playground

- Playground fails permanently when Babylon.js 3.3 is selected - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#12341](https://github.com/BabylonJS/Babylon.js/pull/12341))

## 5.0.3

### Core

- fix mergemesh when using RH - by [deltakosh](https://github.com/deltakosh) ([#12334](https://github.com/BabylonJS/Babylon.js/pull/12334))
- Fix instance color forwarding for PBR Instances - by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12333](https://github.com/BabylonJS/Babylon.js/pull/12333))
- Native textures - by [sebavan](https://github.com/sebavan) ([#12328](https://github.com/BabylonJS/Babylon.js/pull/12328))
- Get error - by [sebavan](https://github.com/sebavan) ([#12329](https://github.com/BabylonJS/Babylon.js/pull/12329))

## 5.0.2

### Inspector

- add ability to change node parent in inspector - by [deltakosh](https://github.com/deltakosh) ([#12323](https://github.com/BabylonJS/Babylon.js/pull/12323))
- Inspector - Empty mesh nodes should display with the mesh icon - by [deltakosh](https://github.com/deltakosh) ([#12321](https://github.com/BabylonJS/Babylon.js/pull/12321))

### Node Editor

- Adjust behavior of NME selection to only select a frame if there aren… - by [carolhmj](https://github.com/carolhmj) ([#12327](https://github.com/BabylonJS/Babylon.js/pull/12327))

## 5.0.1

### Core

- empty loadingUIText setter for null engine - by [nekochanoide](https://github.com/nekochanoide) ([#12320](https://github.com/BabylonJS/Babylon.js/pull/12320))
- WebGPU Update - by [sebavan](https://github.com/sebavan) ([#12312](https://github.com/BabylonJS/Babylon.js/pull/12312))
- Added a new flag for checking double sided mesh in collision - [_New Feature_] by [CedricGuillemet](https://github.com/CedricGuillemet) ([#12318](https://github.com/BabylonJS/Babylon.js/pull/12318))

### GUI Editor

- Only update the GUI size when arrow control's drag is stopped. - by [carolhmj](https://github.com/carolhmj) ([#12311](https://github.com/BabylonJS/Babylon.js/pull/12311))
- Update Display Grid Parameters - by [darraghjburke](https://github.com/darraghjburke) ([#12314](https://github.com/BabylonJS/Babylon.js/pull/12314))
- Fix overflows on left panel - by [darraghjburke](https://github.com/darraghjburke) ([#12315](https://github.com/BabylonJS/Babylon.js/pull/12315))
- update the give feedback link to the beta thread - by [darraghjburke](https://github.com/darraghjburke) ([#12313](https://github.com/BabylonJS/Babylon.js/pull/12313))
- Changes to saving and cleanup - by [darraghjburke](https://github.com/darraghjburke) ([#12301](https://github.com/BabylonJS/Babylon.js/pull/12301))
- Beta release - by [darraghjburke](https://github.com/darraghjburke) ([#12290](https://github.com/BabylonJS/Babylon.js/pull/12290))
- Fix deletion of descendant controls in the gui editor - by [carolhmj](https://github.com/carolhmj) ([#12271](https://github.com/BabylonJS/Babylon.js/pull/12271))
- Separate reframing with selected controls and the entire screen - by [carolhmj](https://github.com/carolhmj) ([#12299](https://github.com/BabylonJS/Babylon.js/pull/12299))

### Inspector

- revamp declarations - by [RaananW](https://github.com/RaananW) ([#12319](https://github.com/BabylonJS/Babylon.js/pull/12319))

### Viewer

- Add the viewer to the automated build process - by [RaananW](https://github.com/RaananW) ([#12296](https://github.com/BabylonJS/Babylon.js/pull/12296))

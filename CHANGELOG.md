# Changelog

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
- add overrideCloneAlphaBetaRadius to ArcRotateCamera - by [BlakeOne](https://github.com/BlakeOne) ([#12378](https://github.com/BabylonJS/Babylon.js/pull/12378))
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

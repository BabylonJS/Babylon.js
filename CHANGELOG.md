# Changelog

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

## 5.10.0

### Inspector

- Disallow users to change the frame of the first key, ensuring that th… - by [carolhmj](https://github.com/carolhmj) ([#12622](https://github.com/BabylonJS/Babylon.js/pull/12622))

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

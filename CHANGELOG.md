# Changelog

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

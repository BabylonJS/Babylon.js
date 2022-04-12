# Changelog

## upcoming

### Core

- Fix babylon mesh parsing, materials were not reattached. - [_Bug Fix_] by [sebavan](https://github.com/sebavan) ([#12370](https://github.com/BabylonJS/Babylon.js/pull/12370))
- Revert the missing fix and add some logs - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12367](https://github.com/BabylonJS/Babylon.js/pull/12367))
- Add support for Iridescence in PBR and GLTF - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#12365](https://github.com/BabylonJS/Babylon.js/pull/12365))
- Reset cached vertex data after CPU skinning is turned off - by [BlakeOne](https://github.com/BlakeOne) ([#12366](https://github.com/BabylonJS/Babylon.js/pull/12366))
- make param defaults explicit for function getPositionData - by [BlakeOne](https://github.com/BlakeOne) ([#12361](https://github.com/BabylonJS/Babylon.js/pull/12361))
- Fix default settings in video texture - [_Bug Fix_] by [RaananW](https://github.com/RaananW) ([#12356](https://github.com/BabylonJS/Babylon.js/pull/12356))

### GUI

- Move the local server to compile using ts-loader - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#12363](https://github.com/BabylonJS/Babylon.js/pull/12363))

### Inspector

- Move the local server to compile using ts-loader - [_New Feature_] by [RaananW](https://github.com/RaananW) ([#12363](https://github.com/BabylonJS/Babylon.js/pull/12363))
- Add support for Iridescence in PBR and GLTF - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#12365](https://github.com/BabylonJS/Babylon.js/pull/12365))

### Loaders

- Add support for Iridescence in PBR and GLTF - [_New Feature_] by [sebavan](https://github.com/sebavan) ([#12365](https://github.com/BabylonJS/Babylon.js/pull/12365))

### Node Editor

- Prevent alt+click shortcut to drop elbow on complex node connections - [_Bug Fix_] by [deltakosh](https://github.com/deltakosh) ([#12359](https://github.com/BabylonJS/Babylon.js/pull/12359))

### Playground

- Avoid double loading a scene when the playground is saved. - by [carolhmj](https://github.com/carolhmj) ([#12357](https://github.com/BabylonJS/Babylon.js/pull/12357))

### Serializers

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

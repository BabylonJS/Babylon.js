# Changelog

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

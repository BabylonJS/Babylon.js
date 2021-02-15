# 5.0.0

## Major updates

- Infinite Morph Targets: When supported (WebGL2+) you are no more limited to 4 morph targets per mesh ([Deltakosh](https://github.com/deltakosh))

## Updates

### General

- Added static CenterToRef for vectors 2/3/4  ([aWeirdo](https://github.com/aWeirdo))
- Added ability to view images (ktx2, png, jpg) to the sandbox. ([bghgary](https://github.com/bghgary))
- Added optional smoothed normals for extruded procedural polygons. ([snagy](https://github.com/snagy))
- Added support for infinite perspective cameras ([Deltakosh](https://github.com/deltakosh))
- Added ability to enable/disable ArcRotateCamera zoom on multiTouch event ([NicolasBuecher](https://github.com/NicolasBuecher))
- Moving button to shared uI folder.([msDestiny14](https://github.com/msDestiny14))
- Added `collisionRetryCount` to improved collision detection ([CedricGuillemet](https://github.com/CedricGuillemet))
- Moved sharedUI component to shared UI folder. ([msDestiny14](https://github.com/msDestiny14))
- Added encapsulate and encapsulateBoundingInfo methods to BoundingInfo. ([Tolo789](https://github.com/Tolo789))
- Added onLoadObservable to the textureDome class(es) ([RaananW](https://github.com/RaananW))
- Modified InputManager to use DeviceInputSystem ([PolygonalSun](https://github.com/PolygonalSun))
- Added a [helper class](https://doc.babylonjs.com/typedoc/classes/babylon.debug.directionallightfrustumviewer) to display the frustum of a directional light ([Popov72](https://github.com/Popov72))
- Improved collision detection performance ([ottoville](https://github.com/ottoville/))
- Added new helper functions for Quaternion.FromLookDirection and Matrix.LookDirection ([Alex-MSFT](https://github.com/Alex-MSFT))

### Engine

- Moved all instance data from Geometry to Mesh such that the same Geometry objects can be used by many meshes with instancing. Reduces memory consumption on CPU/GPU. ([breakin](https://github.com/breakin)

### Loaders

- Added support for EXT_meshopt_compression for glTF loader. ([zeux](https://github.com/zeux))
- Increased KHR_materials_transmission render target texture default size. ([Drigax](https://github.com/drigax))
- Changed glTF loader to remove empty animation groups if there are no animation channels loaded with the given options. ([bghgary](https://github.com/bghgary))
- Update glTF validator to `2.0.0-dev.3.3`. ([bghgary](https://github.com/bghgary))
- Added support for KHR_xmp_json_ld for glTF loader. ([Sebavan](https://github.com/sebavan/), [bghgary](https://github.com/bghgary))
- Added a `OptimizeNormals` option to the OBJ loader to smooth lighting ([Popov72](https://github.com/Popov72))

### Navigation

- Added support for thin instances in navigation mesh creation ([CedricGuillemet](https://github.com/CedricGuillemet))
- Added recast.d.ts definition file for recast.js ([CedricGuillemet](https://github.com/CedricGuillemet))
- Added obstacle support ([CedricGuillemet](https://github.com/CedricGuillemet))

### Materials

- Added an `OcclusionMaterial` to simplify depth-only rendering of geometry ([rgerd](https://github.com/rgerd))
- PrePass can now be used in `RenderTargets` speeding up effects like SSAO2 or MotionBlur ([CraigFeldspar](https://github.com/CraigFeldspar))
- Added support for morph targets to `ShaderMaterial` ([Popov72](https://github.com/Popov72))

### Inspector

- Increased float precision to 4 ([msDestiny14](https://github.com/msDestiny14))
- Added support for sounds in the inspector ([Deltakosh](https://github.com/deltakosh))
- Added a debug option to show the frustum of a directional light ([Popov72](https://github.com/Popov72))

### NME

- Increased float precision to 4([msDestiny14](https://github.com/msDestiny14))
- Added ability to make input node's properties visible in the properties of a custom frame ([msDestiny14](https://github.com/msDestiny14))

### GUIEditor

- Added GUI Editor project to master. ([msDestiny14](https://github.com/msDestiny14))
- Moving GUI property tab components into GUIEditor. ([msDestiny14](https://github.com/msDestiny14))
- Added basic saving and loading funtionality. ([msDestiny14](https://github.com/msDestiny14))
- Added more GUI controls. ([msDestiny14](https://github.com/msDestiny14))
- Added snippet server from url functionality ([msDestiny14](https://github.com/msDestiny14))
- Added scrolling and zooming functionality ([msDestiny14](https://github.com/msDestiny14))
- Added resizable canvas ([msDestiny14](https://github.com/msDestiny14))

### GUI

- Added a `FocusableButton` gui control to simplify creating menus with keyboard navigation ([Flux159](https://github.com/Flux159))
- Added `focus()` and `blur()` functions for controls that implement `IFocusableControl` ([Flux159](https://github.com/Flux159))
- Added `ToggleButton` GUI control ([kintz09](https://github.com/kintz09))
- Added shorthand methods which set all padding values at once, named `setPadding` and `setPaddingInPixels`, to the control class  ([kintz09](https://github.com/kintz09))
- Added two touch-enabled GUI controls, `TouchMeshButton3D` and `TouchHolographicButton`, added option on the WebXR hand tracking feature for enabling touch collisions ([rickfromwork](https://github.com/rickfromwork), [satyapoojasama](https://github.com/satyapoojasama))
- Added `imageWidth()` and `imageHeight()` to access the source image dimensions of `Image` ([Queatz](https://github.com/Queatz))

### WebXR

- A browser error preventing the emulator to render scene is now correctly dealt with ([RaananW](https://github.com/RaananW))
- Added a way to extend the XRSessionInit Object from inside of a feature ([RaananW](https://github.com/RaananW))
- Added image tracking feature ([RaananW](https://github.com/RaananW))
- Pointer Events of WebXR controllers have pointerType `xr` ([RaananW](https://github.com/RaananW))
- better support for custom hand meshes ([RaananW](https://github.com/RaananW))
- Allow disabling of the WebXRControllerPointerSelection feature as part of the WebXR Default Experience ([rgerd](https://github.com/rgerd))
- Added two touch-enabled GUI controls, `TouchMeshButton3D` and `TouchHolographicButton`, added option on the WebXR hand tracking feature for enabling touch collisions ([rickfromwork](https://github.com/rickfromwork), [satyapoojasama](https://github.com/satyapoojasama))

### Gizmos

- Exposed `scaleDragSpeed` and added `axisFactor` for BoundingBoxGizmo ([CedricGuillemet](https://github.com/CedricGuillemet))

### Viewer

- Fixed an issue with dual callback binding in case of a forced redraw ([#9608](https://github.com/BabylonJS/Babylon.js/issues/9608)) ([RaananW](https://github.com/RaananW))

### Math

- Faster scalar's WithinEpsilon with Math.abs ([nekochanoide](https://github.com/nekochanoide))

## Bugs

- Fix issue with the Promise polyfill where a return value was expected from resolve() ([Deltakosh](https://github.com/deltakosh))
- Fix ArcRotateCamera panning with axis decomposition ([CedricGuillemet](https://github.com/CedricGuillemet))
- Fix an issue with keyboard control (re)attachment. ([#9411](https://github.com/BabylonJS/Babylon.js/issues/9411)) ([RaananW](https://github.com/RaananW))
- Fix issue where PBRSpecularGlossiness materials were excluded from export [#9423](https://github.com/BabylonJS/Babylon.js/issues/9423)([Drigax](https://github.com/drigax))
- Fix issue when scaling is reapplied with BoundingBoxGizmo and GizmoManager ([CedricGuillemet](https://github.com/CedricGuillemet))
- Fix direct loading of a glTF string that has base64-encoded URI. ([bghgary](https://github.com/bghgary))
- Fix capsule impostor size computation for ammojs ([CedricGuillemet](https://github.com/CedricGuillemet))
- Fix crash of some node materials using instances on iOS ([Popov72](https://github.com/Popov72))
- Fix the code generated for the NME gradient block ([Popov72](https://github.com/Popov72))
- Fix ssao2RenderingPipeline for orthographic cameras ([Kesshi](https://github.com/Kesshi))
- Fix mipmaps creation in the KTX2 decoder for non square textures ([Popov72](https://github.com/Popov72))
- Fix detail map not working in WebGL1 ([Popov72](https://github.com/Popov72))
- Fix ArcRotateCamera behaviour when panning is disabled on multiTouch event ([NicolasBuecher](https://github.com/NicolasBuecher))
- Fix vertically interlaced stereoscopic rendering (`RIG_MODE_STEREOSCOPIC_INTERLACED`) not working (follow-up [#7425](https://github.com/BabylonJS/Babylon.js/issues/7425), [#8000](https://github.com/BabylonJS/Babylon.js/issues/8000)) ([foxxyz](https://github.com/foxxyz))
- Fix accessibility of BaseCameraMouseWheelInput and BaseCameraPointersInput. They appear in documentation but were not available for include. ([mrdunk](https://github.com/mrdunk))
- Fix function creation inside regularly called freeCameraMouseWheelInput method leading to excessive GC load. ([mrdunk](https://github.com/mrdunk))
- Fix clip plane not reset to the rigth value when using mirrors ([Popov72](https://github.com/Popov72))
- Fix lens flares not working in right handed system ([Popov72](https://github.com/Popov72))
- Fix canvas not resized correctly in a multi-canvas scenario ([Popov72](https://github.com/Popov72))
- Fix NaN values returned by `GetAngleBetweenVectors` when vectors are the same or directly opposite ([Popov72](https://github.com/Popov72))
- Fix 404 occurring on some pictures in some cases when using particle systems ([Popov72](https://github.com/Popov72))
- Fix PrePass bugs with transparency ([CraigFeldspar](https://github.com/CraigFeldspar))
- Fix PrePass bugs with layers ([CraigFeldspar](https://github.com/CraigFeldspar))
- Fix SSAO2 with PrePass sometimes causing colors brighter than they should be ([CraigFeldspar](https://github.com/CraigFeldspar))
- Fix PostProcess sharing between cameras/renderTargets, that would create/destroy a texture on every frame ([CraigFeldspar](https://github.com/CraigFeldspar))
- Fix for DualSense gamepads being incorrectly read as DualShock gamepads ([PolygonalSun](https://github.com/PolygonalSun))
- Fix for warning in chrome about passive wheel events ([#9777](https://github.com/BabylonJS/Babylon.js/pull/9777)) ([kaliatech](https://github.com/kaliatech))
- Fix crash when cloning material in `AssetContainer.instantiateModelsToScene` when mesh is an instanced mesh ([Popov72](https://github.com/Popov72))
- Fix issue with NinePatch displaying half pixel gaps between slices on Firefox browsers. ([Pryme8](https://github.com/Pryme8))
- Fix issue when canvas loses focus while holding a pointer button ([PolygonalSun](https://github.com/PolygonalSun))
- Fix issue where camera controls stay detached if PointerDragBehavior is disabled prematurely ([PolygonalSun](https://github.com/PolygonalSun))
- Fix uncatchable exception that could be thrown when initializing the environment textures ([CoPrez](https://github.com/CoPrez))
- Fix the triplanar material when the position of the mesh it is applied to is not (0,0,0) ([Popov72](https://github.com/Popov72))
- Fix bones serialization to include their ids. This allows to retrieve bones (animation groups, etc.) once the scene has been re-serialized ([julien-moreau](https://github.com/julien-moreau))

## Breaking changes

- [List of breaking changes introduced by our compatibility with WebGPU](https://doc.babylonjs.com/advanced_topics/webGPU/webGPUBreakingChanges)
  - [ReadPixels and ProceduralTexture.getContent are now async](https://doc.babylonjs.com/advanced_topics/webGPU/webGPUBreakingChanges#readpixels-is-now-asynchronous)
  - [Shader support differences](https://doc.babylonjs.com/advanced_topics/webGPU/webGPUBreakingChanges#shader-code-differences)
- Use both `mesh.visibility` and `material.alpha` values to compute the global alpha value used by the soft transparent shadow rendering code. Formerly was only using `mesh.visibility` ([Popov72](https://github.com/Popov72))
- Depth renderer: don't render mesh if `infiniteDistance = true` or if `material.disableDepthWrite = true` ([Popov72](https://github.com/Popov72))
- Mesh.createInstance no longer make a unique Geometry for the Mesh so updating one Geometry can affect more meshes than before. Use Mesh.makeUniqueGeometry for old behaviour. ([breakin](https://github.com/breakin))
- Ammo.js needs to be initialized before creating the plugin with `await Ammo();` since Ammo introduced an async init in their library. ([sebavan](https://github.com/sebavan))
- Fixed spelling of EventState.initialize() ([seritools](https://github.com/seritools))

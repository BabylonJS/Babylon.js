# 5.0.0

## Major updates

## Updates

### General

- Added static CenterToRef for vectors 2/3/4  ([aWeirdo](https://github.com/aWeirdo))
- Added ability to view images (ktx2, png, jpg) to the sandbox. ([bghgary](https://github.com/bghgary))
- Added optional smoothed normals for extruded procedural polygons. ([snagy](https://github.com/snagy))
- Added support for infinite perspective cameras ([Deltakosh](https://github.com/deltakosh))
- Added ability to enable/disable ArcRotateCamera zoom on multiTouch event ([NicolasBuecher](https://github.com/NicolasBuecher))
- Moving button to shared uI folder.([msDestiny14](https://github.com/msDestiny14))
- Moving additional components to shared UI folder.([msDestiny14](https://github.com/msDestiny14))
- Added encapsulate and encapsulateBoundingInfo methods to BoundingInfo. ([Tolo789](https://github.com/Tolo789))

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

### Materials

- Added an `OcclusionMaterial` to simplify depth-only rendering of geometry ([rgerd](https://github.com/rgerd))

### Inspector

- Increased float precision to 4([msDestiny14](https://github.com/msDestiny14))
- Added support for sounds in the inspector ([Deltakosh](https://github.com/deltakosh))

### NME

- Increased float precision to 4([msDestiny14](https://github.com/msDestiny14))
- Added ability to make input node's properties visible in the properties of a custom frame ([msDestiny14](https://github.com/msDestiny14))

### GUI

- Added a `FocusableButton` gui control to simplify creating menus with keyboard navigation ([Flux159](https://github.com/Flux159))
- Added `focus()` and `blur()` functions for controls that implement `IFocusableControl` ([Flux159](https://github.com/Flux159))
- Added `ToggleButton` GUI control ([kintz09](https://github.com/kintz09))
- Added shorthand methods which set all padding values at once, named `setPadding` and `setPaddingInPixels`, to the control class  ([kintz09](https://github.com/kintz09))

### WebXR

- A browser error preventing the emulator to render scene is now correctly dealt with ([RaananW](https://github.com/RaananW))
- Added a way to extend the XRSessionInit Object from inside of a feature ([RaananW](https://github.com/RaananW))
- Added image tracking feature ([RaananW](https://github.com/RaananW))
- Pointer Events of WebXR controllers have pointerType `xr` ([RaananW](https://github.com/RaananW))

## Bugs

- Fix issue with the Promise polyfill where a return value was expected from resolve() ([Deltakosh](https://github.com/deltakosh))
- Fix ArcRotateCamera panning with axis decomposition ([CedricGuillemet](https://github.com/CedricGuillemet))
- Fix an issue with keyboard control (re)attachment. ([#9411](https://github.com/BabylonJS/Babylon.js/issues/9411)) ([RaananW](https://github.com/RaananW))
- Fix issue where PBRSpecularGlossiness materials were excluded from export [#9423](https://github.com/BabylonJS/Babylon.js/issues/9423)([Drigax](https://github.com/drigax))
- Fix issue when scaling is reapplied with BoundingBoxGizmo and GizmoManager ([CedricGuillemet](https://github.com/CedricGuillemet))
- Fix direct loading of a glTF string that has base64-encoded URI. ([bghgary](https://github.com/bghgary))
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

## Breaking changes

- [List of breaking changes introduced by ou compatibility with WebGPU](https://doc.babylonjs.com/advanced_topics/webGPU/webGPUBreakingChanges)
    - [ReadPixels and ProceduralTexture.getContent are now async](https://doc.babylonjs.com/advanced_topics/webGPU/webGPUBreakingChanges#readpixels-is-now-asynchronous)
    - [Shader support differences](https://doc.babylonjs.com/advanced_topics/webGPU/webGPUBreakingChanges#shader-code-differences)
- Use both `mesh.visibility` and `material.alpha` values to compute the global alpha value used by the soft transparent shadow rendering code. Formerly was only using `mesh.visibility` ([Popov72](https://github.com/Popov72))
- Depth renderer: don't render mesh if `infiniteDistance = true` or if `material.disableDepthWrite = true` ([Popov72](https://github.com/Popov72))
- Mesh.createInstance no longer make a unique Geometry for the Mesh so updating one Geometry can affect more meshes than before. Use Mesh.makeUniqueGeometry for old behaviour. ([breakin](https://github.com/breakin))
- Ammo.js needs to be initialized before creating the plugin with `await Ammo();` since Ammo introduced an async init in their library. ([sebavan](https://github.com/sebavan))

# 5.0.0

## Major updates

## Updates

### General

- Added static CenterToRef for vectors 2/3/4  ([aWeirdo](https://github.com/aWeirdo))
- Added ability to view images (ktx2, png, jpg) to the sandbox. ([bghgary](https://github.com/bghgary))
- Added support for infinite perspective cameras ([Deltakosh](https://github.com/deltakosh))

### Engine
- Added `Geometry.clone` to let the user make a variation on a Geometry without duplicating all buffer memory ([breakin](https://github.com/breakin))
- Added `Mesh.cloneGeometry` that makes it possible to share geometry on multiple meshes in a way that is compatible with instancing ([breakin](https://github.com/breakin))

### Loaders

- Added support for EXT_meshopt_compression for glTF loader. ([zeux](https://github.com/zeux))
- Increased KHR_materials_transmission render target texture default size. ([Drigax](https://github.com/drigax))
- Changed glTF loader to remove empty animation groups if there are no animation channels loaded with the given options. ([bghgary](https://github.com/bghgary))

### Navigation

- Added support for thin instances in navigation mesh creation ([CedricGuillemet](https://github.com/CedricGuillemet))

### Materials

- Added an `OcclusionMaterial` to simplify depth-only rendering of geometry ([rgerd](https://github.com/rgerd))

### Inspector

- Added support for sounds in the inspector ([Deltakosh](https://github.com/deltakosh))

### NME

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

## Breaking changes

- [List of breaking changes introduced by ou compatibility with WebGPU](https://doc.babylonjs.com/advanced_topics/webGPU/webGPUBreakingChanges)
    - [ReadPixels and ProceduralTexture.getContent are now async](https://doc.babylonjs.com/advanced_topics/webGPU/webGPUBreakingChanges#readpixels-is-now-asynchronous)
    - [Shader support differences](https://doc.babylonjs.com/advanced_topics/webGPU/webGPUBreakingChanges#shader-code-differences)
- Use both `mesh.visibility` and `material.alpha` values to compute the global alpha value used by the soft transparent shadow rendering code. Formerly was only using `mesh.visibility` ([Popov72](https://github.com/Popov72))
- Depth renderer: don't render mesh if `infiniteDistance = true` or if `material.disableDepthWrite = true` ([Popov72](https://github.com/Popov72))

# 5.0.0

## Major updates

## Updates

### General

- Added static CenterToRef for vectors 2/3/4  ([aWeirdo](https://github.com/aWeirdo))
- Added ability to view images (ktx2, png, jpg) to the sandbox. ([bghgary](https://github.com/bghgary))

### Loaders

- Added support for EXT_meshopt_compression for glTF loader. ([zeux](https://github.com/zeux))

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

### WebXR

- A browser error preventing the emulator to render scene is now correctly dealt with ([RaananW](https://github.com/RaananW))

## Bugs

- Fix issue with the Promise polyfill where a return value was expected from resolve() ([Deltakosh](https://github.com/deltakosh))
- Fix an issue with keyboard control (re)attachment. ([#9411](https://github.com/BabylonJS/Babylon.js/issues/9411)) ([RaananW](https://github.com/RaananW))
- Fix issue where PBRSpecularGlossiness materials were excluded from export [#9423](https://github.com/BabylonJS/Babylon.js/issues/9423)([Drigax](https://github.com/drigax))
- Fix direct loading of a glTF string that has base64-encoded URI. ([bghgary](https://github.com/bghgary))

## Breaking changes

- Use both `mesh.visibility` and `material.alpha` values to compute the global alpha value used by the soft transparent shadow rendering code. Formerly was only using `mesh.visibility` ([Popov72](https://github.com/Popov72))

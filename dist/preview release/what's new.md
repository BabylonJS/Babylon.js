# 4.1.0

## Major updates

## Optimizations

## Updates
- Support Vive Focus 3Dof controller ([TrevorDev](https://github.com/TrevorDev))
- Planar positioning support for GizmoManager ([Balupg](https://github.com/balupg))
- Individual gizmos can now be enabled/disabled ([Balupg](https://github.com/balupg))

- Unify preparation of instance attributes. Added `MaterialHelper.PushAttributesForInstances` ([MarkusBillharz](https://github.com/MarkusBillharz))
 
### Inspector
- Added support for `ShadowGenerator` ([Deltakosh](https://github.com/deltakosh/))
- Added support for scene normalization ([Deltakosh](https://github.com/deltakosh/))
- Added support for morph targets ([Deltakosh](https://github.com/deltakosh/))
- Added context menu to add `SSAORenderingPipeline` and `SSAO2RenderingPipeline` ([Deltakosh](https://github.com/deltakosh/))
- Added support for texture creation and assignments per material ([Deltakosh](https://github.com/deltakosh/))
- Node material editor ([Deltakosh](https://github.com/deltakosh/)/[TrevorDev](https://github.com/TrevorDev))

### Tools
- Added `Color3.toHSV()`, `Color3.toHSVToRef()` and `Color3.HSVtoRGBToRef()` ([Deltakosh](https://github.com/deltakosh/))

### Meshes
- Added new CreateTiledPlane and CreateTiledBox ([JohnK](https://github.com/BabylonJSGuide/))

### Tools
- Added `ShadowGenerator.onAfterShadowMapRenderObservable` and `ShadowGenerator.onAfterShadowMapMeshRenderObservable` ([Deltakosh](https://github.com/deltakosh/))

## Bug fixes
- Added support for `AnimationGroup` serialization ([Drigax](https://github.com/drigax/))
- Removing assetContainer from scene will also remove gui layers ([TrevorDev](https://github.com/TrevorDev))
- A scene's input manager not adding key listeners when the canvas is already focused ([Poolminer](https://github.com/Poolminer))
- Runtime animation `goToFrame` when going back in time now correctly triggers future events when reached ([zakhenry](https://github.com/zakhenry))

## Breaking changes

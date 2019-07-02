# 4.1.0

## Major updates
- WIP: Node Material (NEED DOC OR SAMPLES) ([Deltakosh](https://github.com/deltakosh/))
- WIP: Node material editor (NEED OR AND VIDEOS) ([Deltakosh](https://github.com/deltakosh/)/[TrevorDev](https://github.com/TrevorDev))
- WIP: WebGPU support (NEED DOC OR SAMPLES) ([Sebavan](https://github.com/sebavan/)
- .basis texture file format support [Doc](https://doc.babylonjs.com/resources/multi-platform_compressed_textures#basis-file-format) ([TrevorDev](https://github.com/TrevorDev))

## Optimizations

## Updates

### General
- Support Vive Focus 3Dof controller ([TrevorDev](https://github.com/TrevorDev))
- Planar positioning support for GizmoManager ([Balupg](https://github.com/balupg))
- Individual gizmos can now be enabled/disabled ([Balupg](https://github.com/balupg))
- Unify preparation of instance attributes. Added `MaterialHelper.PushAttributesForInstances` ([MarkusBillharz](https://github.com/MarkusBillharz))
- Added support for PBR [irradiance map](https://doc.babylonjs.com/how_to/physically_based_rendering_master#irradiance-map)
- Ability to set render camera on utility layer instead of using the latest active camera ([TrevorDev](https://github.com/TrevorDev))
- Move normalizeToUnitCube to transformNode instead of abstract mesh and add predicate to exclude sub objects when scaling ([TrevorDev](https://github.com/TrevorDev))
- Method to check if device orientation is available ([TrevorDev](https://github.com/TrevorDev))
- Added support for sound sprites [Doc](https://doc.babylonjs.com/how_to/playing_sounds_and_music#playing-a-sound-sprite) ([Deltakosh](https://github.com/deltakosh/))
- Display Oculus Quest controller when using a Quest in WebVR ([TrevorDev](https://github.com/TrevorDev))
- Added startAndReleaseDragOnPointerEvents property to pointerDragBehavior which can be set to false for custom drag triggering ([TrevorDev](https://github.com/TrevorDev))
- Effect renderer to render one or multiple shader effects to a texture ([TrevorDev](https://github.com/TrevorDev))
- Added url parameters to web request modifiers ([PierreLeBlond](https://github.com/PierreLeBlond))
- WebXR updated to spec as of June 27th ([TrevorDev](https://github.com/TrevorDev))

### Engine
- Morph targets now can morph UV channel as well ([Deltakosh](https://github.com/deltakosh/))
- Added MorphTarget support to the DepthRenderer, GeometryBufferRenderer and OutlineRenderer ([MarkusBillharz](https://github.com/MarkusBillharz))
- Added preprocessors for shaders to improve how shaders are compiled for WebGL1/2 or WebGPU ([Deltakosh](https://github.com/deltakosh/))
- Added enterPointerlock and exitPointerlock (Separated from enterFullscreen) ([aWeirdo](https://github.com/aWeirdo/))

### Inspector
- Added support for Euler edition only for angles (can be turned off in the new inspector settings) ([Deltakosh](https://github.com/deltakosh/))
- Added an option to ignore backfaces for picking (can be turned on and off in the new inspector settings) ([Deltakosh](https://github.com/deltakosh/))
- Added support for `ShadowGenerator` ([Deltakosh](https://github.com/deltakosh/))
- Added support for scene normalization ([Deltakosh](https://github.com/deltakosh/))
- Added support for morph targets ([Deltakosh](https://github.com/deltakosh/))
- Added context menu to add `SSAORenderingPipeline` and `SSAO2RenderingPipeline` ([Deltakosh](https://github.com/deltakosh/))
- Added support for texture creation and assignments per material ([Deltakosh](https://github.com/deltakosh/))
- Added support for occlusion properties ([Deltakosh](https://github.com/deltakosh/))
- Texture channels are now displayed in grayscale ([Deltakosh](https://github.com/deltakosh/))
- Ambiant and metallic maps are displayed correctly on PBR material even when using ORM packed texture ([Deltakosh](https://github.com/deltakosh/))

### Tools
- Added `Color3.toHSV()`, `Color3.toHSVToRef()` and `Color3.HSVtoRGBToRef()` ([Deltakosh](https://github.com/deltakosh/))
- Added `ShadowGenerator.onAfterShadowMapRenderObservable` and `ShadowGenerator.onAfterShadowMapMeshRenderObservable` ([Deltakosh](https://github.com/deltakosh/))
- Added support for side by side and top bottom images in the `PhotoDome` ([Deltakosh](https://github.com/deltakosh/))
- Added playground ts-local (TypeScript support for local playground) ([pjoe](https://github.com/pjoe/))

### Meshes
- Added new CreateTiledPlane and CreateTiledBox ([JohnK](https://github.com/BabylonJSGuide/))

### Physics
- Update Ammo.js library to support global collision contact callbacks ([MackeyK24](https://github.com/MackeyK24/))
- Update Ammo.js library to allow native capsule shape impostors ([MackeyK24](https://github.com/MackeyK24/))
- Update Ammo.js library to allow your own broadphase overlapping pair cache ([MackeyK24](https://github.com/MackeyK24/))
- Update Ammo.js library and AmmoJS plugin to support ellipsoid ([CedricGuillemet](https://github.com/CedricGuillemet/))

### Loaders
- Added support for non-float accessors in animation data for glTF loader. ([bghgary](https://github.com/bghgary))
- Support loading cube data in .basis loader ([TrevorDev](https://github.com/TrevorDev))
- Load glTF extras into BJS metadata ([pjoe](https://github.com/pjoe))

### Materials
- Added `ShaderMaterial.setColor4Array` ([JonathanTron](https://github.com/JonathanTron/))
- Added `ShaderMaterial.setArray4` ([JonathanTron](https://github.com/JonathanTron/))

### Sounds
- Added `ISoundOptions.skipCodecCheck` to make `Sound` more flexible with URLs ([nbduke](https://github.com/nbduke))

### Ray
- Added `Ray.intersectsAxis` to translate screen to axis coordinates without checking collisions ([horusscope](https://github.com/horusscope))

### Documentation
- Added a note on shallow bounding of getBoundingInfo ([tibotiber](https://github.com/tibotiber))

## Bug fixes
- Fixed Xbox One gamepad controller button schemes ([MackeyK24](https://github.com/MackeyK24/))
- Added support for `AnimationGroup` serialization ([Drigax](https://github.com/drigax/))
- Removing assetContainer from scene will also remove gui layers ([TrevorDev](https://github.com/TrevorDev))
- A scene's input manager not adding key listeners when the canvas is already focused ([Poolminer](https://github.com/Poolminer))
- Runtime animation `goToFrame` when going back in time now correctly triggers future events when reached ([zakhenry](https://github.com/zakhenry))
- Fixed bug in Ray.intersectsTriangle where the barycentric coordinates `bu` and `bv` being returned is actually `bv` and `bw`. ([bghgary](https://github.com/bghgary))
- Do not call onError when creating a texture when falling back to another loader ([TrevorDev](https://github.com/TrevorDev))
- Context loss should not cause PBR materials to render black or instances to stop rendering ([TrevorDev](https://github.com/TrevorDev))
- Only cast pointer ray input when pointer is locked in webVR ([TrevorDev](https://github.com/TrevorDev))
- Avoid using default utility layer in gizmo manager to support multiple scenes ([TrevorDev](https://github.com/TrevorDev))
- Fix bug when adding and removing observers in quick succession ([sable](https://github.com/thscott))
- Cannon and Ammo forceUpdate will no longer cause an unexpected exception ([TrevorDev](https://github.com/TrevorDev))
- Loading the same multi-material twice and disposing one should not impact the other ([TrevorDev](https://github.com/TrevorDev))
- GLTF loader should now preserve the texture naming ([Drigax](https://github.com/Drigax))
- Avoid exception when disposing of Ammo cloth physics ([TrevorDev](https://github.com/TrevorDev))

## Breaking changes
- Setting mesh.scaling to a new vector will no longer automatically call forceUpdate (this should be done manually when needed) ([TrevorDev](https://github.com/TrevorDev))

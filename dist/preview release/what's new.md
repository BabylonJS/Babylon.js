# 2.5.0:

### Major updates
    
### Updates
- Added support for texture arrays ([deltakosh](https://github.com/deltakosh)) 
- Added `camera.isInFrustum` and `camera.isCompletelyInFrustum`. Can be used with meshes, submeshes and boundingInfo ([deltakosh](https://github.com/deltakosh)) 
- Several memory allocation reduction ([benaadams](https://github.com/benaadams)) 
- Several GPU state change reduction ([benaadams](https://github.com/benaadams)) 
- MapTexture: add `supersample` mode to double font quality. ([nockawa](https://github.com/nockawa))
- New `invertUV` parameter an all ribbon based shapes : ribbon, tube, lathe, basic and custom extrusion ([jerome](https://github.com/jbousquie))
- Text2D: new `fontSuperSample` setting to use high quality font ([nockawa](https://github.com/nockawa))
- PerfCounter class added to monitor time/counter and expose min/max/average/lastSecondAverage/current metrics. Updated engine/scene current counter to use this class, exposing new properties as well to access the PerfCounter object ([nockawa](https://github.com/nockawa))
- Better keyboard event handling which is now done at canvas level and not at window level ([deltakosh](https://github.com/deltakosh)) 
- New `scene.hoverCursor` property to define a custom cursor when moving mouse over meshes ([deltakosh](https://github.com/deltakosh)) 

### Exporters
    
### API doc

### Bug fixes
- MapTexture: Font Characters are now correctly aligned on Chrome ([nockawa](https://github.com/nockawa))
-  Fixed some missing parameter default values in `MeshBuilder.CreateGroundFromHeightMap()` and `MeshBuilder.CreateTiledGround()` ([jerome](https://github.com/jbousquie))
- Fixed model shape initial red vertex color set to zero not formerly being taken in account in the `SolidParticleSystem` ([jerome](https://github.com/jbousquie))
- Canvas2D:
 - `Sprite2D`: texture size is now set by default as expected
 - `Sprite2D`: can have no `id` set
 - `ZOrder` fixed in Primitives created inline
### Breaking changes


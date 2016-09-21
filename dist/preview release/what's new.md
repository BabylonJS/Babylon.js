# 2.5.0:

### Major updates
- Babylon.js now supports right handed system with ```scene.useRightHandedSystem = true``` ([deltakosh](https://github.com/deltakosh))

### Updates
- New ```Tools.CreateScreenshot``` function will capture all canvas data. Previous implementation is now called `CreateScreenshotUsingRenderTarget` ([deltakosh](https://github.com/deltakosh)) 
- Cube textures are now cached by texture cache ([deltakosh](https://github.com/deltakosh)) 
- Added onAnimationEnd callback for `sprite.playAnimation` ([deltakosh](https://github.com/deltakosh)) 
- Added support for non square textures for sprites ([deltakosh](https://github.com/deltakosh)) 
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
- Canvas2D: ([nockawa](https://github.com/nockawa)) 
 - Performance metrics added
 - Text2D super sampling to enhance quality in World Space Canvas
 - World Space Canvas is now rendering in an adaptive way for its resolution to fit the on screen projected one to achieve a good rendering quality
 - Transparent Primitives are now drawn with Instanced Array when supported
- WebVR Camera was updated to be conform with the current specs. ([RaananW](https://github.com/RaananW)) 

### Exporters
    
### API doc

### Bug fixes
- MapTexture: Font Characters are now correctly aligned on Chrome ([nockawa](https://github.com/nockawa))
- Fixed some missing parameter default values in `MeshBuilder.CreateGroundFromHeightMap()` and `MeshBuilder.CreateTiledGround()` ([jerome](https://github.com/jbousquie))
- Fixed cross vector calculation in `_computeHeightQuads()` that affected  all the `GroundMesh.getHeightAtCoordinates()` and `GroundMesh.getNormalAtCoordinates()` methods ([jerome](https://github.com/jbousquie))
- Fixed `Mesh.CreateDashedLines()` missing `instance` parameter on update ([jerome](https://github.com/jbousquie))
- Added BBox update on each ribbon based shape (ribbon, tube, extrusion, etc) on dynamic updates ([jerome](https://github.com/jbousquie))
- Fixed model shape initial red vertex color set to zero not formerly being taken in account in the `SolidParticleSystem` ([jerome](https://github.com/jbousquie))
- Fixed RenderTargetTexture meshes selection ([deltakosh](https://github.com/deltakosh))
- Fixed camera speed computation ([deltakosh](https://github.com/deltakosh))
- Fixed bug with isntances, LOD and edgesRendering ([deltakosh](https://github.com/deltakosh))
- Canvas2D: ([nockawa](https://github.com/nockawa))
 - `WorldSpaceCanvas2D`:
	- Intersection/interaction now works on non squared canvas
 - Primitive:
	- `ZOrder` fixed in Primitives created inline
	- Z-Order is now correctly distributed along the whole canvas object graph
 - `Sprite2D`: 
	- texture size is now set by default as expected
	- can have no `id` set
 - `Text2D`: 
	- Fix bad rendering quality on Chrome
	- Rendering above transparent surface is now blending correctly

### Breaking changes
 - Removed legacy shaders support ([deltakosh](https://github.com/deltakosh))
 - Canvas2D: ([nockawa](https://github.com/nockawa))
  - `WorldSpaceCanvas2D`:
	- WorldSpaceRenderScale is no longer supported (deprecated because of adaptive feature added).


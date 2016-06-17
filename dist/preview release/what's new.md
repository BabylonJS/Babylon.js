# 2.5.0:

### Major updates
    
### Updates
- Several memory allocation reduction ([benaadams](https://github.com/benaadams)) 
- Several GPU state change reduction ([benaadams](https://github.com/benaadams)) 
- MapTexture: add `supersample` mode to double font quality. ([nockawa](https://github.com/nockawa))
- new `invertUV` parameter an all ribbon based shapes : ribbon, tube, lathe, basic and custom extrusion

### Exporters
    
### API doc

### Bug fixes
- MapTexture: Font Characters are now correctly aligned on Chrome ([nockawa](https://github.com/nockawa))

### Breaking changes

### Canvas2D

#### Updates
- Text2D: new `fontSuperSample` setting to use high quality font.

#### Bug fixes
- `Sprite2D`: texture size is now set by default as expected
- `Sprite2D`: can have no `id` set
- `ZOrder` fixed in Primitives created inline
-  Fixed some missing parameter default values in `MeshBuilder.CreateGroundFromHeightMap()` and `MeshBuilder.CreateTiledGround()` ([jerome](https://github.com/jbousquie))
- Fixed model shape initial red vertex color set to zero not formerly being taken in account in the `SolidParticleSystem` ([jerome](https://github.com/jbousquie))

#### Breaking changes

# 2.5.0:

### Major updates
    
### Updates
- Several memory allocation reduction ([benaadams](https://github.com/benaadams)) 
- Several GPU state change reduction ([benaadams](https://github.com/benaadams)) 
- MapTexture: add `supersample` mode to double font quality. ([nockawa](https://github.com/nockawa))

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

#### Breaking changes

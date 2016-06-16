# 2.5.0:

### Major updates
    
### Updates
- Alloc reduction: Prevent Observable.notifyObservers allocation ([benaadams](https://github.com/benaadams)) 
- Alloc reduction: Prevent per mesh per render closure allocation ([benaadams](https://github.com/benaadams)) 
- Alloc reduction: Avoid inadvertent per geometry per render alloc ([benaadams](https://github.com/benaadams)) 
- Alloc reduction: Avoid inadvertent per mesh per render alloc ([benaadams](https://github.com/benaadams)) 
- Alloc reduction: Avoid Collider root calc allocations ([benaadams](https://github.com/benaadams)) 
- Alloc reduction: Reduce mesh rotation allocs ([benaadams](https://github.com/benaadams)) 
- Alloc reduction: Allocate less in vector project and unproject ([benaadams](https://github.com/benaadams)) 
- GPU state change reduction: Improved uniform caching ([benaadams](https://github.com/benaadams)) 
- GPU state change reduction: Cache program ([benaadams](https://github.com/benaadams)) 
- GPU state change reduction: Cache vertexAttribPointer ([benaadams](https://github.com/benaadams)) 
- GPU state change reduction: Reduce buffer binds ([benaadams](https://github.com/benaadams)) 
- GPU state change reduction: Only bind unbound framebuffers ([benaadams](https://github.com/benaadams)) 
- GPU state change reduction: Cache texture changes better ([benaadams](https://github.com/benaadams)) 

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
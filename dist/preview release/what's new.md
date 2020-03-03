# 4.2.0

## Major updates

## Updates

### General
- NME Frames are now resizable from the corners ([Kyle Belfort](https://github.com/belfortk)
- Refactored React refs from old string API to React.createRef() API ([Kyle Belfort](https://github.com/belfortk)

### Engine

- Allow logging of shader code when a compilation error occurs ([Popov72](https://github.com/Popov72))

### Cameras

- Added flag to TargetCamera to invert rotation direction and multiplier to adjust speed ([Exolun](https://github.com/Exolun))

### Physics

- Ammo.js IDL exposed property update and raycast vehicle stablization support ([MackeyK24](https://github.com/MackeyK24))

### Loaders
- Added support for glTF mesh instancing extension ([#7521](https://github.com/BabylonJS/Babylon.js/issues/7521)) ([drigax](https://github.com/Drigax))


### Materials
- Added the `roughness` and `albedoScaling` parameters to PBR sheen ([Popov72](https://github.com/Popov72))

## Bugs

- Fix infinite loop in `GlowLayer.unReferenceMeshFromUsingItsOwnMaterial` ([Popov72](https://github.com/Popov72)
- `QuadraticErrorSimplification` was not exported ([RaananW](https://github.com/Raananw)

## Breaking changes

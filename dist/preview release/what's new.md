# 4.2.0

## Major updates

## Updates

### General
- NME Frames are now resizable from the corners ([Kyle Belfort](https://github.com/belfortk)
- Refactored React refs from old string API to React.createRef() API ([Kyle Belfort](https://github.com/belfortk)

- Scale on one axis for `BoundingBoxGizmo` ([cedricguillemet](https://github.com/cedricguillemet))

- Simplified code contributions by fully automating the dev setup with gitpod ([nisarhassan12](https://github.com/nisarhassan12))

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
- Fix picking issue in the Solid Particle System when MultiMaterial is enabled ([jerome](https://github.com/jbousquie))
- `QuadraticErrorSimplification` was not exported ([RaananW](https://github.com/Raananw)
- Fix NME Frames bug where collapsing and moving a frame removed the nodes inside ([Kyle Belfort](https://github.com/belfortk)
- Fix moving / disappearing controls when freezing/unfreezing the ScrollViewer ([Popov72](https://github.com/Popov72)
- Fix: when using instances, master mesh (if displayed) does not have correct instance buffer values ([Popov72](https://github.com/Popov72)


## Breaking changes

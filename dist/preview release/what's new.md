# 3.0.0:

## Core engine

### Major updates
 - WebGL2 context support. WebGL2 is now used instead of WebGL 1 when available. [More info here](http://doc.babylonjs.com/overviews/webgl2) ([deltakosh](https://github.com/deltakosh))
 - Support for [Vertex Array Objects](https://www.opengl.org/registry/specs/ARB/vertex_array_object.txt) ([deltakosh](https://github.com/deltakosh))
 - Support for multisample render targets. [Demo](http://www.babylonjs-playground.com/#12MKMN) ([deltakosh](https://github.com/deltakosh))
 - New Unity 5 Editor Toolkit. Complete pipeline integration [Doc](TODO) - ([MackeyK24](https://github.com/MackeyK24))
 - New DebugLayer. [Doc](TODO) - ([temechon](https://github.com/temechon))
 - New `VideoTexture.CreateFromWebCam` to generate video texture using WebRTC. [Demo](https://www.babylonjs-playground.com#1R77YT#2) - (Sebastien Vandenberghe)(https://github.com/sebavanmicrosoft) / ([deltakosh](https://github.com/deltakosh))
 - New `HolographicCamera` to support rendering on Windows Holographic. - ([sebavan](https://github.com/sebavan))
 - New Facet Data feature ([jerome](https://github.com/jbousquie))
 - babylon.fontTexture.ts was moved from babylon.js to canvas2D ([nockawa](https://github.com/nockawa))
 - Multi-platform Compressed Textures for Desktops & Mobile Devices with fall back.  Batch (dos) scripts to convert entire directories of .jpg's & .png's ([jcpalmer](https://github.com/Palmer-JC))
 - All deprecated functions and properties were removed ([deltakosh](https://github.com/deltakosh))

### Updates
- Added `Light.customProjectionMatrixBuilder` to allow developers to define their own projection matrix for shadows ([deltakosh](https://github.com/deltakosh))
- Added `set()` function to all basic types ([deltakosh](https://github.com/deltakosh))
- Added `HDRCubeTextureAssetTask` to AssetManager ([deltakosh](https://github.com/deltakosh))
- Engine now uses range based fog ([deltakosh](https://github.com/deltakosh))
- `VertexBuffer.updatable` is now serialized ([deltakosh](https://github.com/deltakosh))
- Added intersectsMeshes to Ray ([abow](https://github.com/abow))
- New RayHelper class for easily viewing and attaching a ray to a mesh.  [Demo](http://www.babylonjs-playground.com/#ZHDBJ#34) - ([abow](https://github.com/abow))
- `Mesh.applyDisplacementMap` now accepts uvScale and uvOffset parameter ([deltakosh](https://github.com/deltakosh))
- Added addChild, removeChild, setParent to AbstractMesh ([abow](https://github.com/abow))
- `Effect.getVertexShaderSource()` and `Effect.getFragmentShaderSource()` now returns the effective shader code (including evaluation of #define) ([deltakosh](https://github.com/deltakosh))
- GroundMesh : `getHeightAtCoordinates()`, `getNormalAtCoordinates()` and `getNormalAtCoordinatesToRef()` can now work with rotated grounds ([jerome](https://github.com/jbousquie))  
- `GroundMesh`, `facetData` and `SolidParticleSystem` improvement in normal computations ([jerome](https://github.com/jbousquie))   
- Added `AbstractMesh.addRotation()` ([jerome](https://github.com/jbousquie))  
- Added `Quaternion.RotationQuaternionFromAxis()` and `Quaternion.RotationQuaternionFromAxisToRef()` ([jerome](https://github.com/jbousquie), thanks to [abow](https://github.com/abow))   
- Added `Curve3.CreateCatmullRomSpline()` ([jerome](https://github.com/jbousquie) and [BitOfGold](https://github.com/BitOfGold))  
- Added the optional parameter`colorFilter` to `CreateGroundFromHeightMap()` ([jerome](https://github.com/jbousquie))  
- Improved the internal code of `Vector3.RotationFromAxisToRef()` ([jerome](https://github.com/jbousquie), thanks to [abow](https://github.com/abow))  
- GroundMeshes are now serialized correctly ([deltakosh](https://github.com/deltakosh))
- Added `mesh.markVerticesDataAsUpdatable()` to allow a specific vertexbuffer to become updatable ([deltakosh](https://github.com/deltakosh)) 

 
### Bug fixes
- Fixed a bug with spotlight direction ([deltakosh](https://github.com/deltakosh)) 
- Fixed an issue with Mesh.attachToBone when a mesh is moving and an animation is changed ([abow](https://github.com/abow))
- Fixed an issue withaspect ratio when using CreateScreenshot ([deltakosh](https://github.com/deltakosh))
- Fixed SPS particle initial status when used as updatable with a `positionFunction` in `addShape()` ([jerome](https://github.com/jbousquie))  
- Fixed SPS particle access start index when used with `setParticles(start, end)` ([jerome](https://github.com/jbousquie))  

### API Documentation
`- File `abstractMesh.ts` documented  ([jerome](https://github.com/jbousquie))  
- File `mesh.ts` documented ([jerome](https://github.com/jbousquie))  
- File `groundMesh.ts` documented ([jerome](https://github.com/jbousquie))  
- File `instancedMesh.ts` documented ([jerome](https://github.com/jbousquie))  
- File `lineMesh.ts` documented ([jerome](https://github.com/jbousquie))  
- File `vertexData.ts` documented ([jerome](https://github.com/jbousquie))  
- File `subMesh.ts` documented ([jerome](https://github.com/jbousquie))  
- File `vertexBuffer.ts` documented ([jerome](https://github.com/jbousquie))  
- File `math.ts` documented ([jerome](https://github.com/jbousquie))
- File `light.ts` documented ([jerome](https://github.com/jbousquie))  
- File `directionalLight.ts` documented ([jerome](https://github.com/jbousquie))  
- File `hemisphericLight.ts` documented ([jerome](https://github.com/jbousquie))  
- File `pointLight.ts` documented ([jerome](https://github.com/jbousquie))  
- File `spotLight.ts` documented ([jerome](https://github.com/jbousquie))  
- File `shadowGenerator.ts` documented ([jerome](https://github.com/jbousquie))  

### Breaking changes
- WebVRCamera:
 - `requestVRFullscreen` has been removed. Call `attachControl()` inside a user-interaction callback to start sending frames to the VR display
 - `setPositionOffset` has been used to change the position offset. it is now done using `camera.position`
- Ray :
 - `show` has been removed. Use new `RayHelper.show()` instead
 - `hide` has been removed. Use new `RayHelper.hide()` instead
- AbstractMesh:
 - `onPhysicsCollide` has been removed. Use `mesh.physicsImpostor.registerOnPhysicsCollide()` instead
 - `setPhysicsState` has been removed. Use `new PhysicsImpostor()` instead
 - `getPhysicsMass` has been removed. Use `mesh.physicsImpostor.getParam("mass")` instead
 - `getPhysicsFriction` has been removed. Use `mesh.physicsImpostor.getParam("friction")` instead
 - `getPhysicsRestitution` has been removed. Use `mesh.physicsImpostor.getParam("restitution")` instead
 - `updatePhysicsBodyPosition` has been removed. Changes are synchronized automatically now
- Mesh:
 - `updateVerticesDataDirectly` has been removed. Use `mesh.geometry.updateVerticesDataDirectly()` instead
- SsaoRenderingPipeline:
 - `getBlurHPostProcess` has been removed. Blur post-process is no more required
 - `getBlurVPostProcess` has been removed. Blur post-process is no more required
- Scene:
 - `setGravity` has been removed. Use `scene.getPhysicsEngine().setGravity()` instead
 - `createCompoundImpostor` has been removed. Use PhysicsImpostor parent/child instead
 
## Canvas2D

### Major Updates
 - Added text alignment and word wrap to Text2D ([abow](https://github.com/abow))
 - Support of [Scale9Sprite](http://doc.babylonjs.com/overviews/Canvas2D_Sprite2D#scale9sprite-feature) feature in Sprite2D ([nockawa](https://github.com/nockawa))
 - Support of [AtlasPicture](http://doc.babylonjs.com/overviews/Canvas2D_AtlasPicture) to store many pictures into a bit one, with the possibility to create one/many Sprite2D out of it. ([nockawa](https://github.com/nockawa))
 - Support of BMFont with the BitmaptFontTexture class, Text2D has now a bitmapFontTexture setting in the constructor to display text using a BitmapFontTexture ([nockawa](https://github.com/nockawa))

### Minor Updates
 - WorldSpaceCanvas: TrackNode feature, a WSC can follow a Scene Node with an optional billboarding feature (always facing the camera)[Demo](http://babylonjs-playground.com/#1KYG17#1)
 - WorldSpaceCanvas: new setting unitScaleFactor to generated a bigger canvas than the world space mesh size. If you create a WSC with a size of 200;100 and a uSF of 3, the 3D Plane displaying the canvas will be 200;100 of scene units, the WSC will be 600;300 of pixels units.

### Bug Fixing
 - Fix Rotation issue when the Parent's Primitive hadn't a identity scale. ([nockawa](https://github.com/nockawa))
 - Primitive's position computed from TrackedNode are now hidden when the node is out of the Viewing Frustum ([nockawa](https://github.com/nockawa))
 - WorldSpaceCanvas: sideOrientation is finally working, you can try Mesh.DOUBLESIDE to make you Canvas visible on both sides. ([nockawa](https://github.com/nockawa))

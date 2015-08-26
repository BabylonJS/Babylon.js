Blender to Babylon.js exporter
==============================

The [Blender export plugin](http://blogs.msdn.com/b/eternalcoding/archive/2013/06/28/babylon-js-how-to-load-a-babylon-file-produced-with-blender.aspx) supports the following features:

For a discussion of Tower of Babel exporter, along with the difference this exporter, [See]{https://github.com/BabylonJS/Extensions/tree/master/TowerOfBabel)
* **Cameras**
 * Name
 * Position
 * Target
 * Fov
 * Clip start
 * Clip end
 * Check collisions
 * Gravity
 * Ellipsoid
 * Animations
 * 3D Camera Rigs
 * All kind of Babylon.js cameras can be chosen from a custom dropdown list
* **Lights**
 * Type (Point, directional (Sun), Spot, Hemispheric)
 * Name
 * Position
 * Direction
 * Spot size
 * Spot blend 
 * Energy
 * Diffuse color
 * Specular color
 * Shadow maps, all types (For directional lights)
 * Animations
* **Materials**
 * Name
 * Ambient color
 * Diffuse color
 * Specular color
 * Specular hardness
 * Emissive color
 * Alpha
 * Backface culling
 * Diffuse texture
 * Ambient texture
 * Opacity texture
 * Reflection texture
 * Emissive texture
 * Bump texture
 * Procedural Texture Baking
 * Cycles Render Baking
* **Multi-materials**
 * Name
 * Child materials
 * 32 bit vertex limit for multi-materials
* **Textures**
 * Name
 * Associated file
 * Level
 * Use alpha
 * uOffset / voffset
 * uScale / uScale
 * uAng / vAng / Wang
 * WrapU / WrapV
 * Coordinates index
 * Texture in-lining to .babylon file
* **Meshes**
 * Name
 * Geometry (Positions & normals)
 * Position
 * Rotation
 * Scaling
 * FreezeWorldMatrix
 * Texture coordinates (2 channels)
 * Vertex colors
 * Visibility
 * Check collisions
 * Billboard
 * Receive and cast shadows
 * Bones (armatures) and bones' animations
 * Animations






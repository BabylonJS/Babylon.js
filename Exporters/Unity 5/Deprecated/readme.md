Unity 5 to Babylon.js exporter
==============================

## Installation
You just need to copy/paste the plugin folder inside the **assets** folder of your project folder. Unity 5 will then detect the plugin, compile it and add a "BabylonJS" menu.
Using this menu you will be able to export the current scene to a .babylon file format.

## Usage
Just click on the "BabylonJS/Export to .babylon" menu to display the exportation window.

The exportation window allows you to specify:
* Default reflection level applied to reflection textures
* Collisions properties (on/off, ellipsoid used for the camera and scene's gravity)

You can launch the exportation process by clicking on the "Export" button


## Exported features
The current version can export the following features:

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
 * Animations (position)
* **Lights**
 * Type (Point, directional, Spot)
 * Name
 * Position
 * Direction
 * Spot angle
 * Intensity
 * Diffuse color
 * Animations (position)
 * Shadow maps
* **Materials**
 * Name
 * Diffuse color
 * Specular color
 * Specular power
 * Emissive color
 * Alpha
 * Backface culling
 * Diffuse texture
 * Reflection texture
 * Emissive texture
 * Bump texture
* **Multi-materials**
 * Name
 * Child materials
* **Textures**
 * Name
 * Associated file
 * Use alpha
 * uOffset / voffset
 * uScale / uScale
* **Meshes**
 * Name
 * Geometry (Positions & normals)
 * Position
 * Rotation
 * Scaling
 * Texture coordinates (2 channels)
 * Check collisions
 * Receive and cast shadows
 * Animations (position, rotation, scaling)






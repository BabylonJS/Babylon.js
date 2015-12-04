# Babylon.js glTF File Loader

# Usage
The glTF file loader is a SceneLoader plugin.
Just reference the loader in your HTML file:

```
<script src="babylon.2.1.js"></script>
<script src="babylon.glTFFileLoader.js"></script>
```

And then, call the scene loader:
```
BABYLON.SceneLoader.Load("./", "duck.gltf", engine, function (scene) { 
   // do somethings with the scene
});
```

## Supported features
* Load scenes (SceneLoader.Load)
* Import geometries
    * From binary files
    * From base64 buffers
* Import lights
* Import cameras
* Import and set custom shaders (if no shaders, the Babylon.js default material is applied)
    * Automatically bind attributes
    * Automatically bind matrices
    * Set uniforms
* Import and set animations
* Skinning
    * Skeletons
    * Hardware skinning (shaders support)
    * Bones import
* Handle dummy nodes (empty nodes)

## Unsupported features
* ImportMesh function

## To improve
* Test on more models
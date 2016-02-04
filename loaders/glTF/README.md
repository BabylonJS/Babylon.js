# Babylon.js glTF File Loader

# Usage
The glTF file loader is a SceneLoader plugin.
Just reference the loader in your HTML file:

```
<script src="babylon.2.2.js"></script>
<script src="babylon.glTFFileLoader.js"></script>
```

And then, call the scene loader:
```
BABYLON.SceneLoader.Load("./", "duck.gltf", engine, function (scene) { 
   // do somethings with the scene
});
```

You can also call the ImportMesh function and import specific meshes
```
// meshesNames can be set to "null" to load all meshes and skeletons
BABYLON.SceneLoader.ImportMesh(["myMesh1", "myMesh2", "..."], "./", "duck.gltf", scene, function (meshes, particleSystems, skeletons) { 
   // do somethings with the meshes, particleSystems (not handled in glTF files) and skeletons
});
```

In order the fix the UP vector (Y with Babylon.js) if you want to play with physics, you can customize the loader:
```
var plugin = BABYLON.SceneLoader.GetPluginForExtension(".gltf");
plugin.MakeYUP = true; // Which is false by default
```

## Supported features
* Load scenes (SceneLoader.Load and SceneLoader.Append)
* Support of ImportMesh function
* Import geometries
    * From binary files
    * From base64 buffers
* Import lights
* Import cameras
* Import and set custom shaders
    * Automatically bind attributes
    * Automatically bind matrices
    * Set uniforms
* Import and set animations
* Skinning (BETA, sometimes wrong on tricky models)
    * Skeletons
    * Hardware skinning (shaders support)
    * Bones import
* Handle dummy nodes (empty nodes)

## To improve
* Test on more geometries
* Test on more animated models
* Test on more skinned models
* Improve shaders support (glitches with samplers can appear in particular configurations)

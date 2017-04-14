# Babylon.js glTF File Loader

# Usage
The glTF file loader is a SceneLoader plugin. The loader supports glTF version 1.0 and 2.0 and will use the correct loader based on the glTF version string. Include the version support that you want in any combination.

Both versions:
```
<script src="babylon.js"></script>
<script src="babylon.glTFFileLoader.js"></script>
<script src="babylon.glTF1Loader.js"></script>
<script src="babylon.glTF2Loader.js"></script>
```

Version 1 only:
```
<script src="babylon.js"></script>
<script src="babylon.glTFFileLoader.js"></script>
<script src="babylon.glTF1Loader.js"></script>
```

Version 2 only:
```
<script src="babylon.js"></script>
<script src="babylon.glTFFileLoader.js"></script>
<script src="babylon.glTF2Loader.js"></script>
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

If you want to disable incremental loading, you can set the property `IncrementalLoading` to false.
Then, you'll be able to be called back with all geometries, shaders (V1), PBR materials (V2) loaded. Textures are always loaded asynchronously. For example, you can retrieve the real bounding infos of a mesh loaded when incremental loading is disabled.
```
BABYLON.GLTFFileLoader.IncrementalLoading = false; // true by default
```

(V1 only) In order to work with homogeneous coordinates (that can be available with some converters and exporters):
```
BABYLON.GLTFFileLoader.HomogeneousCoordinates = true; // false by default
```

## Supported features
* Load scenes (SceneLoader.Load and SceneLoader.Append)
* Support of ImportMesh function
* Import geometries
    * From binary files
    * From base64 buffers
* Import lights (V1 only)
* Import cameras
* Import and set custom shaders (V1 only)
    * Automatically bind attributes
    * Automatically bind matrices
    * Set uniforms
* Import and set animations
* Skinning (BETA, sometimes wrong on tricky models)
    * Skeletons
    * Hardware skinning (shaders support)
    * Bones import
* Handle dummy nodes (empty nodes)
* PBR materials (V2 only)

## To improve
* Test on more geometries
* Test on more animated models
* Test on more skinned models
* Improve shaders support (glitches with samplers can appear in particular configurations)

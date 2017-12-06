# Babylon.js glTF File Loader

The glTF file loader is a SceneLoader plugin.

[Simple Playground Example](http://www.babylonjs-playground.com/#2IK4U7)

## Setup

**Full Version**

This loader supports both glTF 1.0 and 2.0 and will use the correct loader based on the glTF version string.

```HTML
<script src="babylon.js"></script>
<script src="babylon.glTFFileLoader.js"></script>
```

**Version 1 Only**

This loader supports only glTF 1.0 and will fail to load glTF 2.0.

```HTML
<script src="babylon.js"></script>
<script src="babylon.glTF1FileLoader.js"></script>
```

**Version 2 Only**

This loader supports only glTF 2.0 and will fail to load glTF 1.0.

```HTML
<script src="babylon.js"></script>
<script src="babylon.glTF2FileLoader.js"></script>
```

## Loading the Scene
The Load function loads a glTF asset into a new scene.
```JavaScript
BABYLON.SceneLoader.Load("./", "duck.gltf", engine, function (scene) {
    // do something with the scene
});
```

The Append function appends a glTF file to an existing scene.
```JavaScript
BABYLON.SceneLoader.Append("./", "duck.gltf", scene, function (scene) {
    // do something with the scene
});
```

The ImportMesh function imports specific meshes from a glTF asset to an existing scene and returns the imported meshes and skeletons.
```JavaScript
// The first parameter can be set to null to load all meshes and skeletons
BABYLON.SceneLoader.ImportMesh(["myMesh1", "myMesh2"], "./", "duck.gltf", scene, function (meshes, particleSystems, skeletons) {
    // do something with the meshes and skeletons
    // particleSystems are always null for glTF assets
});
```

## Advanced

The SceneLoader returns the glTF loader instance to enable setting properties per instance.

```JavaScript
var loader = BABYLON.SceneLoader.Load("./", "duck.gltf", engine, function (scene) {
    // do something with the scene
});

// do something with the loader
// loader.<option1> = <...>
// loader.<option2> = <...>
// loader.dispose();
```

#### onParsed
Raised when the asset has been parsed. The `data.json` property stores the glTF JSON. The `data.bin` property stores the BIN chunk from a glTF binary or null if the input is not a glTF binary.

```JavaScript
loader.onParsed = function (data) {
    // do something with the data
};
```

### Version 1 Only

#### IncrementalLoading
Set this property to false to disable incremental loading which delays the loader from calling the success callback until after loading the meshes and shaders. Textures always loads asynchronously. For example, the success callback can compute the bounding information of the loaded meshes when incremental loading is disabled. Defaults to true.

```JavaScript
BABYLON.GLTFFileLoader.IncrementalLoading = false;
```

#### HomogeneousCoordinates
Set this property to true in order to work with homogeneous coordinates, available with some converters and exporters. Defaults to false.

```JavaScript
BABYLON.GLTFFileLoader.HomogeneousCoordinates = true;
```

### Version 2 Only

#### coordinateSystemMode
The coordinate system mode (AUTO, FORCE_RIGHT_HANDED). Defaults to AUTO.

```JavaScript
loader.coordinateSystemMode = BABYLON.GLTFLoaderCoordinateSystemMode.FORCE_RIGHT_HANDED;
```

#### animationStartMode
The animation start mode (NONE, FIRST, ALL). Defaults to FIRST.

```JavaScript
loader.animationStartMode = BABYLON.GLTFLoaderAnimationStartMode.NONE;
```

#### compileMaterials
Set to true to compile materials before raising the success callback. Defaults to false.

```JavaScript
loader.compileMaterials = true;
```

#### useClipPlane
Set to true to also compile materials with clip planes. Defaults to false.

```JavaScript
loader.useClipPlane = true;
```

#### compileShadowGenerators
Set to true to compile shadow generators before raising the success callback. Defaults to false.

```JavaScript
loader.compileShadowGenerators = true;
```

#### onMeshLoaded
Raised when the loader creates a mesh after parsing the glTF properties of the mesh.

```JavaScript
loader.onMeshLoaded = function (mesh) {
    // do something with the mesh
};
```

#### onTextureLoaded
Raised when the loader creates a texture 
after parsing the glTF properties of the texture.

```JavaScript
loader.onTextureLoaded = function (texture) {
    // do something with the texture
};
```

#### onMaterialLoaded
Raised when the loader creates a material after parsing the glTF properties of the material.

```JavaScript
loader.onMaterialLoaded = function (material) {
    // do something with the material
};
```

#### onComplete
Raised when the asset is completely loaded, immediately before the loader is disposed.
For assets with LODs, raised when all of the LODs are complete.
For assets without LODs, raised when the model is complete, immediately after onSuccess.

```JavaScript
loader.onComplete = function () {
    // do something when loading is complete
};
```

#### dispose
Disposes the loader, releases resources during load, and cancels any outstanding requests.

```JavaScript
// Cancel loading of the current glTF asset.
loader.dispose();
```

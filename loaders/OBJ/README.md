# Babylon.js .obj File Loader

#[Demo](http://www.babylonjs-playground.com/#28YUR5)
To use it, you just have to reference the loader file:

```
<script src="babylon.2.1.js"></script>
<script src="babylon.objFileLoader.js"></script>
```

Babylon.js will know how to load the obj file and its mtl file automatically: 
```
BABYLON.SceneLoader.Load("/assets/", "batman.obj", engine, function (newScene) { 
   // ...
});
```
```
var loader = new BABYLON.AssetsManager(scene);
var batman = loader.addMeshTask("batman", "", "assets/", "batman.obj");
```
```
BABYLON.SceneLoader.ImportMesh("batmanface", "batman.obj", scene, function (meshes) { 
   // ...
});
```

## Good things to know
* Your model doesn't have to be triangulated, as this loader will do it automatically.
* A Babylon.Mesh will be created for each object/group
* The obj model should be exported with -Z axis forward, and Y axis upward to be compatible with Babylon.js

## Supported
* Object/group
* Faces
    * triangles
    * quads
    * polygons
* Colors
    * diffuseColor
    * ambientColor
    * specularColor
    * specularPower
    * alpha
* Textures
    * ambientTexture
    * diffuseTexture
    * specularTexture
    * bumpTexture
    * opacityTexture
    
## Not supported currently
* Multimaterial for a same object/group 
    * To be implemented: a new BABYLON.Mesh is created for each sub-mesh of the current object/group
* Smoothing groups (s parameter in OBJ file)
* Illumination (illum parameter in MTL file)


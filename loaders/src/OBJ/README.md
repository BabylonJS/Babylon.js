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
BABYLON.SceneLoader.ImportMesh("batmanface", "", "batman.obj", scene, function (meshes) { 
   // ...
});
```

## Good things to know
* Your model doesn't have to be triangulated, as this loader will do it automatically.
* A Babylon.Mesh will be created for each object/group
* The obj model should be exported with -Z axis forward, and Y axis upward to be compatible with Babylon.js

![Axis](http://geomorph.sourceforge.net/preview/axes.jpg)

* By default, due to optimization in the code for loading time, UVs problems can appear, like this :

![Batman UVs problem](http://i.imgur.com/vjWKNRK.png)

If you meet this problem, set the variable 
```
BABYLON.OBJFileLoader.OPTIMIZE_WITH_UV = true;
```
Then, you'll have a better texture, but with a longer loading.

![Batman UVs ok](http://i.imgur.com/Dajwlvq.png)

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
* Multimaterial
	* For each material defined in the same mesh, it creates a new BABYLON.Mesh.
	* The name of the created BABYLON.Mesh follows this syntax: meshName_mmX 
	* X is the nth BABYLON.Mesh created with this method

    
## Not supported currently
* Smoothing groups (s parameter in OBJ file)
* Illumination (illum parameter in MTL file)
* The differents options for loading textures in MTL file.
* A good description about MTL file and his options could be found here: http://paulbourke.net/dataformats/mtl/

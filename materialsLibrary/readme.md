# Materials library

To get a detailled tutorial, please read the [documentation](http://doc.babylonjs.com/tutorials/How_to_create_a_material_for_materialsLibrary)

For every material, you can find a detailled documentation [here](http://doc.babylonjs.com/extensions) under **materials library** tag.

## Using a material from the library

You can find multiple materials that just works with Babylon.js in *dist* folder. To use then, you only need to reference the associated .js file and use the new provided material:

```
var simple = new BABYLON.SimpleMaterial("simple", scene);
sphere.material = simple;
```

## Adding a new material to the library

To add a new material, you have to create your own folder in *materials* folder. Then you need to add a .ts file an two .fx files:
* The .ts is the TypeScript code of your material
* .fx files: GLSL code for vertex and fragment shaders

The best way to start a new material is to copy/past the *simple* material. This material provides all the features required by a Babylon.js material:
- Bones support
- Instances support
- Support for up to 4 lights
- Cache support
- Shadows support
- Fog support
- Point rendering support
- Clip plane support

But you can also start from scratch as you are not forced to support all these features.

## Integrating the material in the build process

To build all materials and generate the *dist* folder, just run:

```
gulp
```

To integrate your new material to the build process, you have to edit the config.sjon file and add an entry in the "materials" section of the file:

```
{
  "materials": [
    {
      "file": "shaders/simple/babylon.simpleMaterial.ts",
      "shaderFiles": [
        "shaders/simple/simple.vertex.fx",
        "shaders/simple/simple.fragment.fx"
      ],
      "output": "babylon.simpleMaterial.js"
    }
  ],
  "build": {
    "distOutputDirectory": "dist/"
  }
}
```

## Testing your material

To test your material, you can use the /test/index.html file by adding a reference to your .js file. Then you will need to update the code to create an instance of your material and reference it in the UI system:

```
gui.add(options, 'material', ['standard', 'simple']).onFinishChange(function () {
					switch (options.material) {
						case "simple":
							currentMaterial = simple;
							break;
						default:
							currentMaterial = std;
							break;
					}

					currentMesh.material = currentMaterial;
				});
```

This page allows you to test your code with animated meshes, shadows, various kinds of lights and fog. Just use the UI on the right to turn features on and off.

To serve this page, you can start:

```
gulp webserver
```

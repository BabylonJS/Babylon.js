## Using a procedural texture from the library

You can find multiple procedural textures that just works with Babylon.js in *dist* folder. To use then, you only need to reference the associated .js file and use the new provided texture:

```
var fire = new BABYLON.FireProceduralTexture2("firePT", 256, scene);
sphere.material.diffuseTexture = fire;
```

## Adding a new procedural texture to the library

To add a new procedural texture, you have to create your own folder in *proceduralTextures* folder. Then you need to add a .ts file and one .fragment.fx files:
* The .ts is the TypeScript code of your procedural texture
* .fx file: GLSL code for fragment shaders

## Integrating the material in the build process

To build all procedural textures and generate the *dist* folder, just run:

```
gulp
```

To integrate your new procedural texture to the build process, you have to edit the config.sjon file and add an entry in the "proceduralTextures" section of the file:

```
{
  "proceduralTextures": [
    {
      "file": "proceduralTextures/fire/babylon.fireProceduralTexture.ts",
      "shaderFiles": [
        "proceduralTextures/fire/fireProceduralTexture.fragment.fx"
      ],
      "output": "babylon.fireProceduralTexture.js"
    }
  ],
  "build": {
    "distOutputDirectory": "dist/"
  }
}
```

## Testing your procedural texture

To test your procedural texture, you can use the /test/index.html file by adding a reference to your .js file. Then you will need to update the code to create an instance of your procedural texture and reference it in the UI system:

```
gui.add(options, 'material', ['none','fire']).onFinishChange(function () {
  switch (options.material) {
    case "fire":
      currentMaterial = fireMaterial;
      break;
    case "none":
    default:
      currentMaterial = std;
      break;
  }

  currentMesh.material = currentMaterial;
  window.enableMaterial(options.material);
});
```

This page allows you to test your code with animated meshes, shadows, various kinds of lights and fog. Just use the UI on the right to turn features on and off.

To serve this page, you can start:

```
gulp webserver
```

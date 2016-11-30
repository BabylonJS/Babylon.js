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

## Integrating the procedural texture in the build process

To build all procedural textures and generate the *dist* folder, just run from the tools/gulp folder:

```
gulp proceduralTextureLibrary
```

To integrate your new procedural texture to the build process, you have to edit the config.sjonfile in the tools/gulp folder and add an entry in the "proceduralTextureLibrary/libraries" section of the file:

```
  "libraries": [
    ...
      {
        "files": ["../../proceduralTexturesLibrary/src/wood/babylon.woodProceduralTexture.ts"],
        "shaderFiles": [
          "../../proceduralTexturesLibrary/src/wood/woodProceduralTexture.fragment.fx"
        ],
        "output": "babylon.woodProceduralTexture.js"
      }
    ...
  ]
```

## Testing your procedural texture

To test your procedural texture, you can use the /proceduralTextureLibrary/index.html  page. References are added automatically. You only need to update the code to create an instance of your procedural texture and reference it in the UI system:

```
gui.add(options, 'texture', ['default', 'fire', 'wood', 'cloud', 'grass', 'road', 'brick', 'marble', '[YOURTEXTURE]', 'starfield']).onFinishChange(function () {
  resetPTOptions();
  switch (options.texture) {
    case "fire":
      currentTexture = firePT;
      addPToptions(firePT, ['time', 'alphaThreshold', 'speed', ]);
      break;
    
    //.......................

    //YOURTEXTURE

    case "none":
    default:
      currentTexture = diffuseTexture;
      break;
  }

  std.diffuseTexture = currentTexture;
  window.enableTexture(options.texture);
});
```

This page allows you to test your code with animated meshes, shadows, various kinds of lights and fog. Just use the UI on the right to turn features on and off.

To serve this page, you can start from the tools/gulp folder the task:

```
gulp webserver
```

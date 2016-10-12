## Using a post process from the library

You can find multiple post processes that just works with Babylon.js in *dist* folder. To use then, you only need to reference the associated .js file and use the new provided post process:

```
var fire = new BABYLON.FireProceduralTexture2("firePT", 256, scene);
sphere.material.diffuseTexture = fire;
```

## Adding a new post process to the library

To add a new post process, you have to create your own folder in *postProcesses* folder. Then you need to add a .ts file and one .fragment.fx files:
* The .ts is the TypeScript code of your post process
* .fx file: GLSL code for fragment shaders

## Integrating the post process in the build process

To build all post processes and generate the *dist* folder, just run:

```
gulp
```

To integrate your new post process to the build process, you have to edit the config.sjon file and add an entry in the "postProcesses" section of the file:

```
{
  "postProcesses": [
    {
      "file": "postProcesses/asciiArt/babylon.asciiArtPostProcess.ts",
      "shaderFiles": [
        "postProcesses/asciiArt/asciiart.fragment.fx"
      ],
      "output": "babylon.asciiArtPostProcess.js"
    }
  ],
  "build": {
    "distOutputDirectory": "dist/"
  }
}
```
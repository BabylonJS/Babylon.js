## Babylon.js loaders

You will find here all loading plugin that you can use to load different formats than .babylon

To use then you just have to reference the loader file:

```
<script src="Babylon.js"></script>
<script src="babylon.stlFileLoader.js"></script>
```

And then the SceneLoader will know how to load the new extension:
```
BABYLON.SceneLoader.Load("/Files/", "ch9.stl", engine, function (newScene) { 
   newScene.activeCamera.attachControl(canvas, false);
   engine.runRenderLoop(function () { 
       newScene.render(); 
   }); 
});
```

To compile, from the tools/gulp folder:

```
gulp loaders
```
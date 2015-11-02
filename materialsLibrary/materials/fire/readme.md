# Fire material

## [Playground example](http://www.babylonjs-playground.com/#21IIM9)

## Using the fire material

The fire material works with 3 textures:
- The diffuse texture (fire texture)
- The distortion texture (to create perturbations on diffuse texture)
- The opacity texture (black and white)

**Note:** *The fire material doesn't work with lighting. So, shadow maps are also disabled.*

```
var fireMaterial = new BABYLON.FireMaterial("fireMaterial", scene);
fireMaterial.diffuseTexture = new BABYLON.Texture("diffuse.png", scene);
fireMaterial.distortionTexture = new BABYLON.Texture("distortion.png", scene);
fireMaterial.opacityTexture = new BABYLON.Texture("opacity.png", scene);

var plane = BABYLON.Mesh.CreatePlane("fireplane", 1.0, scene);
plane.material = fire;
```

The speed of fire flames can be customized like:

```
fireMaterial.speed = 5.0; // Default is 1.0
```



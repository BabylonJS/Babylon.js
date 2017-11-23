Introduction
==========

This is a branch of https://github.com/BabylonJS/Babylon.js .

This branch is tend to add more features to the origin engine.

Team Members
==========

Jiahao Liu https://github.com/lostink

Yalun Hu https://github.com/chestnutwww


Featue 0 : Spot Light Texture Projection
==========

### Feature Description

This feature enables user to add texture to spot light to make it project desired texture

### Demo

![](milestone1.gif)

### How to use

For a particular spot light, set its projection texture and mark it as texture projection enabled
will autometically handle everything. If direction, upVector, rightVector and angle is changed,
```light.computeTextureMatrix()``` need to be called.

```
	
light.projectionMaterial.projectedLightTexture = new BABYLON.Texture("textures/upenn.jpg",scene);
light.enableProjectionTexture = true;
	
```

You can optimize these values for projection settings:

* Near Clip Distance

```

light.light_near = 1000.0;
light.computeTextureMatrix();

```

* Far Clip Distance

```

light.light_near = 0.1;
light.computeTextureMatrix();

```

* Up vector for spot light space

If up vector is not properly set, resulting in the up vector is not perpendicular to direction vector, 
then it will be autometically reset. It is not necessary for up vector to be a unit vector.

```

light.upVector = new BABYLON.Vector3(1,0,1);
light.computeTextureMatrix();

```


* Right Vector for spot light space

If right vector is not properly set, resulting in the right vector is not perpendicular to direction vector, 
then it will be autometically reset. It is not necessary for right vector to be a unit vector.

```

light.rightVector = new BABYLON.Vector3(1,0,1);
light.computeTextureMatrix();

```

### Demo running code in playground

```
	
var createScene = function () {
	var scene = new BABYLON.Scene(engine);

	// Setup environment
	var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0.8, 90, BABYLON.Vector3.Zero(), scene);
	camera.lowerBetaLimit = 0.1;
	camera.upperBetaLimit = (Math.PI / 2) * 0.9;
	camera.lowerRadiusLimit = 30;
	camera.upperRadiusLimit = 150;
	camera.attachControl(canvas, true);

	// light2
	var light2 = new BABYLON.SpotLight("spot02", 
								new BABYLON.Vector3(30, 40, 20),
								new BABYLON.Vector3(-1, -2, -1), 
								1.1, 
								1, 
								scene);
	light2.intensity = 0.5;
	light2.projectionMaterial.projectedLightTexture = new BABYLON.Texture("textures/upenn.jpg",scene);
	light2.enableProjectionTexture = true;

	var lightSphere2 = BABYLON.Mesh.CreateSphere("sphere", 10, 2, scene);
	lightSphere2.position = light2.position;
	lightSphere2.material = new BABYLON.StandardMaterial("light", scene);
	lightSphere2.material.emissiveColor = new BABYLON.Color3(1, 1, 0);

	// Ground
	var ground = BABYLON.Mesh.CreateGroundFromHeightMap("ground", 
										"textures/heightMap.png", 
										200, 
										200, 
										100, 
										0, 
										10, 
										scene, 
										false);
	var groundMaterial = new BABYLON.StandardMaterial("ground", scene);
	groundMaterial.diffuseTexture = new BABYLON.Texture("textures/ground.jpg", scene);
	groundMaterial.diffuseTexture.uScale = 6;
	groundMaterial.diffuseTexture.vScale = 6;
	groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
	ground.position.y = -2.05;
	ground.material = groundMaterial;

	// Torus
	var torus = BABYLON.Mesh.CreateTorus("torus", 4, 2, 30, scene, false);

	// Box
    var box = BABYLON.Mesh.CreateBox("box", 3);
    box.parent = torus;	

	// Shadows

	var shadowGenerator2 = new BABYLON.ShadowGenerator(1024, light2);
	shadowGenerator2.addShadowCaster(torus);
	shadowGenerator2.usePoissonSampling = true;

	ground.receiveShadows = true;

	// Animations
	var alpha = 0;
	scene.registerBeforeRender(function () {
		torus.rotation.x += 0.01;
		torus.rotation.z += 0.02;

		torus.position = new BABYLON.Vector3(Math.cos(alpha) * 30, 10, Math.sin(alpha) * 30);
		alpha += 0.01;
        light2.direction.x = Math.cos(alpha * 2);
        light2.direction.z = Math.sin(alpha * 2);
        light2.computeTextureMatrix();
	});

	return scene;
}

```

var BABYLON = require("../../dist/preview release/babylon.max");
var LOADERS = require("../../dist/preview release/loaders/babylonjs.loaders");
global.XMLHttpRequest = require('xhr2').XMLHttpRequest;

var engine = new BABYLON.NullEngine();

// //Adding a light
// var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(20, 20, 100), scene);

// //Adding an Arc Rotate Camera
// var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0.8, 100, BABYLON.Vector3.Zero(), scene);

// // The first parameter can be used to specify which mesh to import. Here we import all meshes
// BABYLON.SceneLoader.ImportMesh("", "https://playground.babylonjs.com/scenes/", "skull.babylon", scene, function (newMeshes) {
//     // Set the target of the camera to the first imported mesh
//     camera.target = newMeshes[0];

//     console.log("Meshes loaded from babylon file: " + newMeshes.length);
//     for (var index = 0; index < newMeshes.length; index++) {
//         console.log(newMeshes[index].toString());
//     }

//     BABYLON.SceneLoader.ImportMesh("", "https://www.babylonjs.com/Assets/DamagedHelmet/glTF/", "DamagedHelmet.gltf", scene, function (meshes) {
//         console.log("Meshes loaded from gltf file: " + meshes.length);
//         for (var index = 0; index < meshes.length; index++) {
//             console.log(meshes[index].toString());
//         }
//     });

//     console.log("render started")
//     engine.runRenderLoop(function() {
//         scene.render();
//     })
// });
    
// Setup environment
// var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0.8, 90, BABYLON.Vector3.Zero(), scene);
// camera.lowerBetaLimit = 0.1;
// camera.upperBetaLimit = (Math.PI / 2) * 0.9;
// camera.lowerRadiusLimit = 30;
// camera.upperRadiusLimit = 150;

// // light1
// var light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(-1, -2, -1), scene);
// light.position = new BABYLON.Vector3(20, 40, 20);
// light.intensity = 0.5;

// var lightSphere = BABYLON.Mesh.CreateSphere("sphere", 10, 2, scene);
// lightSphere.position = light.position;
// lightSphere.material = new BABYLON.StandardMaterial("light", scene);
// lightSphere.material.emissiveColor = new BABYLON.Color3(1, 1, 0);

// // light2
// var light2 = new BABYLON.SpotLight("spot02", new BABYLON.Vector3(30, 40, 20),
//                                             new BABYLON.Vector3(-1, -2, -1), 1.1, 16, scene);
// light2.intensity = 0.5;

// var lightSphere2 = BABYLON.Mesh.CreateSphere("sphere", 10, 2, scene);
// lightSphere2.position = light2.position;
// lightSphere2.material = new BABYLON.StandardMaterial("light", scene);
// lightSphere2.material.emissiveColor = new BABYLON.Color3(1, 1, 0);

// // Ground
// var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);
// var groundMaterial = new BABYLON.StandardMaterial("ground", scene);
// groundMaterial.diffuseTexture = new BABYLON.Texture("textures/ground.jpg", scene);
// groundMaterial.diffuseTexture.uScale = 6;
// groundMaterial.diffuseTexture.vScale = 6;
// groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
// ground.position.y = -2.05;
// ground.material = groundMaterial;

// // Torus
// var torus = BABYLON.Mesh.CreateTorus("torus", 4, 2, 30, scene, false);

// // Box
// var box = BABYLON.Mesh.CreateBox("box", 3);
// box.parent = torus;	

// // Shadows
// var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
// shadowGenerator.addShadowCaster(torus);
// shadowGenerator.useExponentialShadowMap = true;

// var shadowGenerator2 = new BABYLON.ShadowGenerator(1024, light2);
// shadowGenerator2.addShadowCaster(torus);
// shadowGenerator2.usePoissonSampling = true;

// ground.receiveShadows = true;

// // Animations
// var alpha = 0;
// scene.registerBeforeRender(function () {
//     torus.rotation.x += 0.01;
//     torus.rotation.z += 0.02;

//     torus.position = new BABYLON.Vector3(Math.cos(alpha) * 30, 10, Math.sin(alpha) * 30);
//     alpha += 0.01;

// });
// 	//Adding a light
// 	var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(20, 20, 100), scene);
    
//         //Adding an Arc Rotate Camera
//         var camera = new BABYLON.ArcRotateCamera("Camera", -0.5, 2.2, 100, BABYLON.Vector3.Zero(), scene);
    
//         // The first parameter can be used to specify which mesh to import. Here we import all meshes
//         BABYLON.SceneLoader.ImportMesh("", "https://www.babylonjs-playground.com/scenes/", "skull.babylon", scene, function (newMeshes) {
//             // Set the target of the camera to the first imported mesh
//             camera.target = newMeshes[0];
    
//             newMeshes[0].material = new BABYLON.StandardMaterial("skull", scene);
//             newMeshes[0].material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
//         });
    
//         // Create the "God Rays" effect (volumetric light scattering)
//         var godrays = new BABYLON.VolumetricLightScatteringPostProcess('godrays', 1.0, camera, null, 100, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false);
    
//         // By default it uses a billboard to render the sun, just apply the desired texture
//         // position and scale
//         godrays.mesh.material.diffuseTexture = new BABYLON.Texture('https://www.babylonjs-playground.com/textures/sun.png', scene, true, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
//         godrays.mesh.material.diffuseTexture.hasAlpha = true;
//         godrays.mesh.position = new BABYLON.Vector3(-150, 150, 150);
//         godrays.mesh.scaling = new BABYLON.Vector3(350, 350, 350);
    
//         light.position = godrays.mesh.position;

// engine.runRenderLoop(function() {
//     scene.render();
// })

BABYLON.SceneLoader.Load("https://playground.babylonjs.com/scenes/", "skull.babylon", engine, (scene) => {
    console.log('scene loaded!');
    for (var index = 0; index < scene.meshes.length; index++) {
        console.log(scene.meshes[index].name);
    }    
    engine.runRenderLoop(function() {
        scene.render();
    });
  
  }, progress => {}, (scene, err) => console.error('error:', err));
var BABYLON = require("babylonjs");
var LOADERS = require("babylonjs-loaders");
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

// new BABYLON.Scene(engine).dispose()

// BABYLON.SceneLoader.Load("https://playground.babylonjs.com/scenes/", "skull.babylon", engine, (scene) => {
//     console.log('scene loaded!');
//     for (var index = 0; index < scene.meshes.length; index++) {
//         console.log(scene.meshes[index].name);
//     } 
//     engine.dispose();   
//    // engine.runRenderLoop(function() {
//      //   scene.render();
//     //});

//   }, progress => {}, (scene, err) => console.error('error:', err));
// var scene = new BABYLON.Scene(engine);
// var camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 0, BABYLON.Vector3.Zero(), scene);
// scene.render();
// var pos = BABYLON.Vector3.Project(
//               new BABYLON.Vector3(0.5, 0.5, 0.5),
//               BABYLON.Matrix.Identity(),
//               scene.getTransformMatrix(),
//               scene.activeCamera.viewport.toGlobal(
//               engine.getRenderWidth(),
//               engine.getRenderHeight()
//             ));;

//             console.log(pos);

// const scene = new BABYLON.Scene(engine);
// new BABYLON.PBRMetallicRoughnessMaterial("asdfasf", scene);
// scene.dispose();

// BABYLON.Tools.LogLevels = BABYLON.Tools.ErrorLogLevel & BABYLON.Tools.WarningLogLevel;
// const scene = new BABYLON.Scene(engine);
// BABYLON.ParticleHelper.CreateAsync("sun", scene)
//             .then((system) => {
//                 console.log("ok");
//             });

// const camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
// const mesh = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
// mesh.position.set(0.5, 0.5, 0.5);
// mesh.isPickable = true;
// scene.render();
// engine.dispose();

// var scene = new BABYLON.Scene(engine);
// var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(20, 20, 100), scene);

// var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0.8, 100, BABYLON.Vector3.Zero(), scene);

// var assetsManager = new BABYLON.AssetsManager(scene);
// var meshTask = assetsManager.addMeshTask("skull task", "", "https://raw.githubusercontent.com/RaggarDK/Baby/baby/", "he4.babylon");

// meshTask.onSuccess = function (task) {
//     
//     //0 = ground plane, 1,2,3 = boxes
//     for(var i=1;i<task.loadedMeshes.length;i++){
//         var mesh = task.loadedMeshes[i];
//         //mesh.computeWorldMatrix(true);

//         var position = mesh.position.clone();
//         var rotation = mesh.rotationQuaternion.clone();
//         var scaling = mesh.getBoundingInfo().boundingBox.extendSize;
//         var centerWorld = mesh.getBoundingInfo().boundingBox.centerWorld;
//         console.log(position);
//         console.log(mesh.getBoundingInfo());

//         var box = BABYLON.MeshBuilder.CreateBox("box"+i,{height:2,width:2,depth:2});
//         box.scaling.copyFromFloats(scaling.x,scaling.y,scaling.z);    
//         box.rotationQuaternion = rotation;
//         //box.position = position;
//         box.position.set(centerWorld.x,centerWorld.y,centerWorld.z);

//         var material = new BABYLON.StandardMaterial("mat", scene);
//         material.diffuseColor = new BABYLON.Color3(0.5,1,0.5); 
//         box.material = material;       

//     }

// }	

// scene.registerBeforeRender(function () {
//     light.position = camera.position;
// });

// assetsManager.onFinish = function (tasks) {
//     engine.runRenderLoop(function () {
//         scene.render();
//     });
// };

// assetsManager.load();

// var scene = new BABYLON.Scene(engine);
// var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 1,  Math.PI / 1, 5, BABYLON.Vector3.Zero(), scene);
// camera.setPosition(new BABYLON.Vector3(-800,1200,-2000));
// camera.setTarget(BABYLON.Vector3.Zero());
// var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
// light.intensity = 1;


// function createPart(name,opt,parent){

//     var part = BABYLON.MeshBuilder.CreateBox(name, opt.size, scene);
//     part.position = new BABYLON.Vector3(opt.pos.x, opt.pos.y, opt.pos.z);

//     let mate = new BABYLON.StandardMaterial('mat-'+name, scene);

//     if(parent) {
//         mate.specularPower = 200;
//         mate.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
//         mate.diffuseTexture = new BABYLON.Texture(opt.mat.url,scene);
//         mate.diffuseTexture.wAng = opt.mat.grain*Math.PI/180;
//         part.parent = parent;
//     }else{
//         mate.alpha = 0;
//     }

//     part.material = mate;

//     return part;
// }



// var parent;

// function createUnit(x,y,z,b){

//     var item = {
//         size:{width:x,depth:y,height:z},
//         pos:{x:0,y:0,z:0},
//         mat:{url:false,grain:0},
//         child:{
//             left:{
//                 size:{width:b,depth:y,height:z},
//                 pos:{x:-(x-b)/2,y:0,z:0},
//                 mat:{url:"/Playground/textures/crate.png",grain:90}
//             },
//             right:{
//                 size:{width:b,depth:y,height:z},
//                 pos:{x:(x-b)/2,y:0,z:0},
//                 mat:{url:"/Playground/textures/crate.png",grain:90}
//             },
//             top:{
//                 size:{width:x-(b*2),depth:y,height:b},
//                 pos:{x:0,y:(z-b-1)/2,z:0},
//                 mat:{url:"/Playground/textures/albedo.png",grain:0}
//             },
//             bottom:{
//                 size:{width:x-(b*2),depth:y,height:b},
//                 pos:{x:0,y:-(z-b-1)/2,z:0},
//                 mat:{url:"/Playground/textures/albedo.png",grain:0}
//             },
//             back:{
//                 size:{width:x-(b*2),depth:b,height:z-(b*2)-1},
//                 pos:{x:0,y:0,z:(y-b)/2-20},
//                 mat:{url:"/Playground/textures/albedo.png",grain:0}
//             },
//             shelf:{
//                 size:{width:x-(b*2)-1,depth:y-b-30,height:b},
//                 pos:{x:0,y:0,z:-((b+20)/2)+5},
//                 mat:{url:"textures/crate.png",grain:45}
//             }
//         }
//     };

//     if(parent){
//         parent.dispose();
//     }

//     parent = createPart("Unit",item,false);

//     Object.keys(item.child).forEach(function(key) {
//         createPart(key,item.child[key],parent);
//     });

//     return item;
// }

// createUnit(600,300,900,18);


// var serialized = BABYLON.SceneSerializer.SerializeMesh(parent, true, true);
// console.log(serialized);

// var scene = new BABYLON.Scene(engine);

// var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(20, 20, 100), scene);

// var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0.8, 100, BABYLON.Vector3.Zero(), scene);

// BABYLON.SceneLoader.ImportMesh("", "https://playground.babylonjs.com/scenes/", "skull.babylon", scene, function(newMeshes) {
//     camera.target = newMeshes[0];

//     console.log("Meshes loaded from babylon file: " + newMeshes.length);
//     for (var index = 0; index < newMeshes.length; index++) {
//         console.log(newMeshes[index].toString());
//     }

//     BABYLON.SceneLoader.ImportMesh("", "https://www.babylonjs.com/Assets/DamagedHelmet/glTF/", "DamagedHelmet.gltf", scene, function(meshes) {
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
var scene = new BABYLON.Scene(engine);
var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0.8, 100, BABYLON.Vector3.Zero(), scene);
const scaling = engine.getHardwareScalingLevel();

const pos = BABYLON.Vector3.Project(
    new BABYLON.Vector3(5, 10, 3),
    BABYLON.Matrix.IdentityReadOnly,
    scene.getTransformMatrix(),
    scene.activeCamera.viewport.toGlobal(
        engine.getRenderWidth(),
        engine.getRenderHeight(),
    ),
);
pos.x *= scaling;
pos.y *= scaling;
pos.z *= scaling;
return pos;
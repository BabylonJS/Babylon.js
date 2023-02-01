// // Create a test scene
// let engine = new BABYLON.Engine(canvas, true);
// let scene = new BABYLON.Scene(engine);

// // Create the OpaqueObjectCopier class
// let copier = new OpaqueObjectCopier(engine, scene);

// // Add a sphere to the scene
// let sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2 }, scene);

// // Apply refraction texture to the sphere
// sphere.material = new BABYLON.StandardMaterial("sphereMaterial", scene);
// sphere.material.refractionTexture = scene.refractionTexture;

// // Run the render loop
// engine.runRenderLoop(() => {
//   scene.render();
// });
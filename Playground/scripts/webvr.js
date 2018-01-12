var createScene = function () {

    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);
    scene.createDefaultVRExperience();

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Create some spheres at the default eye level (2m)
    createSphereBox(scene, 2, 2);
    createSphereBox(scene, 3, 2);
        
    // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
    var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);

    return scene;
};

function createSphereBox(scene, distance, height) {    
    createSphere(scene,  distance, height,  distance);
    createSphere(scene,  distance, height, -distance);
    createSphere(scene, -distance, height,  distance);
    createSphere(scene, -distance, height, -distance);    
}
function createSphere(scene, x, y, z) {
    // Our built-in 'sphere' shape. Params: name, subdivs, size, scene
    var sphere = BABYLON.Mesh.CreateSphere("sphere1", 4, 0.4, scene);
    sphere.position.x = x;
    sphere.position.y = y;
    sphere.position.z = z;
}
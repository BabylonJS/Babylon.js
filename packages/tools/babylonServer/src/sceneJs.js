/* global BABYLON */
import { loadPlayground, getPlaygroundId } from "./playground";
const canvas = document.getElementById("babylon-canvas"); // Get the canvas element

// Add your code here matching the playground format
const createScene = function (engine) {
       // Random replacement
       var seed = 1;
       Math.random = function() {
           var x = Math.sin(seed++) * 10000;
           return x - Math.floor(x);
       }
   
       // This creates a basic Babylon Scene object (non-mesh)
       var scene = new BABYLON.Scene(engine);
   
   
       for (var i = 0; i < 1000; i++) {
           // Our built-in 'sphere' shape.
           var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);
   
           // Move the sphere upward 1/2 its height
           sphere.position.x = Math.random() * 100;
           sphere.position.y = Math.random() * 100;
           sphere.position.z = Math.random() * 100;
       }
   
       scene.createDefaultCameraOrLight(true, true, true);
   

//        var test = () => {
//         console.log("Go!");
//         let begin = performance.now();
//     for (var toto = 0; toto < 1000; toto++) {
//         scene.render();
//     }
//     let end = performance.now();
    
//     console.log("Diff: " + (end - begin) + " ms");
//     setTimeout(() => {
//         test();
//     }, 500);
//        }

//    setTimeout(() => {
//     test();
//    }, 500)
   
console.log("yo")
       return scene;
};
let engine;
let scene;
const runScene = async () => {
    const playgroundId = getPlaygroundId();
    if (engine) {
        engine.dispose();
        engine = undefined;
    }
    engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
    if (playgroundId) {
        window.engine = engine;
        window.canvas = canvas;
        scene = await loadPlayground(playgroundId);
    } else {
        scene = createScene(engine); //Call the createScene function
    }

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        if (scene.activeCamera || (scene.activeCameras && scene.activeCameras.length > 0)) {
            scene.render();
        }
    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize();
    });
};

runScene();

window.addEventListener("hashchange", runScene);

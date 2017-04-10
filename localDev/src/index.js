/// <reference path="../../dist/preview release/babylon.d.ts"/>

var scramble = function(data) {
    for (index = 0; index < data.length; index ++) {
        data[index] += 0.1 * Math.random();
    }
}

// Playground like creation of the scene
var createScene = function () {

    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.ArcRotateCamera("camera1", 1.14, 1.13, 10, BABYLON.Vector3.Zero(), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Our built-in 'sphere' shape. Params: name, subdivs, size, scene
    var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);

    var sphere2 = BABYLON.Mesh.CreateSphere("sphere2", 16, 2, scene);
    sphere2.setEnabled(false);
    sphere2.updateMeshPositions(scramble);

    var sphere3 = BABYLON.Mesh.CreateSphere("sphere3", 16, 2, scene);
    sphere3.setEnabled(false);

    sphere3.scaling = new BABYLON.Vector3(2.1, 3.5, 1.0);
    sphere3.bakeCurrentTransformIntoVertices();

    var sphere4 = BABYLON.Mesh.CreateSphere("sphere4", 16, 2, scene);
    sphere4.setEnabled(false);
    sphere4.updateMeshPositions(scramble);

    var sphere5 = BABYLON.Mesh.CreateSphere("sphere5", 16, 2, scene);
    sphere5.setEnabled(false);

    sphere5.scaling = new BABYLON.Vector3(1.0, 0.1, 1.0);
    sphere5.bakeCurrentTransformIntoVertices();    

    var manager = new BABYLON.MorphTargetManager();
    sphere.morphTargetManager = manager;

    var target0 = BABYLON.MorphTarget.FromMesh(sphere2, "sphere2", 0.25);
    manager.addTarget(target0);

    var target1 = BABYLON.MorphTarget.FromMesh(sphere3, "sphere3", 0.25);
    manager.addTarget(target1);

    var target2 = BABYLON.MorphTarget.FromMesh(sphere4, "sphere4", 0.25);
    manager.addTarget(target2);   

    var target3 = BABYLON.MorphTarget.FromMesh(sphere5, "sphere5", 0.25);
    manager.addTarget(target3);       

    var gui = new dat.GUI();
    var options = {
	    influence0: 0.25,
        influence1: 0.25,
        influence2: 0.25,
        influence3: 0.25,
    }

    gui.add(options, "influence0", 0, 1).onChange(function(value) {
		target0.influence = value;
    });

    gui.add(options, "influence1", 0, 1).onChange(function(value) {
		target1.influence = value;
    });

    gui.add(options, "influence2", 0, 1).onChange(function(value) {
		target2.influence = value;
    });  

    gui.add(options, "influence3", 0, 1).onChange(function(value) {
		target3.influence = value;
    });        

    var button = { switch:function(){
         if (sphere.morphTargetManager) {
             sphere.morphTargetManager = null;
         } else {
             sphere.morphTargetManager = manager;
         }
    }};

    gui.add(button,'switch');

    var disposeButton = { dispose:function(){
         sphere.dispose();
    }};

    gui.add(disposeButton,'dispose');

    var removeButton = { removeLast:function(){
         manager.removeTarget(target3);   
    }};

    gui.add(removeButton,'removeLast');


    return scene;

};
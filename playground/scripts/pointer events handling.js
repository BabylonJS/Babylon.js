var createScene = function () {

    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
    var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
    sphere.position.y = 1;
    var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);

    scene.exclusiveDoubleMode = false;

    scene.onPrePointerObservable.add( function(pointerInfo, eventState) {
        console.log('%c PrePointerObservable: pointer down', 'background: red; color: white');
        //pointerInfo.skipOnPointerObservable = true;
    }, BABYLON.PointerEventTypes.POINTERDOWN, false);
    scene.onPrePointerObservable.add( function(pointerInfo, eventState) {
        console.log('%c PrePointerObservable: pointer up', 'background: red; color: white');
        // pointerInfo.skipOnPointerObservable = true;
    }, BABYLON.PointerEventTypes.POINTERUP, false);
    scene.onPrePointerObservable.add( function(pointerInfo, eventState) {
        console.log('%c PrePointerObservable: pointer pick: ' + pointerInfo.pickInfo.pickedMesh.name, 'background: red; color: white');
    }, BABYLON.PointerEventTypes.POINTERPICK, false);
    scene.onPrePointerObservable.add( function(pointerInfo, eventState) {
        console.log('%c PrePointerObservable: pointer tap', 'background: red; color: white');
    }, BABYLON.PointerEventTypes.POINTERTAP, false);
    scene.onPrePointerObservable.add( function(pointerInfo, eventState) {
        console.log('%c PrePointerObservable: pointer double tap', 'background: red; color: white');
    }, BABYLON.PointerEventTypes.POINTERDOUBLETAP, false);
    scene.onPointerObservable.add( function(pointerInfo, eventState) {
        console.log('%c PointerObservable: pointer down', 'background: blue; color: white');
    }, BABYLON.PointerEventTypes.POINTERDOWN, false);
    scene.onPointerObservable.add( function(pointerInfo, eventState) {
        console.log('%c PointerObservable: pointer up', 'background: blue; color: white');
    }, BABYLON.PointerEventTypes.POINTERUP, false);
    scene.onPointerObservable.add( function(pointerInfo, eventState) {
        console.log('%c PointerObservable: pointer pick: ' + pointerInfo.pickInfo.pickedMesh.name, 'background: blue; color: white');
    }, BABYLON.PointerEventTypes.POINTERPICK, false);
    scene.onPointerObservable.add( function(pointerInfo, eventState) {
        console.log('%c PointerObservable: pointer tap', 'background: blue; color: white');
    }, BABYLON.PointerEventTypes.POINTERTAP, false);
    scene.onPointerObservable.add( function(pointerInfo, eventState) {
        console.log('%c PointerObservable: pointer double tap', 'background: blue; color: white');
    }, BABYLON.PointerEventTypes.POINTERDOUBLETAP, false);

    var meshes = [sphere, ground];
    for (var i=0; i< meshes.length; i++) {
        let mesh = meshes[i];
        mesh.actionManager = new BABYLON.ActionManager(scene);
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLongPressTrigger, (function(mesh) {
            console.log("%c ActionManager: long press : " + mesh.name, 'background: green; color: white');
        }).bind(this, mesh)));
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, (function(mesh) {
            console.log("%c ActionManager: left pick: " + mesh.name, 'background: green; color: white');
        }).bind(this, mesh)));
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnRightPickTrigger, (function(mesh) {
            console.log("%c ActionManager: right pick: " + mesh.name, 'background: green; color: white');
        }).bind(this, mesh)));
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnCenterPickTrigger, (function(mesh) {
            console.log("%c ActionManager: center pick: " + mesh.name, 'background: green; color: white');
        }).bind(this, mesh)));
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, (function(mesh) {
            console.log("%c ActionManager: pick : " + mesh.name, 'background: green; color: white');
        }).bind(this, mesh)));
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, (function(mesh) {
            console.log("%c ActionManager: pick down : " + mesh.name, 'background: green; color: white');
        }).bind(this, mesh)));
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, (function(mesh) {
            console.log("%c ActionManager: pick up : " + mesh.name, 'background: green; color: white');
        }).bind(this, mesh)));
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnDoublePickTrigger, (function(mesh) {
            console.log("%c ActionManager: double pick : " + mesh.name, 'background: green; color: white');
        }).bind(this, mesh)));
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickOutTrigger, (function(mesh) {
            console.log("%c ActionManager: pick out : " + mesh.name, 'background: green; color: white');
        }).bind(this, mesh)));
    }

    return scene;
};
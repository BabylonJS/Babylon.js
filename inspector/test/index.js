/// <reference path="../../dist/preview release/babylon.d.ts"/>

var Test = (function () {
    function Test(canvasId) {
        var _this = this;
        var canvas = document.getElementById(canvasId);
        this.engine = new BABYLON.Engine(canvas, true);
        BABYLONDEVTOOLS.Loader.debugShortcut(this.engine);
        this.scene = null;
        window.addEventListener("resize", function () {
            _this.engine.resize();
        });
        this._run();
    }
    Test.prototype._run = function () {
        var _this = this;
        this._initScene();
        this.scene.debugLayer.show({
            popup: false,
            parentElement: document.getElementById('inspector'),
            newColors: {
                backgroundColor: '#eee',
                backgroundColorLighter: '#fff',
                backgroundColorLighter2: '#fff',
                backgroundColorLighter3: '#fff',
                color: '#333'
            }
        });
        this.scene.executeWhenReady(function () {
            _this.engine.runRenderLoop(function () {
                _this.scene.render();
            });
        });
    };
    Test.prototype._initScene = function () {
        var scene = new BABYLON.Scene(this.engine);
        var canvas = scene.getEngine().getRenderingCanvas();


        var sceneRoot = new BABYLON.TransformNode("abstractmesh");

        var tn = new BABYLON.TransformNode("transform node");

        // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
        var ground = BABYLON.Mesh.CreateGround("node_damagedHelmet_-6514", 6, 6, 2, scene);
        ground.parent = tn;

        let num = 5;
        let angStep = 6.283185307 / num;
        let rad = 2;
        let p = sceneRoot;
        for (let i = 0; i < num; i++) {
            // Our built-in 'sphere' shape. Params: name, subdivs, size, scene
            let sphere = BABYLON.Mesh.CreateSphere(`sphere${i}`, 16, 2, scene);

            // Move the sphere upward 1/2 its height        
            sphere.position.y = 0.2;
            sphere.position.x = Math.sin(i * angStep) * rad;
            sphere.position.z = Math.cos(i * angStep) * rad;
            sphere.parent = p;
            p = sphere;
        }

        let t = 0;
        scene.registerBeforeRender(() => {
            ground.rotation.y += 0.01;
            ground.position.y = Math.cos(t += 0.01);
        });

        scene.createDefaultCameraOrLight(true);
        scene.activeCamera.attachControl(canvas);

        this.scene = scene;
    };
    return Test;
}());
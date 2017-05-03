/// <reference path="../../dist/preview release/babylon.d.ts"/>
/// <reference path="../../dist/preview release/canvas2D/babylon.canvas2D.d.ts"/>

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
            _this._initGame();
            _this.engine.runRenderLoop(function () {
                _this.scene.render();
            });
        });
    };
    Test.prototype._initScene = function () {
        var scene = new BABYLON.Scene(this.engine);
        var canvas = scene.getEngine().getRenderingCanvas();
        var light = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);

        var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, 1.0, 110, new BABYLON.Vector3(0, -20, 0), scene);
        camera.attachControl(canvas, true);

        var camera1 = new BABYLON.ArcRotateCamera("Camera1", 1.58, 1.2, 110, BABYLON.Vector3.Zero(), scene);
        var camera2 = new BABYLON.ArcRotateCamera("Camera2", Math.PI / 3, .8, 40, BABYLON.Vector3.Zero(), scene);
        var camera3 = new BABYLON.ArcRotateCamera("Camera3", -Math.PI / 5, 1.0, 70, BABYLON.Vector3.Zero(), scene);
        var camera4 = new BABYLON.ArcRotateCamera("Camera4", -Math.PI / 6, 1.3, 110, BABYLON.Vector3.Zero(), scene);

        camera1.layerMask = 2;
        camera2.layerMask = 2;
        camera3.layerMask = 2;
        camera4.layerMask = 2;
        /*
            camera1.parent = camera;
            camera2.parent = camera;
            camera3.parent = camera;
            camera4.parent = camera;
        */

        //Sounds
        var jump = new BABYLON.Sound("Jump", "/assets/sounds/jump.wav", scene);
        var explosion = new BABYLON.Sound("Explosion", "/assets/sounds/explosion.wav", scene);
        jump.setVolume(0.1);
        window.addEventListener("keydown", function (evt) {
            if (evt.keyCode === 32) {
                jump.play();
            }
        });

        var sphere1 = BABYLON.Mesh.CreateSphere("Sphere1", 10.0, 9.0, scene);
        var sphere2 = BABYLON.Mesh.CreateSphere("Sphere2", 2.0, 9.0, scene);//Only two segments
        var sphere3 = BABYLON.Mesh.CreateSphere("Sphere3", 10.0, 9.0, scene);
        var sphere4 = BABYLON.Mesh.CreateSphere("Sphere4", 10.0, 9.0, scene);
        var sphere5 = BABYLON.Mesh.CreateSphere("Sphere5", 10.0, 9.0, scene);
        var sphere6 = BABYLON.Mesh.CreateSphere("Sphere6", 10.0, 9.0, scene);

        sphere1.position.x = 40;
        sphere2.position.x = 25;
        sphere3.position.x = 10;
        sphere4.position.x = -5;
        sphere5.position.x = -20;
        sphere6.position.x = -35;

        var rt1 = new BABYLON.RenderTargetTexture("depth", 1024, scene, true, true);
        scene.customRenderTargets.push(rt1);
        rt1.activeCamera = camera1;
        rt1.renderList = scene.meshes;

        var rt2 = new BABYLON.RenderTargetTexture("depth", 1024, scene, true, true);
        scene.customRenderTargets.push(rt2);
        rt2.activeCamera = camera2;
        rt2.renderList = scene.meshes;

        var rt3 = new BABYLON.RenderTargetTexture("depth", 1024, scene, true, true);
        scene.customRenderTargets.push(rt3);
        rt3.activeCamera = camera3;
        rt3.renderList = scene.meshes;

        var rt4 = new BABYLON.RenderTargetTexture("depth", 1024, scene, true, true);
        scene.customRenderTargets.push(rt4);
        rt4.activeCamera = camera4;
        rt4.renderList = scene.meshes;

        var mon1 = BABYLON.Mesh.CreatePlane("plane", 5, scene);
        mon1.position = new BABYLON.Vector3(-8.8, -7.8, 25)
        // mon1.showBoundingBox = true;
        var mon1mat = new BABYLON.StandardMaterial("texturePlane", scene);
        mon1mat.diffuseTexture = rt1;
        mon1.material = mon1mat;
        mon1.parent = camera;
        mon1.layerMask = 1;

        var mon2 = BABYLON.Mesh.CreatePlane("plane", 5, scene);
        mon2.position = new BABYLON.Vector3(-2.9, -7.8, 25)
        // mon2.showBoundingBox = true;
        var mon2mat = new BABYLON.StandardMaterial("texturePlane", scene);
        mon2mat.diffuseTexture = rt2;
        mon2.material = mon2mat;
        mon2.parent = camera;
        mon2.layerMask = 1;

        var mon3 = BABYLON.Mesh.CreatePlane("plane", 5, scene);
        mon3.position = new BABYLON.Vector3(2.9, -7.8, 25)
        // mon3.showBoundingBox = true;
        var mon3mat = new BABYLON.StandardMaterial("texturePlane", scene);
        mon3mat.diffuseTexture = rt3;
        mon3.material = mon3mat;
        mon3.parent = camera;
        mon3.layerMask = 1;


        var mon4 = BABYLON.Mesh.CreatePlane("plane", 5, scene);
        mon4.position = new BABYLON.Vector3(8.8, -7.8, 25)
        // mon4.showBoundingBox = true;
        var mon4mat = new BABYLON.StandardMaterial("texturePlane", scene);
        mon4mat.diffuseTexture = rt4;
        mon4.material = mon4mat;
        mon4.parent = camera;
        mon4.layerMask = 1;


        var butback = BABYLON.MeshBuilder.CreatePlane("plane", { width: 25, height: 6 }, scene);
        butback.position = new BABYLON.Vector3(0, -8.2, 26)
        // butback.showBoundingBox = true;
        var butbackmat = new BABYLON.StandardMaterial("texturePlane", scene);
        butbackmat.diffuseColor = BABYLON.Color3.Black();
        butback.material = butbackmat;
        butback.parent = camera;
        butback.layerMask = 1;

        var plane = BABYLON.Mesh.CreatePlane("plane", 120, scene);
        plane.position.y = -5;
        plane.rotation.x = Math.PI / 2;

        var materialSphere1 = new BABYLON.StandardMaterial("texture1", scene);
        materialSphere1.wireframe = true;

        //Creation of a red material with alpha
        var materialSphere2 = new BABYLON.StandardMaterial("texture2", scene);
        materialSphere2.diffuseColor = new BABYLON.Color3(1, 0, 0); //Red
        materialSphere2.alpha = 0.3;

        //Creation of a material with an image texture
        var materialSphere3 = new BABYLON.StandardMaterial("texture3", scene);
        materialSphere3.diffuseTexture = new BABYLON.Texture("/assets/textures/amiga.jpg", scene);

        //Creation of a material with translated texture
        var materialSphere4 = new BABYLON.StandardMaterial("texture4", scene);
        materialSphere4.diffuseTexture = new BABYLON.Texture("/assets/textures/floor.png", scene);
        materialSphere4.diffuseTexture.vOffset = 0.1;//Vertical offset of 10%
        materialSphere4.diffuseTexture.uOffset = 0.4;//Horizontal offset of 40%

        //Creation of a material with an alpha texture
        var materialSphere5 = new BABYLON.StandardMaterial("texture5", scene);
        materialSphere5.diffuseTexture = new BABYLON.Texture("/assets/textures/rock.png", scene);
        materialSphere5.diffuseTexture.hasAlpha = true;//Has an alpha

        //Creation of a material and show all the faces
        var materialSphere6 = new BABYLON.StandardMaterial("texture6", scene);
        materialSphere6.diffuseTexture = new BABYLON.Texture("/assets/textures/grass.png", scene);
        materialSphere6.diffuseTexture.hasAlpha = true;//Have an alpha
        materialSphere6.backFaceCulling = false;//Show all the faces of the element

        //Creation of a repeated textured material
        var materialPlane = new BABYLON.StandardMaterial("texturePlane", scene);
        materialPlane.diffuseTexture = new BABYLON.Texture("/assets/textures/mixMap.png", scene);
        materialPlane.diffuseTexture.uScale = 5.0;
        materialPlane.diffuseTexture.vScale = 5.0;
        materialPlane.backFaceCulling = false;

        //Apply the materials to meshes
        sphere1.material = materialSphere1;
        sphere2.material = materialSphere2;

        sphere3.material = materialSphere3;
        sphere4.material = materialSphere4;

        sphere5.material = materialSphere5;
        sphere6.material = materialSphere6;

        plane.material = materialPlane;

        new BABYLON.Mesh('mesh_without_geometry', scene);



        var d = 50;
        var cubes = new Array();
        for (var i = 0; i < 360; i += 20) {
            var r = BABYLON.Tools.ToRadians(i);
            var b = BABYLON.Mesh.CreateBox("Box #" + i / 20, 5, scene, false);
            b.position.x = Math.cos(r) * d;
            b.position.z = Math.sin(r) * d;
            cubes.push(b);
        }
        var canvas = new BABYLON.ScreenSpaceCanvas2D(scene, {
            id: "ScreenCanvas",
            cachingStrategy: BABYLON.Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS

        });
        i = 0;
        for (var _i = 0, cubes_1 = cubes; _i < cubes_1.length; _i++) {
            var cube = cubes_1[_i];
            new BABYLON.Group2D({
                parent: canvas, id: "GroupTag #" + i, width: 80, height: 40, trackNode: cube, origin: BABYLON.Vector2.Zero(),
                children: [
                    new BABYLON.Rectangle2D({
                        id: "firstRect", width: 80, height: 26, x: 0, y: 0, origin: BABYLON.Vector2.Zero(), border: "#FFFFFFFF", fill: "#808080FF", children: [
                            new BABYLON.Text2D(cube.name, { marginAlignment: "h: center, v:center", fontName: "bold 12px Arial" })
                        ]
                    })
                ]
            });
            ++i;
        }


        this.scene = scene;
    };
    Test.prototype._initGame = function () {
        this._createCanvas();
    };
    /**
     * Create the canvas2D
     */
    Test.prototype._createCanvas = function () {
        // object hierarchy  g1 -> g2 -> rect

        // when cachingStrategy is 1 or 2 - everything is rendered
        // when it is 3 - only direct children of g1 are rendered
        var canvas = new BABYLON.ScreenSpaceCanvas2D(this.scene,
            {
                id: "ScreenCanvas",
                cachingStrategy: BABYLON.Canvas2D.CACHESTRATEGY_DONTCACHE
            });           // 1
        // cachingStrategy: BABYLON.Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS });      // 2 
        // cachingStrategy: BABYLON.Canvas2D.CACHESTRATEGY_ALLGROUPS });           // 3

        canvas.createCanvasProfileInfoCanvas();

        // parent group            
        var g1 = new BABYLON.Group2D({
            parent: canvas, id: "G1",
            x: 50, y: 50, size: new BABYLON.Size(60, 60)
        });

        // just to see it    
        let frame1 = new BABYLON.Rectangle2D({
            parent: g1,
            x: 0, y: 0, size: g1.size, border: "#FF0000FF"
        });

        // child group
        let g2 = new BABYLON.Group2D({
            parent: g1, id: "G2",
            x: 10, y: 10, size: new BABYLON.Size(40, 40)
        });

        // just to see it
        let frame2 = new BABYLON.Rectangle2D({ parent: g2, x: 0, y: 0, size: g2.size, border: "#0000FFFF" });

        let rect = new BABYLON.Rectangle2D({
            parent: g2, x: 10, y: 10, size: new BABYLON.Size(20, 20),
            fill: "#00FF00FF"
        });

        return canvas;
    };
    return Test;
}());
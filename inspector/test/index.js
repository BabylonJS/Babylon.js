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

        // Skybox
        var skybox = BABYLON.Mesh.CreateBox("skyBox", 500.0, scene);
        var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("/assets/textures/skybox/TropicalSunnyDay", scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.disableLighting = true;
        skybox.material = skyboxMaterial;

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

        scene.getMeshByName("Box #6").scaling.x = 2;

        //Other meshes, to contrôl mesh hierarchy
        var box1 = BABYLON.MeshBuilder.CreateBox("box1", {size: 1}, scene);

        var box2 = BABYLON.MeshBuilder.CreateBox("box2", {size: 1}, scene);
        box2.position.x = 1.5;
        box2.parent = box1;

        var box3 = BABYLON.MeshBuilder.CreateBox("box3", {size: 1}, scene);
        box3.position.x = 1.5;
        box3.parent = box2;

        var box4 = BABYLON.MeshBuilder.CreateBox("box4", {size: 1}, scene);
        box4.position.x = 1.5;
        box4.parent = box3;

        window.addEventListener("keydown", function (evt) {
            sphere1.dispose();
            var sphere7 = BABYLON.Mesh.CreateSphere("Sphere7", 10.0, 9.0, scene);
            sphere7.position.x = 40;
        });

        var sphere_1 = BABYLON.Mesh.CreateSphere("_sphere_1", 16, 2, scene);

        var assets_mesh = new BABYLON.AbstractMesh("assets_mesh", scene);
        var sphere_2 = BABYLON.Mesh.CreateSphere("_sphere_2", 3, 2, scene);
        var sphere_3 = BABYLON.Mesh.CreateSphere("_sphere_3", 2, 2, scene);
        var scene_mesh = new BABYLON.AbstractMesh;
        scene_mesh.name="scene_mesh";
    
        sphere_1.parent = assets_mesh;
        sphere_2.parent = assets_mesh;
        sphere_3.parent = assets_mesh;

        for (var i=0; i<10 ; i++){
            var inst = sphere_1.createInstance("C_" + i + "clone");
            inst.isVisible = true;
            inst.setEnabled = true;
            inst.parent = scene_mesh;
            inst.position.x = i*2;
            inst.refreshBoundingInfo();
            inst.computeWorldMatrix();
        }

        // to test reflection prob texture handling
        var probe = new BABYLON.ReflectionProbe("probe", 512, scene);
        probe.renderList.push(sphere1);

        // gui
        var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        var picker = new BABYLON.GUI.ColorPicker();
        picker.height = "150px";
        picker.width = "150px";
        picker.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

        var checkbox = new BABYLON.GUI.Checkbox();
        checkbox.width = "20px";
        checkbox.height = "20px";

        var slider = new BABYLON.GUI.Slider();
        slider.minimum = 0;
        slider.maximum = 2 * Math.PI;
        slider.value = 0;
        slider.height = "20px";
        slider.width = "200px";

        var line = new BABYLON.GUI.Line();
        line.x1 = 10;
        line.y1 = 10;
        line.x2 = 1000;
        line.y2 = 500;

        var panel = new BABYLON.GUI.StackPanel();    

        var button = BABYLON.GUI.Button.CreateSimpleButton("but", "Click Me");
        button.width = 0.2;
        button.height = "40px";
        button.color = "white";
        button.background = "green";
        panel.addControl(button);     

        var button2 = BABYLON.GUI.Button.CreateSimpleButton("but2", "Click Me also!");
        button2.width = 0.2;
        button2.height = "40px";
        button2.color = "white";
        button2.background = "green";
        panel.addControl(button2);     

        var ellipse1 = new BABYLON.GUI.Ellipse();
        ellipse1.width = "100px"
        ellipse1.height = "100px";
        ellipse1.color = "Orange";
        ellipse1.thickness = 4;
        ellipse1.background = "green";


        advancedTexture.addControl(ellipse1);    
        advancedTexture.addControl(panel);   
        advancedTexture.addControl(picker);    
        advancedTexture.addControl(checkbox);    
        advancedTexture.addControl(slider);    
        advancedTexture.addControl(line);    
        advancedTexture.addControl(checkbox);  
        
        this.scene = scene;
    };
    return Test;
}());
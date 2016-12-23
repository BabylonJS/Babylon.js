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
        this.scene.debugLayer.show();
        this.scene.executeWhenReady(function () {
            _this._initGame();
            _this.engine.runRenderLoop(function () {
                _this.scene.render();
            });
        });
    };
    Test.prototype._initScene = function () {
        var scene = new BABYLON.Scene(this.engine);
        var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 4, Math.PI / 2.5, 200, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(this.engine.getRenderingCanvas(), true);
        camera.minZ = 0.1;
        // Lights
        var light0 = new BABYLON.PointLight("Omni0", new BABYLON.Vector3(0, 10, 0), scene);
        var light1 = new BABYLON.PointLight("Omni1", new BABYLON.Vector3(0, -10, 0), scene);
        var light2 = new BABYLON.PointLight("Omni2", new BABYLON.Vector3(10, 0, 0), scene);
        var light3 = new BABYLON.DirectionalLight("Dir0", new BABYLON.Vector3(1, -1, 0), scene);
        var material = new BABYLON.StandardMaterial("kosh", scene);
        var sphere = BABYLON.Mesh.CreateSphere("Sphere", 16, 3, scene);
        // Creating light sphere
        var lightSphere0 = BABYLON.Mesh.CreateSphere("Sphere0", 16, 0.5, scene);
        var lightSphere1 = BABYLON.Mesh.CreateSphere("Sphere1", 16, 0.5, scene);
        var lightSphere2 = BABYLON.Mesh.CreateSphere("Sphere2", 16, 0.5, scene);
        lightSphere0.material = new BABYLON.StandardMaterial("red", scene);
        lightSphere0.material.diffuseColor = new BABYLON.Color3(0, 0, 0);
        lightSphere0.material.specularColor = new BABYLON.Color3(0, 0, 0);
        lightSphere0.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
        lightSphere1.material = new BABYLON.StandardMaterial("green", scene);
        lightSphere1.material.diffuseColor = new BABYLON.Color3(0, 0, 0);
        lightSphere1.material.specularColor = new BABYLON.Color3(0, 0, 0);
        lightSphere1.material.emissiveColor = new BABYLON.Color3(0, 1, 0);
        lightSphere2.material = new BABYLON.StandardMaterial("blue", scene);
        lightSphere2.material.diffuseColor = new BABYLON.Color3(0, 0, 0);
        lightSphere2.material.specularColor = new BABYLON.Color3(0, 0, 0);
        lightSphere2.material.emissiveColor = new BABYLON.Color3(0, 0, 1);
        // Sphere material
        material.diffuseColor = new BABYLON.Color3(1, 1, 1);
        sphere.material = material;
        // Lights colors
        light0.diffuse = new BABYLON.Color3(1, 0, 0);
        light0.specular = new BABYLON.Color3(1, 0, 0);
        light1.diffuse = new BABYLON.Color3(0, 1, 0);
        light1.specular = new BABYLON.Color3(0, 1, 0);
        light2.diffuse = new BABYLON.Color3(0, 0, 1);
        light2.specular = new BABYLON.Color3(0, 0, 1);
        light3.diffuse = new BABYLON.Color3(1, 1, 1);
        light3.specular = new BABYLON.Color3(1, 1, 1);
        BABYLON.Effect.ShadersStore["customVertexShader"] = 'precision highp float;attribute vec3 position;attribute vec2 uv;uniform mat4 worldViewProjection;varying vec2 vUV;varying vec3 vPos;void main(){gl_Position=worldViewProjection*vec4(position,1.),vPos=gl_Position.xyz;if(position.x >2.0) {gl_Position.x = 2.0;} else { gl_Position.y = 1.0;}}';
        BABYLON.Effect.ShadersStore["customFragmentShader"] = 'precision highp float;varying vec3 vPos;uniform vec3 color;void main(){gl_FragColor=vec4(mix(color,vPos,.05),1.);}';
        var shaderMaterial = new BABYLON.ShaderMaterial("shader", scene, {
            vertex: "custom",
            fragment: "custom",
        }, {
            attributes: ["position", "normal", "uv"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]
        });
        sphere.material = shaderMaterial;
        // Animations
        var alpha = 0;
        scene.beforeRender = function () {
            light0.position = new BABYLON.Vector3(10 * Math.sin(alpha), 0, 10 * Math.cos(alpha));
            light1.position = new BABYLON.Vector3(10 * Math.sin(alpha), 0, -10 * Math.cos(alpha));
            light2.position = new BABYLON.Vector3(10 * Math.cos(alpha), 0, 10 * Math.sin(alpha));
            lightSphere0.position = light0.position;
            lightSphere1.position = light1.position;
            lightSphere2.position = light2.position;
            alpha += 0.01;
        };
        this.scene = scene;
    };
    Test.prototype._initGame = function () {
        this._createCanvas();
        BABYLON.SceneLoader.ImportMesh('', 'test/', 'Rabbit.babylon', this.scene);
    };
    /**
     * Create the canvas2D
     */
    Test.prototype._createCanvas = function () {
        var canvas = new BABYLON.ScreenSpaceCanvas2D(this.scene, {
            id: "Hello world SC",
            size: new BABYLON.Size(300, 100),
            backgroundFill: "#4040408F",
            backgroundRoundRadius: 50,
            children: [
                new BABYLON.Text2D("Hello World!", {
                    id: "text",
                    marginAlignment: "h: center, v:center",
                    fontName: "20pt Arial",
                })
            ]
        });
        var infoCanvas = new BABYLON.ScreenSpaceCanvas2D(this.scene, { id: "PINK CUBE SC", size: new BABYLON.Size(500, 500) });
        var text2 = new BABYLON.Text2D("UnbindTime", { parent: infoCanvas, id: "Text", marginAlignment: "h: left, v: bottom", fontName: "10pt Arial" });
        canvas = new BABYLON.WorldSpaceCanvas2D(this.scene, new BABYLON.Size(150, 150), {
            id: "WorldSpaceCanvas",
            worldPosition: new BABYLON.Vector3(0, 0, 0),
            worldRotation: BABYLON.Quaternion.RotationYawPitchRoll(Math.PI / 4, Math.PI / 4, 0),
            enableInteraction: true,
            backgroundFill: "#C0C0C040",
            backgroundRoundRadius: 20,
            children: [
                new BABYLON.Text2D("World Space Canvas", { fontName: "8pt Arial", marginAlignment: "h: center, v: bottom", fontSuperSample: true })
            ]
        });
        var rect = new BABYLON.Rectangle2D({ parent: canvas, x: 45, y: 45, width: 30, height: 30, fill: null, border: BABYLON.Canvas2D.GetGradientColorBrush(new BABYLON.Color4(0.9, 0.3, 0.9, 1), new BABYLON.Color4(1.0, 1.0, 1.0, 1)), borderThickness: 2 });
        var buttonRect = new BABYLON.Rectangle2D({ parent: canvas, id: "button", x: 12, y: 12, width: 50, height: 15, fill: "#40C040FF", roundRadius: 2, children: [new BABYLON.Text2D("Click Me!", { fontName: "8pt Arial", marginAlignment: "h: center, v: center", fontSuperSample: true })] });
        var button2Rect = new BABYLON.Rectangle2D({ parent: canvas, id: "button2", x: 70, y: 12, width: 40, height: 15, fill: "#4040C0FF", roundRadius: 2, isVisible: false, children: [new BABYLON.Text2D("Great!", { fontName: "8pt Arial", marginAlignment: "h: center, v: center", fontSuperSample: true })] });
        ;
        buttonRect.pointerEventObservable.add(function (d, s) {
            button2Rect.levelVisible = !button2Rect.levelVisible;
        }, BABYLON.PrimitivePointerInfo.PointerUp);
        var insideRect = new BABYLON.Rectangle2D({ parent: rect, width: 10, height: 10, marginAlignment: "h: center, v: center", fill: "#0040F0FF" });
        insideRect.roundRadius = 2;
    };
    return Test;
}());
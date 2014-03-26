var CreateCellShadingScene = function (engine) {
    
    var CellShadingMaterial = function (name, scene, light) {
        this.name = name;
        this.id = name;
        this.light = light;

        this._scene = scene;
        scene.materials.push(this);

        this.texture = null;

        this.toonThresholds = [0.95, 0.5, 0.2, 0.03];
        this.toonBrightnessLevels = [1.0, 0.8, 0.6, 0.35, 0.01];
    };

    CellShadingMaterial.prototype = Object.create(BABYLON.Material.prototype);

    // Properties   
    CellShadingMaterial.prototype.needAlphaBlending = function () {
        return false;
    };

    CellShadingMaterial.prototype.needAlphaTesting = function () {
        return false;
    };

    // Methods   
    CellShadingMaterial.prototype.isReady = function (mesh) {
        var engine = this._scene.getEngine();

        if (this.texture && !this.texture.isReady) {
            return false;
        }

        this._effect = engine.createEffect("./Scenes/Customs/shaders/cellShading",
            ["position", "normal", "uv"],
            ["worldViewProjection", "world", "view", "vLightPosition", "vLightColor", "ToonBrightnessLevels", "ToonThresholds"],
            ["textureSampler"],
            "");

        if (!this._effect.isReady()) {
            return false;
        }

        return true;
    };

    CellShadingMaterial.prototype.bind = function (world, mesh) {
        this._effect.setMatrix("world", world);
        this._effect.setMatrix("worldViewProjection", world.multiply(this._scene.getTransformMatrix()));
        this._effect.setVector3("vLightPosition", this.light.position);
        this._effect.setColor3("vLightColor", this.light.diffuse);

        this._effect.setArray("ToonThresholds", this.toonThresholds);
        this._effect.setArray("ToonBrightnessLevels", this.toonBrightnessLevels);

        // Textures        
        this._effect.setTexture("textureSampler", this.texture);
    };

    CellShadingMaterial.prototype.dispose = function () {
        if (this.texture) {
            this.texture.dispose();
        }
        this.baseDispose();
    };

    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0, Math.PI / 4, 40, BABYLON.Vector3.Zero(), scene);
    var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(20, 100, 2), scene);
    var sphere = BABYLON.Mesh.CreateSphere("Sphere0", 32, 3, scene);
    var cylinder = BABYLON.Mesh.CreateCylinder("Sphere1", 5, 3, 2, 32, scene);
    var torus = BABYLON.Mesh.CreateTorus("Sphere2", 3, 1, 32, scene);

    var cellShadingMaterial = new CellShadingMaterial("mat0", scene, light);
    cellShadingMaterial.texture = new BABYLON.Texture("Scenes/Customs/Ground.jpg", scene);
    
    sphere.material = cellShadingMaterial;
    sphere.position = new BABYLON.Vector3(-10, 0, 0);
    cylinder.material = cellShadingMaterial;
    torus.material = cellShadingMaterial;
    torus.position = new BABYLON.Vector3(10, 0, 0);
    
    // Animations
    var alpha = 0;
    scene.registerBeforeRender(function () {
        sphere.rotation.y = alpha;
        sphere.rotation.x = alpha;
        cylinder.rotation.y = alpha;
        cylinder.rotation.x = alpha;
        torus.rotation.y = alpha;
        torus.rotation.x = alpha;

        alpha += 0.05;
    });
    
    return scene;
};
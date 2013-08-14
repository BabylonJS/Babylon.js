var WORLDMONGER = WORLDMONGER || {};

(function () {
    WORLDMONGER.GroundMaterial = function (name, scene, light) {
        this.name = name;
        this.id = name;
        this.light = light;

        this._scene = scene;
        scene.materials.push(this);
        
        this.groundTexture = new BABYLON.Texture("Shaders/Ground/ground.jpg", scene);
        this.groundTexture.uScale = 6.0;
        this.groundTexture.vScale = 6.0;
        
        this.grassTexture = new BABYLON.Texture("Shaders/Ground/grass.jpg", scene);
        this.grassTexture.uScale = 6.0;
        this.grassTexture.vScale = 6.0;

        this.snowTexture = new BABYLON.Texture("Shaders/Ground/snow.jpg", scene);
        this.snowTexture.uScale = 20.0;
        this.snowTexture.vScale = 20.0;
        
        this.sandTexture = new BABYLON.Texture("Shaders/Ground/sand.jpg", scene);
        this.sandTexture.uScale = 4.0;
        this.sandTexture.vScale = 4.0;
        
        this.rockTexture = new BABYLON.Texture("Shaders/Ground/rock.jpg", scene);
        this.rockTexture.uScale = 15.0;
        this.rockTexture.vScale = 15.0;
        
        this.blendTexture = new BABYLON.Texture("Shaders/Ground/blend.png", scene);
        this.blendTexture.uOffset = Math.random();
        this.blendTexture.vOffset = Math.random();
        this.blendTexture.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
        this.blendTexture.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;


        this.sandLimit = 1;
        this.rockLimit = 5;
        this.snowLimit = 8;
    };

    WORLDMONGER.GroundMaterial.prototype = Object.create(BABYLON.Material.prototype);

    // Properties   
    WORLDMONGER.GroundMaterial.prototype.needAlphaBlending = function () {
        return false;
    };

    WORLDMONGER.GroundMaterial.prototype.needAlphaTesting = function () {
        return false;
    };

    // Methods   
    WORLDMONGER.GroundMaterial.prototype.isReady = function (mesh) {
        var engine = this._scene.getEngine();

        if (!this.groundTexture.isReady)
            return false;
        if (!this.snowTexture.isReady)
            return false;
        if (!this.sandTexture.isReady)
            return false;
        if (!this.rockTexture.isReady)
            return false;
        if (!this.grassTexture.isReady)
            return false;

        var defines = [];
        if (BABYLON.clipPlane) {
            defines.push("#define CLIPPLANE");
        }

        var join = defines.join("\n");
        if (this._cachedDefines != join) {
            this._cachedDefines = join;

            this._effect = engine.createEffect("./Shaders/Ground/ground",
                ["position", "normal", "uv"],
                ["worldViewProjection", "groundMatrix", "sandMatrix", "rockMatrix", "snowMatrix", "grassMatrix", "blendMatrix", "world", "vLightPosition", "vEyePosition", "vLimits", "vClipPlane"],
                ["groundSampler", "sandSampler", "rockSampler", "snowSampler", "grassSampler", "blendSampler"],
                join);
        }

        if (!this._effect.isReady()) {
            return false;
        }

        return true;
    };

    WORLDMONGER.GroundMaterial.prototype.bind = function (world, mesh) {
        this._effect.setMatrix("world", world);
        this._effect.setMatrix("worldViewProjection", world.multiply(this._scene.getTransformMatrix()));        
        this._effect.setVector3("vEyePosition", this._scene.activeCamera.position);
        this._effect.setVector3("vLightPosition", this.light.position);

        // Textures
        if (this.groundTexture) {
            this._effect.setTexture("groundSampler", this.groundTexture);
            this._effect.setMatrix("groundMatrix", this.groundTexture._computeTextureMatrix());
        }
        
        if (this.sandTexture) {
            this._effect.setTexture("sandSampler", this.sandTexture);
            this._effect.setMatrix("sandMatrix", this.sandTexture._computeTextureMatrix());
        }
        
        if (this.rockTexture) {
            this._effect.setTexture("rockSampler", this.rockTexture);
            this._effect.setMatrix("rockMatrix", this.rockTexture._computeTextureMatrix());
        }
        
        if (this.snowTexture) {
            this._effect.setTexture("snowSampler", this.snowTexture);
            this._effect.setMatrix("snowMatrix", this.snowTexture._computeTextureMatrix());
        }
        
        if (this.grassTexture) {
            this._effect.setTexture("grassSampler", this.grassTexture);
            this._effect.setMatrix("grassMatrix", this.grassTexture._computeTextureMatrix());
        }
        
        if (this.blendTexture) {
            this._effect.setTexture("blendSampler", this.blendTexture);
            this._effect.setMatrix("blendMatrix", this.blendTexture._computeTextureMatrix());
        }
        
        this._effect.setFloat3("vLimits", this.sandLimit, this.rockLimit, this.snowLimit);
        
        if (BABYLON.clipPlane) {
            this._effect.setFloat4("vClipPlane", BABYLON.clipPlane.normal.x, BABYLON.clipPlane.normal.y, BABYLON.clipPlane.normal.z, BABYLON.clipPlane.d);
        }
    };
    
    WORLDMONGER.GroundMaterial.prototype.dispose = function () {
        if (this.grassTexture) {
            this.grassTexture.dispose();
        }
        
        if (this.groundTexture) {
            this.groundTexture.dispose();
        }

        if (this.snowTexture) {
            this.snowTexture.dispose();
        }

        if (this.sandTexture) {
            this.sandTexture.dispose();
        }

        if (this.rockTexture) {
            this.rockTexture.dispose();
        }

        this.baseDispose();
    };
})();
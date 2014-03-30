"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.ShaderMaterial = function (name, scene, shaderPath, options) {
        this.name = name;
        this.id = name;
        this._shaderPath = shaderPath;

        options.needAlphaBlending = options.needAlphaBlending || false;
        options.needAlphaTesting = options.needAlphaTesting || false;
        options.attributes = options.attributes || ["position", "normal", "uv"];
        options.uniforms = options.uniforms || ["worldViewProjection"];
        options.samplers = options.samplers || [];
        
        this._options = options;
        this._scene = scene;
        scene.materials.push(this);

        this._textures = [];
        this._floats = [];
        this._floatsArrays = [];
        this._colors3 = [];
        this._colors4 = [];
        this._vectors2 = [];
        this._vectors3 = [];
        this._vectors4 = [];
        this._matrices = [];
    };

    BABYLON.ShaderMaterial.prototype = Object.create(BABYLON.Material.prototype);

    // Properties   
    BABYLON.ShaderMaterial.prototype.needAlphaBlending = function () {
        return this._options.needAlphaBlending;
    };

    BABYLON.ShaderMaterial.prototype.needAlphaTesting = function () {
        return this._options.needAlphaTesting;
    };

    // Methods   
    BABYLON.ShaderMaterial.prototype._checkUniform = function (uniformName) {
        if (this._options.uniforms.indexOf(uniformName) === -1) {
            this._options.uniforms.push(uniformName);
        }
    };

    BABYLON.ShaderMaterial.prototype.setTexture = function (name, texture) {
        this._checkUniform(name);
        this._textures[name] = texture;

        return this;
    };

    BABYLON.ShaderMaterial.prototype.setFloat = function (name, value) {
        this._checkUniform(name);
        this._floats[name] = value;

        return this;
    };

    BABYLON.ShaderMaterial.prototype.setFloats = function (name, value) {
        this._checkUniform(name);
        this._floatsArrays[name] = value;

        return this;
    };

    BABYLON.ShaderMaterial.prototype.setColor3 = function (name, value) {
        this._checkUniform(name);
        this._colors3[name] = value;

        return this;
    };

    BABYLON.ShaderMaterial.prototype.setColor4 = function (name, value) {
        this._checkUniform(name);
        this._colors4[name] = value;

        return this;
    };

    BABYLON.ShaderMaterial.prototype.setVector2 = function (name, value) {
        this._checkUniform(name);
        this._vectors2[name] = value;

        return this;
    };

    BABYLON.ShaderMaterial.prototype.setVector3 = function (name, value) {
        this._checkUniform(name);
        this._vectors3[name] = value;

        return this;
    };

    BABYLON.ShaderMaterial.prototype.setVector4 = function (name, value) {
        this._checkUniform(name);
        this._vectors4[name] = value;

        return this;
    };

    BABYLON.ShaderMaterial.prototype.setMatrix = function (name, value) {
        this._checkUniform(name);
        this._matrices[name] = value;

        return this;
    };

    BABYLON.ShaderMaterial.prototype.isReady = function (mesh) {
        var engine = this._scene.getEngine();

        this._effect = engine.createEffect(this._shaderPath,
            this._options.attributes,
            this._options.uniforms,
            this._options.samplers,
            "");

        if (!this._effect.isReady()) {
            return false;
        }

        return true;
    };

    BABYLON.ShaderMaterial.prototype.bind = function (world, mesh) {
        // Std values
        if (this._options.uniforms.indexOf("world") !== -1) {
            this._effect.setMatrix("world", world);
        }

        if (this._options.uniforms.indexOf("view") !== -1) {
            this._effect.setMatrix("view", this._scene.getViewMatrix());
        }

        if (this._options.uniforms.indexOf("projection") !== -1) {
            this._effect.setMatrix("projection", this._scene.getProjectionMatrix());
        }

        if (this._options.uniforms.indexOf("worldViewProjection") !== -1) {
            this._effect.setMatrix("worldViewProjection", world.multiply(this._scene.getTransformMatrix()));
        }        

        // Texture
        for (var name in this._textures) {
            this._effect.setTexture(name, this._textures[name]);
        }

        // Float    
        for (name in this._floats) {            
            this._effect.setFloat(name, this._floats[name]);
        }

        // Float s   
        for (name in this._floatsArrays) {
            this._effect.setArray(name, this._floatsArrays[name]);
        }

        // Color3        
        for (name in this._colors3) {
            this._effect.setColor3(name, this._colors3[name]);
        }

        // Color4      
        for (name in this._colors4) {
            this._effect.setColor4(name, this._colors4[name]);
        }

        // Vector2        
        for (name in this._vectors2) {
            this._effect.setVector2(name, this._vectors2[name]);
        }

        // Vector3        
        for (name in this._vectors3) {
            this._effect.setVector3(name, this._vectors3[name]);
        }

        // Vector4      
        for (name in this._vectors4) {
            this._effect.setVector4(name, this._vectors4[name]);
        }

        // Matrix      
        for (name in this._matrices) {
            this._effect.setMatrix(name, this._matrices[name]);
        }
    };

    BABYLON.ShaderMaterial.prototype.dispose = function () {
        for (var name in this._textures) {
            this._textures[name].dispose();
        }

        this._textures = [];
        
        this.baseDispose();
    };
})();
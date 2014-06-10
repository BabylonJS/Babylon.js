var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var ShaderMaterial = (function (_super) {
        __extends(ShaderMaterial, _super);
        function ShaderMaterial(name, scene, shaderPath, options) {
            _super.call(this, name, scene);
            this._textures = new Array();
            this._floats = new Array();
            this._floatsArrays = {};
            this._colors3 = new Array();
            this._colors4 = new Array();
            this._vectors2 = new Array();
            this._vectors3 = new Array();
            this._matrices = new Array();
            this._cachedWorldViewMatrix = new BABYLON.Matrix();
            this._shaderPath = shaderPath;

            options.needAlphaBlending = options.needAlphaBlending || false;
            options.needAlphaTesting = options.needAlphaTesting || false;
            options.attributes = options.attributes || ["position", "normal", "uv"];
            options.uniforms = options.uniforms || ["worldViewProjection"];
            options.samplers = options.samplers || [];

            this._options = options;
        }
        ShaderMaterial.prototype.needAlphaBlending = function () {
            return this._options.needAlphaBlending;
        };

        ShaderMaterial.prototype.needAlphaTesting = function () {
            return this._options.needAlphaTesting;
        };

        ShaderMaterial.prototype._checkUniform = function (uniformName) {
            if (this._options.uniforms.indexOf(uniformName) === -1) {
                this._options.uniforms.push(uniformName);
            }
        };

        ShaderMaterial.prototype.setTexture = function (name, texture) {
            if (this._options.samplers.indexOf(name) === -1) {
                this._options.samplers.push(name);
            }
            this._textures[name] = texture;

            return this;
        };

        ShaderMaterial.prototype.setFloat = function (name, value) {
            this._checkUniform(name);
            this._floats[name] = value;

            return this;
        };

        ShaderMaterial.prototype.setFloats = function (name, value) {
            this._checkUniform(name);
            this._floatsArrays[name] = value;

            return this;
        };

        ShaderMaterial.prototype.setColor3 = function (name, value) {
            this._checkUniform(name);
            this._colors3[name] = value;

            return this;
        };

        ShaderMaterial.prototype.setColor4 = function (name, value) {
            this._checkUniform(name);
            this._colors4[name] = value;

            return this;
        };

        ShaderMaterial.prototype.setVector2 = function (name, value) {
            this._checkUniform(name);
            this._vectors2[name] = value;

            return this;
        };

        ShaderMaterial.prototype.setVector3 = function (name, value) {
            this._checkUniform(name);
            this._vectors3[name] = value;

            return this;
        };

        ShaderMaterial.prototype.setMatrix = function (name, value) {
            this._checkUniform(name);
            this._matrices[name] = value;

            return this;
        };

        ShaderMaterial.prototype.isReady = function () {
            var engine = this.getScene().getEngine();

            this._effect = engine.createEffect(this._shaderPath, this._options.attributes, this._options.uniforms, this._options.samplers, "", null, this.onCompiled, this.onError);

            if (!this._effect.isReady()) {
                return false;
            }

            return true;
        };

        ShaderMaterial.prototype.bind = function (world) {
            // Std values
            if (this._options.uniforms.indexOf("world") !== -1) {
                this._effect.setMatrix("world", world);
            }

            if (this._options.uniforms.indexOf("view") !== -1) {
                this._effect.setMatrix("view", this.getScene().getViewMatrix());
            }

            if (this._options.uniforms.indexOf("worldView") !== -1) {
                world.multiplyToRef(this.getScene().getViewMatrix(), this._cachedWorldViewMatrix);
                this._effect.setMatrix("worldView", this._cachedWorldViewMatrix);
            }

            if (this._options.uniforms.indexOf("projection") !== -1) {
                this._effect.setMatrix("projection", this.getScene().getProjectionMatrix());
            }

            if (this._options.uniforms.indexOf("worldViewProjection") !== -1) {
                this._effect.setMatrix("worldViewProjection", world.multiply(this.getScene().getTransformMatrix()));
            }

            for (var name in this._textures) {
                this._effect.setTexture(name, this._textures[name]);
            }

            for (name in this._floats) {
                this._effect.setFloat(name, this._floats[name]);
            }

            for (name in this._floatsArrays) {
                this._effect.setArray(name, this._floatsArrays[name]);
            }

            for (name in this._colors3) {
                this._effect.setColor3(name, this._colors3[name]);
            }

            for (name in this._colors4) {
                var color = this._colors4[name];
                this._effect.setFloat4(name, color.r, color.g, color.b, color.a);
            }

            for (name in this._vectors2) {
                this._effect.setVector2(name, this._vectors2[name]);
            }

            for (name in this._vectors3) {
                this._effect.setVector3(name, this._vectors3[name]);
            }

            for (name in this._matrices) {
                this._effect.setMatrix(name, this._matrices[name]);
            }
        };

        ShaderMaterial.prototype.dispose = function (forceDisposeEffect) {
            for (var name in this._textures) {
                this._textures[name].dispose();
            }

            this._textures = [];

            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        return ShaderMaterial;
    })(BABYLON.Material);
    BABYLON.ShaderMaterial = ShaderMaterial;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.shaderMaterial.js.map

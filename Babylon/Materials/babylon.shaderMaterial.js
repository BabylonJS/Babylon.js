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
        ShaderMaterial.prototype.isReady = function (mesh, useInstances) {
            var scene = this.getScene();
            var engine = scene.getEngine();
            if (!this.checkReadyOnEveryCall) {
                if (this._renderId === scene.getRenderId()) {
                    return true;
                }
            }
            // Instances
            var defines = [];
            var fallbacks = new BABYLON.EffectFallbacks();
            if (useInstances) {
                defines.push("#define INSTANCES");
            }
            // Bones
            if (mesh && mesh.useBones) {
                defines.push("#define BONES");
                defines.push("#define BonesPerMesh " + (mesh.skeleton.bones.length + 1));
                defines.push("#define BONES4");
                fallbacks.addFallback(0, "BONES4");
            }
            // Alpha test
            if (engine.getAlphaTesting()) {
                defines.push("#define ALPHATEST");
            }
            var previousEffect = this._effect;
            var join = defines.join("\n");
            this._effect = engine.createEffect(this._shaderPath, this._options.attributes, this._options.uniforms, this._options.samplers, join, fallbacks, this.onCompiled, this.onError);
            if (!this._effect.isReady()) {
                return false;
            }
            if (previousEffect !== this._effect) {
                scene.resetCachedMaterial();
            }
            this._renderId = scene.getRenderId();
            return true;
        };
        ShaderMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            var scene = this.getScene();
            if (this._options.uniforms.indexOf("world") !== -1) {
                this._effect.setMatrix("world", world);
            }
            if (this._options.uniforms.indexOf("worldView") !== -1) {
                world.multiplyToRef(scene.getViewMatrix(), this._cachedWorldViewMatrix);
                this._effect.setMatrix("worldView", this._cachedWorldViewMatrix);
            }
            if (this._options.uniforms.indexOf("worldViewProjection") !== -1) {
                this._effect.setMatrix("worldViewProjection", world.multiply(scene.getTransformMatrix()));
            }
        };
        ShaderMaterial.prototype.bind = function (world, mesh) {
            // Std values
            this.bindOnlyWorldMatrix(world);
            if (this.getScene().getCachedMaterial() !== this) {
                if (this._options.uniforms.indexOf("view") !== -1) {
                    this._effect.setMatrix("view", this.getScene().getViewMatrix());
                }
                if (this._options.uniforms.indexOf("projection") !== -1) {
                    this._effect.setMatrix("projection", this.getScene().getProjectionMatrix());
                }
                if (this._options.uniforms.indexOf("viewProjection") !== -1) {
                    this._effect.setMatrix("viewProjection", this.getScene().getTransformMatrix());
                }
                // Bones
                if (mesh && mesh.useBones) {
                    this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
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
            }
            _super.prototype.bind.call(this, world, mesh);
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
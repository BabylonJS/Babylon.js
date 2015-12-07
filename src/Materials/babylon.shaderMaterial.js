var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var ShaderMaterial = (function (_super) {
        __extends(ShaderMaterial, _super);
        function ShaderMaterial(name, scene, shaderPath, options) {
            _super.call(this, name, scene);
            this._textures = {};
            this._floats = {};
            this._floatsArrays = {};
            this._colors3 = {};
            this._colors4 = {};
            this._vectors2 = {};
            this._vectors3 = {};
            this._vectors4 = {};
            this._matrices = {};
            this._matrices3x3 = {};
            this._matrices2x2 = {};
            this._cachedWorldViewMatrix = new BABYLON.Matrix();
            this._shaderPath = shaderPath;
            options.needAlphaBlending = options.needAlphaBlending || false;
            options.needAlphaTesting = options.needAlphaTesting || false;
            options.attributes = options.attributes || ["position", "normal", "uv"];
            options.uniforms = options.uniforms || ["worldViewProjection"];
            options.samplers = options.samplers || [];
            options.defines = options.defines || [];
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
        ShaderMaterial.prototype.setVector4 = function (name, value) {
            this._checkUniform(name);
            this._vectors4[name] = value;
            return this;
        };
        ShaderMaterial.prototype.setMatrix = function (name, value) {
            this._checkUniform(name);
            this._matrices[name] = value;
            return this;
        };
        ShaderMaterial.prototype.setMatrix3x3 = function (name, value) {
            this._checkUniform(name);
            this._matrices3x3[name] = value;
            return this;
        };
        ShaderMaterial.prototype.setMatrix2x2 = function (name, value) {
            this._checkUniform(name);
            this._matrices2x2[name] = value;
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
            for (var index = 0; index < this._options.defines.length; index++) {
                defines.push(this._options.defines[index]);
            }
            // Bones
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders) {
                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
                defines.push("#define BonesPerMesh " + (mesh.skeleton.bones.length + 1));
                fallbacks.addCPUSkinningFallback(0, mesh);
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
                if (mesh && mesh.useBones && mesh.computeBonesUsingShaders) {
                    this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
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
                    var color = this._colors4[name];
                    this._effect.setFloat4(name, color.r, color.g, color.b, color.a);
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
                // Matrix 3x3
                for (name in this._matrices3x3) {
                    this._effect.setMatrix3x3(name, this._matrices3x3[name]);
                }
                // Matrix 2x2
                for (name in this._matrices2x2) {
                    this._effect.setMatrix2x2(name, this._matrices2x2[name]);
                }
            }
            _super.prototype.bind.call(this, world, mesh);
        };
        ShaderMaterial.prototype.clone = function (name) {
            var newShaderMaterial = new ShaderMaterial(name, this.getScene(), this._shaderPath, this._options);
            return newShaderMaterial;
        };
        ShaderMaterial.prototype.dispose = function (forceDisposeEffect) {
            for (var name in this._textures) {
                this._textures[name].dispose();
            }
            this._textures = {};
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        ShaderMaterial.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.options = this._options;
            serializationObject.shaderPath = this._shaderPath;
            // Texture
            serializationObject.textures = {};
            for (var name in this._textures) {
                serializationObject.textures[name] = this._textures[name].serialize();
            }
            // Float    
            serializationObject.floats = {};
            for (name in this._floats) {
                serializationObject.floats[name] = this._floats[name];
            }
            // Float s   
            serializationObject.floatArrays = {};
            for (name in this._floatsArrays) {
                serializationObject.floatArrays[name] = this._floatsArrays[name];
            }
            // Color3    
            serializationObject.colors3 = {};
            for (name in this._colors3) {
                serializationObject.colors3[name] = this._colors3[name].asArray();
            }
            // Color4  
            serializationObject.colors4 = {};
            for (name in this._colors4) {
                serializationObject.colors4[name] = this._colors4[name].asArray();
            }
            // Vector2  
            serializationObject.vectors2 = {};
            for (name in this._vectors2) {
                serializationObject.vectors2[name] = this._vectors2[name].asArray();
            }
            // Vector3        
            serializationObject.vectors3 = {};
            for (name in this._vectors3) {
                serializationObject.vectors3[name] = this._vectors3[name].asArray();
            }
            // Vector4        
            serializationObject.vectors4 = {};
            for (name in this._vectors4) {
                serializationObject.vectors4[name] = this._vectors4[name].asArray();
            }
            // Matrix      
            serializationObject.matrices = {};
            for (name in this._matrices) {
                serializationObject.matrices[name] = this._matrices[name].asArray();
            }
            // Matrix 3x3
            serializationObject.matrices3x3 = {};
            for (name in this._matrices3x3) {
                serializationObject.matrices3x3[name] = this._matrices3x3[name];
            }
            // Matrix 2x2
            serializationObject.matrices2x2 = {};
            for (name in this._matrices2x2) {
                serializationObject.matrices2x2[name] = this._matrices2x2[name];
            }
            return serializationObject;
        };
        ShaderMaterial.Parse = function (source, scene, rootUrl) {
            var material = new ShaderMaterial(source.name, scene, source.shaderPath, source.options);
            // Texture
            for (var name in source.textures) {
                material.setTexture(name, BABYLON.Texture.Parse(source.textures[name], scene, rootUrl));
            }
            // Float    
            for (name in source.floats) {
                material.setFloat(name, source.floats[name]);
            }
            // Float s   
            for (name in source.floatsArrays) {
                material.setFloats(name, source.floatsArrays[name]);
            }
            // Color3        
            for (name in source.colors3) {
                material.setColor3(name, BABYLON.Color3.FromArray(source.colors3[name]));
            }
            // Color4      
            for (name in source.colors4) {
                material.setColor4(name, BABYLON.Color4.FromArray(source.colors4[name]));
            }
            // Vector2        
            for (name in source.vectors2) {
                material.setVector2(name, BABYLON.Vector2.FromArray(source.vectors2[name]));
            }
            // Vector3        
            for (name in source.vectors3) {
                material.setVector3(name, BABYLON.Vector3.FromArray(source.vectors3[name]));
            }
            // Vector4        
            for (name in source.vectors4) {
                material.setVector4(name, BABYLON.Vector4.FromArray(source.vectors4[name]));
            }
            // Matrix      
            for (name in source.matrices) {
                material.setMatrix(name, BABYLON.Matrix.FromArray(source.matrices[name]));
            }
            // Matrix 3x3
            for (name in source.matrices3x3) {
                material.setMatrix3x3(name, source.matrices3x3[name]);
            }
            // Matrix 2x2
            for (name in source.matrices2x2) {
                material.setMatrix2x2(name, source.matrices2x2[name]);
            }
            return material;
        };
        return ShaderMaterial;
    })(BABYLON.Material);
    BABYLON.ShaderMaterial = ShaderMaterial;
})(BABYLON || (BABYLON = {}));

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var ProceduralTexture = (function (_super) {
        __extends(ProceduralTexture, _super);
        function ProceduralTexture(name, size, fragment, scene, fallbackTexture, generateMipMaps, isCube) {
            if (generateMipMaps === void 0) { generateMipMaps = true; }
            if (isCube === void 0) { isCube = false; }
            _super.call(this, null, scene, !generateMipMaps);
            this.isCube = isCube;
            this.isEnabled = true;
            this._currentRefreshId = -1;
            this._refreshRate = 1;
            this._vertexBuffers = {};
            this._uniforms = new Array();
            this._samplers = new Array();
            this._textures = new Array();
            this._floats = new Array();
            this._floatsArrays = {};
            this._colors3 = new Array();
            this._colors4 = new Array();
            this._vectors2 = new Array();
            this._vectors3 = new Array();
            this._matrices = new Array();
            this._fallbackTextureUsed = false;
            scene._proceduralTextures.push(this);
            this.name = name;
            this.isRenderTarget = true;
            this._size = size;
            this._generateMipMaps = generateMipMaps;
            this.setFragment(fragment);
            this._fallbackTexture = fallbackTexture;
            var engine = scene.getEngine();
            if (isCube) {
                this._texture = engine.createRenderTargetCubeTexture(size, { generateMipMaps: generateMipMaps });
                this.setFloat("face", 0);
            }
            else {
                this._texture = engine.createRenderTargetTexture(size, generateMipMaps);
            }
            // VBO
            var vertices = [];
            vertices.push(1, 1);
            vertices.push(-1, 1);
            vertices.push(-1, -1);
            vertices.push(1, -1);
            this._vertexBuffers[BABYLON.VertexBuffer.PositionKind] = new BABYLON.VertexBuffer(engine, vertices, BABYLON.VertexBuffer.PositionKind, false, false, 2);
            // Indices
            var indices = [];
            indices.push(0);
            indices.push(1);
            indices.push(2);
            indices.push(0);
            indices.push(2);
            indices.push(3);
            this._indexBuffer = engine.createIndexBuffer(indices);
        }
        ProceduralTexture.prototype.reset = function () {
            if (this._effect === undefined) {
                return;
            }
            var engine = this.getScene().getEngine();
            engine._releaseEffect(this._effect);
        };
        ProceduralTexture.prototype.isReady = function () {
            var _this = this;
            var engine = this.getScene().getEngine();
            var shaders;
            if (!this._fragment) {
                return false;
            }
            if (this._fallbackTextureUsed) {
                return true;
            }
            if (this._fragment.fragmentElement !== undefined) {
                shaders = { vertex: "procedural", fragmentElement: this._fragment.fragmentElement };
            }
            else {
                shaders = { vertex: "procedural", fragment: this._fragment };
            }
            this._effect = engine.createEffect(shaders, [BABYLON.VertexBuffer.PositionKind], this._uniforms, this._samplers, "", null, null, function () {
                _this.releaseInternalTexture();
                if (_this._fallbackTexture) {
                    _this._texture = _this._fallbackTexture._texture;
                    _this._texture.references++;
                }
                _this._fallbackTextureUsed = true;
            });
            return this._effect.isReady();
        };
        ProceduralTexture.prototype.resetRefreshCounter = function () {
            this._currentRefreshId = -1;
        };
        ProceduralTexture.prototype.setFragment = function (fragment) {
            this._fragment = fragment;
        };
        Object.defineProperty(ProceduralTexture.prototype, "refreshRate", {
            get: function () {
                return this._refreshRate;
            },
            // Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
            set: function (value) {
                this._refreshRate = value;
                this.resetRefreshCounter();
            },
            enumerable: true,
            configurable: true
        });
        ProceduralTexture.prototype._shouldRender = function () {
            if (!this.isEnabled || !this.isReady() || !this._texture) {
                return false;
            }
            if (this._fallbackTextureUsed) {
                return false;
            }
            if (this._currentRefreshId === -1) {
                this._currentRefreshId = 1;
                return true;
            }
            if (this.refreshRate === this._currentRefreshId) {
                this._currentRefreshId = 1;
                return true;
            }
            this._currentRefreshId++;
            return false;
        };
        ProceduralTexture.prototype.getRenderSize = function () {
            return this._size;
        };
        ProceduralTexture.prototype.resize = function (size, generateMipMaps) {
            if (this._fallbackTextureUsed) {
                return;
            }
            this.releaseInternalTexture();
            this._texture = this.getScene().getEngine().createRenderTargetTexture(size, generateMipMaps);
        };
        ProceduralTexture.prototype._checkUniform = function (uniformName) {
            if (this._uniforms.indexOf(uniformName) === -1) {
                this._uniforms.push(uniformName);
            }
        };
        ProceduralTexture.prototype.setTexture = function (name, texture) {
            if (this._samplers.indexOf(name) === -1) {
                this._samplers.push(name);
            }
            this._textures[name] = texture;
            return this;
        };
        ProceduralTexture.prototype.setFloat = function (name, value) {
            this._checkUniform(name);
            this._floats[name] = value;
            return this;
        };
        ProceduralTexture.prototype.setFloats = function (name, value) {
            this._checkUniform(name);
            this._floatsArrays[name] = value;
            return this;
        };
        ProceduralTexture.prototype.setColor3 = function (name, value) {
            this._checkUniform(name);
            this._colors3[name] = value;
            return this;
        };
        ProceduralTexture.prototype.setColor4 = function (name, value) {
            this._checkUniform(name);
            this._colors4[name] = value;
            return this;
        };
        ProceduralTexture.prototype.setVector2 = function (name, value) {
            this._checkUniform(name);
            this._vectors2[name] = value;
            return this;
        };
        ProceduralTexture.prototype.setVector3 = function (name, value) {
            this._checkUniform(name);
            this._vectors3[name] = value;
            return this;
        };
        ProceduralTexture.prototype.setMatrix = function (name, value) {
            this._checkUniform(name);
            this._matrices[name] = value;
            return this;
        };
        ProceduralTexture.prototype.render = function (useCameraPostProcess) {
            var scene = this.getScene();
            var engine = scene.getEngine();
            // Render
            engine.enableEffect(this._effect);
            engine.setState(false);
            // Texture
            for (var name in this._textures) {
                this._effect.setTexture(name, this._textures[name]);
            }
            // Float    
            for (name in this._floats) {
                this._effect.setFloat(name, this._floats[name]);
            }
            // Floats   
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
            // Matrix      
            for (name in this._matrices) {
                this._effect.setMatrix(name, this._matrices[name]);
            }
            // VBOs
            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, this._effect);
            if (this.isCube) {
                for (var face = 0; face < 6; face++) {
                    engine.bindFramebuffer(this._texture, face);
                    this._effect.setFloat("face", face);
                    // Clear
                    engine.clear(scene.clearColor, true, true, true);
                    // Draw order
                    engine.draw(true, 0, 6);
                    // Mipmaps
                    if (face === 5) {
                        engine.generateMipMapsForCubemap(this._texture);
                    }
                }
            }
            else {
                engine.bindFramebuffer(this._texture);
                // Clear
                engine.clear(scene.clearColor, true, true, true);
                // Draw order
                engine.draw(true, 0, 6);
            }
            // Unbind
            engine.unBindFramebuffer(this._texture, this.isCube);
            if (this.onGenerated) {
                this.onGenerated();
            }
        };
        ProceduralTexture.prototype.clone = function () {
            var textureSize = this.getSize();
            var newTexture = new ProceduralTexture(this.name, textureSize.width, this._fragment, this.getScene(), this._fallbackTexture, this._generateMipMaps);
            // Base texture
            newTexture.hasAlpha = this.hasAlpha;
            newTexture.level = this.level;
            // RenderTarget Texture
            newTexture.coordinatesMode = this.coordinatesMode;
            return newTexture;
        };
        ProceduralTexture.prototype.dispose = function () {
            var index = this.getScene()._proceduralTextures.indexOf(this);
            if (index >= 0) {
                this.getScene()._proceduralTextures.splice(index, 1);
            }
            var vertexBuffer = this._vertexBuffers[BABYLON.VertexBuffer.PositionKind];
            if (vertexBuffer) {
                vertexBuffer.dispose();
                this._vertexBuffers[BABYLON.VertexBuffer.PositionKind] = null;
            }
            if (this._indexBuffer && this.getScene().getEngine()._releaseBuffer(this._indexBuffer)) {
                this._indexBuffer = null;
            }
            _super.prototype.dispose.call(this);
        };
        return ProceduralTexture;
    }(BABYLON.Texture));
    BABYLON.ProceduralTexture = ProceduralTexture;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.proceduralTexture.js.map
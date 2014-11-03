var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var ProceduralTexture = (function (_super) {
        __extends(ProceduralTexture, _super);
        function ProceduralTexture(name, size, fragment, scene, generateMipMaps) {
            _super.call(this, null, scene, !generateMipMaps);
            this._currentRefreshId = -1;
            this._refreshRate = 1;
            this._vertexDeclaration = [2];
            this._vertexStrideSize = 2 * 4;
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

            scene._proceduralTextures.push(this);

            this.name = name;
            this.isRenderTarget = true;
            this._size = size;
            this._generateMipMaps = generateMipMaps;

            this._fragment = fragment;

            this._texture = scene.getEngine().createRenderTargetTexture(size, generateMipMaps);

            // VBO
            var vertices = [];
            vertices.push(1, 1);
            vertices.push(-1, 1);
            vertices.push(-1, -1);
            vertices.push(1, -1);

            this._vertexBuffer = scene.getEngine().createVertexBuffer(vertices);

            // Indices
            var indices = [];
            indices.push(0);
            indices.push(1);
            indices.push(2);

            indices.push(0);
            indices.push(2);
            indices.push(3);

            this._indexBuffer = scene.getEngine().createIndexBuffer(indices);
        }
        ProceduralTexture.prototype.isReady = function () {
            var engine = this.getScene().getEngine();

            this._effect = engine.createEffect({ vertex: "procedural", fragment: this._fragment }, ["position"], this._uniforms, this._samplers, "");

            return this._effect.isReady();
        };

        ProceduralTexture.prototype.resetRefreshCounter = function () {
            this._currentRefreshId = -1;
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
            if (this._currentRefreshId === -1) {
                this._currentRefreshId = 1;
                return true;
            }

            if (this.refreshRate == this._currentRefreshId) {
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
            if (!this.isReady() || !this._texture)
                return;

            var scene = this.getScene();
            var engine = scene.getEngine();

            engine.bindFramebuffer(this._texture);

            // Clear
            engine.clear(scene.clearColor, true, true);

            // Render
            engine.enableEffect(this._effect);
            engine.setState(false);

            // VBOs
            engine.bindBuffers(this._vertexBuffer, this._indexBuffer, this._vertexDeclaration, this._vertexStrideSize, this._effect);

            // Draw order
            engine.draw(true, 0, 6);

            // Unbind
            engine.unBindFramebuffer(this._texture);
        };

        ProceduralTexture.prototype.clone = function () {
            var textureSize = this.getSize();
            var newTexture = new BABYLON.ProceduralTexture(this.name, textureSize.width, this._fragment, this.getScene(), this._generateMipMaps);

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
            _super.prototype.dispose.call(this);
        };
        return ProceduralTexture;
    })(BABYLON.Texture);
    BABYLON.ProceduralTexture = ProceduralTexture;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.proceduralTexture.js.map

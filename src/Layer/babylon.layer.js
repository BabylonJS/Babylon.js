var BABYLON;
(function (BABYLON) {
    var Layer = (function () {
        function Layer(name, imgUrl, scene, isBackground, color) {
            this.name = name;
            this.scale = new BABYLON.Vector2(1, 1);
            this.offset = new BABYLON.Vector2(0, 0);
            this.alphaBlendingMode = BABYLON.Engine.ALPHA_COMBINE;
            this._vertexDeclaration = [2];
            this._vertexStrideSize = 2 * 4;
            this.texture = imgUrl ? new BABYLON.Texture(imgUrl, scene, true) : null;
            this.isBackground = isBackground === undefined ? true : isBackground;
            this.color = color === undefined ? new BABYLON.Color4(1, 1, 1, 1) : color;
            this._scene = scene;
            this._scene.layers.push(this);
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
            // Effects
            this._effect = this._scene.getEngine().createEffect("layer", ["position"], ["textureMatrix", "color", "scale", "offset"], ["textureSampler"], "");
        }
        Layer.prototype.render = function () {
            // Check
            if (!this._effect.isReady() || !this.texture || !this.texture.isReady())
                return;
            var engine = this._scene.getEngine();
            // Render
            engine.enableEffect(this._effect);
            engine.setState(false);
            // Texture
            this._effect.setTexture("textureSampler", this.texture);
            this._effect.setMatrix("textureMatrix", this.texture.getTextureMatrix());
            // Color
            this._effect.setFloat4("color", this.color.r, this.color.g, this.color.b, this.color.a);
            // Scale / offset
            this._effect.setVector2("offset", this.offset);
            this._effect.setVector2("scale", this.scale);
            // VBOs
            engine.bindBuffers(this._vertexBuffer, this._indexBuffer, this._vertexDeclaration, this._vertexStrideSize, this._effect);
            // Draw order
            engine.setAlphaMode(this.alphaBlendingMode);
            engine.draw(true, 0, 6);
            engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);
        };
        Layer.prototype.dispose = function () {
            if (this._vertexBuffer) {
                this._scene.getEngine()._releaseBuffer(this._vertexBuffer);
                this._vertexBuffer = null;
            }
            if (this._indexBuffer) {
                this._scene.getEngine()._releaseBuffer(this._indexBuffer);
                this._indexBuffer = null;
            }
            if (this.texture) {
                this.texture.dispose();
                this.texture = null;
            }
            // Remove from scene
            var index = this._scene.layers.indexOf(this);
            this._scene.layers.splice(index, 1);
            // Callback
            if (this.onDispose) {
                this.onDispose();
            }
        };
        return Layer;
    })();
    BABYLON.Layer = Layer;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.layer.js.map
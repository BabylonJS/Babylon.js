var BABYLON;
(function (BABYLON) {
    var SpriteManager = (function () {
        function SpriteManager(name, imgUrl, capacity, cellSize, scene, epsilon, samplingMode) {
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            this.name = name;
            this.cellSize = cellSize;
            this.sprites = new Array();
            this.renderingGroupId = 0;
            this.fogEnabled = true;
            this._vertexDeclaration = [4, 4, 4, 4];
            this._vertexStrideSize = 16 * 4; // 15 floats per sprite (x, y, z, angle, sizeX, sizeY, offsetX, offsetY, invertU, invertV, cellIndexX, cellIndexY, color)
            this._capacity = capacity;
            this._spriteTexture = new BABYLON.Texture(imgUrl, scene, true, false, samplingMode);
            this._spriteTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._spriteTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._epsilon = epsilon === undefined ? 0.01 : epsilon;
            this._scene = scene;
            this._scene.spriteManagers.push(this);
            // VBO
            this._vertexBuffer = scene.getEngine().createDynamicVertexBuffer(capacity * this._vertexStrideSize * 4);
            var indices = [];
            var index = 0;
            for (var count = 0; count < capacity; count++) {
                indices.push(index);
                indices.push(index + 1);
                indices.push(index + 2);
                indices.push(index);
                indices.push(index + 2);
                indices.push(index + 3);
                index += 4;
            }
            this._indexBuffer = scene.getEngine().createIndexBuffer(indices);
            this._vertices = new Float32Array(capacity * this._vertexStrideSize);
            // Effects
            this._effectBase = this._scene.getEngine().createEffect("sprites", ["position", "options", "cellInfo", "color"], ["view", "projection", "textureInfos", "alphaTest"], ["diffuseSampler"], "");
            this._effectFog = this._scene.getEngine().createEffect("sprites", ["position", "options", "cellInfo", "color"], ["view", "projection", "textureInfos", "alphaTest", "vFogInfos", "vFogColor"], ["diffuseSampler"], "#define FOG");
        }
        SpriteManager.prototype._appendSpriteVertex = function (index, sprite, offsetX, offsetY, rowSize) {
            var arrayOffset = index * 16;
            if (offsetX === 0)
                offsetX = this._epsilon;
            else if (offsetX === 1)
                offsetX = 1 - this._epsilon;
            if (offsetY === 0)
                offsetY = this._epsilon;
            else if (offsetY === 1)
                offsetY = 1 - this._epsilon;
            this._vertices[arrayOffset] = sprite.position.x;
            this._vertices[arrayOffset + 1] = sprite.position.y;
            this._vertices[arrayOffset + 2] = sprite.position.z;
            this._vertices[arrayOffset + 3] = sprite.angle;
            this._vertices[arrayOffset + 4] = sprite.width;
            this._vertices[arrayOffset + 5] = sprite.height;
            this._vertices[arrayOffset + 6] = offsetX;
            this._vertices[arrayOffset + 7] = offsetY;
            this._vertices[arrayOffset + 8] = sprite.invertU ? 1 : 0;
            this._vertices[arrayOffset + 9] = sprite.invertV ? 1 : 0;
            var offset = (sprite.cellIndex / rowSize) >> 0;
            this._vertices[arrayOffset + 10] = sprite.cellIndex - offset * rowSize;
            this._vertices[arrayOffset + 11] = offset;
            // Color
            this._vertices[arrayOffset + 12] = sprite.color.r;
            this._vertices[arrayOffset + 13] = sprite.color.g;
            this._vertices[arrayOffset + 14] = sprite.color.b;
            this._vertices[arrayOffset + 15] = sprite.color.a;
        };
        SpriteManager.prototype.render = function () {
            // Check
            if (!this._effectBase.isReady() || !this._effectFog.isReady() || !this._spriteTexture || !this._spriteTexture.isReady())
                return;
            var engine = this._scene.getEngine();
            var baseSize = this._spriteTexture.getBaseSize();
            // Sprites
            var deltaTime = engine.getDeltaTime();
            var max = Math.min(this._capacity, this.sprites.length);
            var rowSize = baseSize.width / this.cellSize;
            var offset = 0;
            for (var index = 0; index < max; index++) {
                var sprite = this.sprites[index];
                if (!sprite) {
                    continue;
                }
                sprite._animate(deltaTime);
                this._appendSpriteVertex(offset++, sprite, 0, 0, rowSize);
                this._appendSpriteVertex(offset++, sprite, 1, 0, rowSize);
                this._appendSpriteVertex(offset++, sprite, 1, 1, rowSize);
                this._appendSpriteVertex(offset++, sprite, 0, 1, rowSize);
            }
            engine.updateDynamicVertexBuffer(this._vertexBuffer, this._vertices);
            // Render
            var effect = this._effectBase;
            if (this._scene.fogEnabled && this._scene.fogMode !== BABYLON.Scene.FOGMODE_NONE && this.fogEnabled) {
                effect = this._effectFog;
            }
            engine.enableEffect(effect);
            var viewMatrix = this._scene.getViewMatrix();
            effect.setTexture("diffuseSampler", this._spriteTexture);
            effect.setMatrix("view", viewMatrix);
            effect.setMatrix("projection", this._scene.getProjectionMatrix());
            effect.setFloat2("textureInfos", this.cellSize / baseSize.width, this.cellSize / baseSize.height);
            // Fog
            if (this._scene.fogEnabled && this._scene.fogMode !== BABYLON.Scene.FOGMODE_NONE && this.fogEnabled) {
                effect.setFloat4("vFogInfos", this._scene.fogMode, this._scene.fogStart, this._scene.fogEnd, this._scene.fogDensity);
                effect.setColor3("vFogColor", this._scene.fogColor);
            }
            // VBOs
            engine.bindBuffers(this._vertexBuffer, this._indexBuffer, this._vertexDeclaration, this._vertexStrideSize, effect);
            // Draw order
            engine.setDepthFunctionToLessOrEqual();
            effect.setBool("alphaTest", true);
            engine.setColorWrite(false);
            engine.draw(true, 0, max * 6);
            engine.setColorWrite(true);
            effect.setBool("alphaTest", false);
            engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE);
            engine.draw(true, 0, max * 6);
            engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);
        };
        SpriteManager.prototype.dispose = function () {
            if (this._vertexBuffer) {
                this._scene.getEngine()._releaseBuffer(this._vertexBuffer);
                this._vertexBuffer = null;
            }
            if (this._indexBuffer) {
                this._scene.getEngine()._releaseBuffer(this._indexBuffer);
                this._indexBuffer = null;
            }
            if (this._spriteTexture) {
                this._spriteTexture.dispose();
                this._spriteTexture = null;
            }
            // Remove from scene
            var index = this._scene.spriteManagers.indexOf(this);
            this._scene.spriteManagers.splice(index, 1);
            // Callback
            if (this.onDispose) {
                this.onDispose();
            }
        };
        return SpriteManager;
    })();
    BABYLON.SpriteManager = SpriteManager;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.spriteManager.js.map
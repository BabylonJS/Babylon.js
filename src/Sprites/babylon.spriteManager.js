var BABYLON;
(function (BABYLON) {
    var SpriteManager = (function () {
        function SpriteManager(name, imgUrl, capacity, cellSize, scene, epsilon, samplingMode) {
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            this.name = name;
            this.sprites = new Array();
            this.renderingGroupId = 0;
            this.layerMask = 0x0FFFFFFF;
            this.fogEnabled = true;
            this.isPickable = false;
            /**
            * An event triggered when the manager is disposed.
            * @type {BABYLON.Observable}
            */
            this.onDisposeObservable = new BABYLON.Observable();
            this._vertexBuffers = {};
            this._capacity = capacity;
            this._spriteTexture = new BABYLON.Texture(imgUrl, scene, true, false, samplingMode);
            this._spriteTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._spriteTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._epsilon = epsilon === undefined ? 0.01 : epsilon;
            if (cellSize.width) {
                this.cellWidth = cellSize.width;
                this.cellHeight = cellSize.height;
            }
            else {
                this.cellWidth = cellSize;
                this.cellHeight = cellSize;
            }
            this._scene = scene;
            this._scene.spriteManagers.push(this);
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
            // VBO
            // 16 floats per sprite (x, y, z, angle, sizeX, sizeY, offsetX, offsetY, invertU, invertV, cellIndexX, cellIndexY, color r, color g, color b, color a)
            this._vertexData = new Float32Array(capacity * 16 * 4);
            this._buffer = new BABYLON.Buffer(scene.getEngine(), this._vertexData, true, 16);
            var positions = this._buffer.createVertexBuffer(BABYLON.VertexBuffer.PositionKind, 0, 4);
            var options = this._buffer.createVertexBuffer("options", 4, 4);
            var cellInfo = this._buffer.createVertexBuffer("cellInfo", 8, 4);
            var colors = this._buffer.createVertexBuffer(BABYLON.VertexBuffer.ColorKind, 12, 4);
            this._vertexBuffers[BABYLON.VertexBuffer.PositionKind] = positions;
            this._vertexBuffers["options"] = options;
            this._vertexBuffers["cellInfo"] = cellInfo;
            this._vertexBuffers[BABYLON.VertexBuffer.ColorKind] = colors;
            // Effects
            this._effectBase = this._scene.getEngine().createEffect("sprites", [BABYLON.VertexBuffer.PositionKind, "options", "cellInfo", BABYLON.VertexBuffer.ColorKind], ["view", "projection", "textureInfos", "alphaTest"], ["diffuseSampler"], "");
            this._effectFog = this._scene.getEngine().createEffect("sprites", [BABYLON.VertexBuffer.PositionKind, "options", "cellInfo", BABYLON.VertexBuffer.ColorKind], ["view", "projection", "textureInfos", "alphaTest", "vFogInfos", "vFogColor"], ["diffuseSampler"], "#define FOG");
        }
        Object.defineProperty(SpriteManager.prototype, "onDispose", {
            set: function (callback) {
                if (this._onDisposeObserver) {
                    this.onDisposeObservable.remove(this._onDisposeObserver);
                }
                this._onDisposeObserver = this.onDisposeObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SpriteManager.prototype, "texture", {
            get: function () {
                return this._spriteTexture;
            },
            set: function (value) {
                this._spriteTexture = value;
            },
            enumerable: true,
            configurable: true
        });
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
            this._vertexData[arrayOffset] = sprite.position.x;
            this._vertexData[arrayOffset + 1] = sprite.position.y;
            this._vertexData[arrayOffset + 2] = sprite.position.z;
            this._vertexData[arrayOffset + 3] = sprite.angle;
            this._vertexData[arrayOffset + 4] = sprite.width;
            this._vertexData[arrayOffset + 5] = sprite.height;
            this._vertexData[arrayOffset + 6] = offsetX;
            this._vertexData[arrayOffset + 7] = offsetY;
            this._vertexData[arrayOffset + 8] = sprite.invertU ? 1 : 0;
            this._vertexData[arrayOffset + 9] = sprite.invertV ? 1 : 0;
            var offset = (sprite.cellIndex / rowSize) >> 0;
            this._vertexData[arrayOffset + 10] = sprite.cellIndex - offset * rowSize;
            this._vertexData[arrayOffset + 11] = offset;
            // Color
            this._vertexData[arrayOffset + 12] = sprite.color.r;
            this._vertexData[arrayOffset + 13] = sprite.color.g;
            this._vertexData[arrayOffset + 14] = sprite.color.b;
            this._vertexData[arrayOffset + 15] = sprite.color.a;
        };
        SpriteManager.prototype.intersects = function (ray, camera, predicate, fastCheck) {
            var count = Math.min(this._capacity, this.sprites.length);
            var min = BABYLON.Vector3.Zero();
            var max = BABYLON.Vector3.Zero();
            var distance = Number.MAX_VALUE;
            var currentSprite;
            var cameraSpacePosition = BABYLON.Vector3.Zero();
            var cameraView = camera.getViewMatrix();
            for (var index = 0; index < count; index++) {
                var sprite = this.sprites[index];
                if (!sprite) {
                    continue;
                }
                if (predicate) {
                    if (!predicate(sprite)) {
                        continue;
                    }
                }
                else if (!sprite.isPickable) {
                    continue;
                }
                BABYLON.Vector3.TransformCoordinatesToRef(sprite.position, cameraView, cameraSpacePosition);
                min.copyFromFloats(cameraSpacePosition.x - sprite.width / 2, cameraSpacePosition.y - sprite.height / 2, cameraSpacePosition.z);
                max.copyFromFloats(cameraSpacePosition.x + sprite.width / 2, cameraSpacePosition.y + sprite.height / 2, cameraSpacePosition.z);
                if (ray.intersectsBoxMinMax(min, max)) {
                    var currentDistance = BABYLON.Vector3.Distance(cameraSpacePosition, ray.origin);
                    if (distance > currentDistance) {
                        distance = currentDistance;
                        currentSprite = sprite;
                        if (fastCheck) {
                            break;
                        }
                    }
                }
            }
            if (currentSprite) {
                var result = new BABYLON.PickingInfo();
                result.hit = true;
                result.pickedSprite = currentSprite;
                result.distance = distance;
                return result;
            }
            return null;
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
            var rowSize = baseSize.width / this.cellWidth;
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
            this._buffer.update(this._vertexData);
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
            effect.setFloat2("textureInfos", this.cellWidth / baseSize.width, this.cellHeight / baseSize.height);
            // Fog
            if (this._scene.fogEnabled && this._scene.fogMode !== BABYLON.Scene.FOGMODE_NONE && this.fogEnabled) {
                effect.setFloat4("vFogInfos", this._scene.fogMode, this._scene.fogStart, this._scene.fogEnd, this._scene.fogDensity);
                effect.setColor3("vFogColor", this._scene.fogColor);
            }
            // VBOs
            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);
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
            if (this._buffer) {
                this._buffer.dispose();
                this._buffer = null;
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
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();
        };
        return SpriteManager;
    }());
    BABYLON.SpriteManager = SpriteManager;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.spriteManager.js.map
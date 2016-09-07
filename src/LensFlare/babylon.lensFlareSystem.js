var BABYLON;
(function (BABYLON) {
    var LensFlareSystem = (function () {
        function LensFlareSystem(name, emitter, scene) {
            this.name = name;
            this.lensFlares = new Array();
            this.borderLimit = 300;
            this.layerMask = 0x0FFFFFFF;
            this._vertexBuffers = {};
            this._isEnabled = true;
            this._scene = scene;
            this._emitter = emitter;
            this.id = name;
            scene.lensFlareSystems.push(this);
            this.meshesSelectionPredicate = function (m) { return m.material && m.isVisible && m.isEnabled() && m.isBlocker && ((m.layerMask & scene.activeCamera.layerMask) != 0); };
            var engine = scene.getEngine();
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
            // Effects
            this._effect = engine.createEffect("lensFlare", [BABYLON.VertexBuffer.PositionKind], ["color", "viewportMatrix"], ["textureSampler"], "");
        }
        Object.defineProperty(LensFlareSystem.prototype, "isEnabled", {
            get: function () {
                return this._isEnabled;
            },
            set: function (value) {
                this._isEnabled = value;
            },
            enumerable: true,
            configurable: true
        });
        LensFlareSystem.prototype.getScene = function () {
            return this._scene;
        };
        LensFlareSystem.prototype.getEmitter = function () {
            return this._emitter;
        };
        LensFlareSystem.prototype.setEmitter = function (newEmitter) {
            this._emitter = newEmitter;
        };
        LensFlareSystem.prototype.getEmitterPosition = function () {
            return this._emitter.getAbsolutePosition ? this._emitter.getAbsolutePosition() : this._emitter.position;
        };
        LensFlareSystem.prototype.computeEffectivePosition = function (globalViewport) {
            var position = this.getEmitterPosition();
            position = BABYLON.Vector3.Project(position, BABYLON.Matrix.Identity(), this._scene.getTransformMatrix(), globalViewport);
            this._positionX = position.x;
            this._positionY = position.y;
            position = BABYLON.Vector3.TransformCoordinates(this.getEmitterPosition(), this._scene.getViewMatrix());
            if (position.z > 0) {
                if ((this._positionX > globalViewport.x) && (this._positionX < globalViewport.x + globalViewport.width)) {
                    if ((this._positionY > globalViewport.y) && (this._positionY < globalViewport.y + globalViewport.height))
                        return true;
                }
            }
            return false;
        };
        LensFlareSystem.prototype._isVisible = function () {
            if (!this._isEnabled) {
                return false;
            }
            var emitterPosition = this.getEmitterPosition();
            var direction = emitterPosition.subtract(this._scene.activeCamera.position);
            var distance = direction.length();
            direction.normalize();
            var ray = new BABYLON.Ray(this._scene.activeCamera.position, direction);
            var pickInfo = this._scene.pickWithRay(ray, this.meshesSelectionPredicate, true);
            return !pickInfo.hit || pickInfo.distance > distance;
        };
        LensFlareSystem.prototype.render = function () {
            if (!this._effect.isReady())
                return false;
            var engine = this._scene.getEngine();
            var viewport = this._scene.activeCamera.viewport;
            var globalViewport = viewport.toGlobal(engine.getRenderWidth(true), engine.getRenderHeight(true));
            // Position
            if (!this.computeEffectivePosition(globalViewport)) {
                return false;
            }
            // Visibility
            if (!this._isVisible()) {
                return false;
            }
            // Intensity
            var awayX;
            var awayY;
            if (this._positionX < this.borderLimit + globalViewport.x) {
                awayX = this.borderLimit + globalViewport.x - this._positionX;
            }
            else if (this._positionX > globalViewport.x + globalViewport.width - this.borderLimit) {
                awayX = this._positionX - globalViewport.x - globalViewport.width + this.borderLimit;
            }
            else {
                awayX = 0;
            }
            if (this._positionY < this.borderLimit + globalViewport.y) {
                awayY = this.borderLimit + globalViewport.y - this._positionY;
            }
            else if (this._positionY > globalViewport.y + globalViewport.height - this.borderLimit) {
                awayY = this._positionY - globalViewport.y - globalViewport.height + this.borderLimit;
            }
            else {
                awayY = 0;
            }
            var away = (awayX > awayY) ? awayX : awayY;
            if (away > this.borderLimit) {
                away = this.borderLimit;
            }
            var intensity = 1.0 - (away / this.borderLimit);
            if (intensity < 0) {
                return false;
            }
            if (intensity > 1.0) {
                intensity = 1.0;
            }
            // Position
            var centerX = globalViewport.x + globalViewport.width / 2;
            var centerY = globalViewport.y + globalViewport.height / 2;
            var distX = centerX - this._positionX;
            var distY = centerY - this._positionY;
            // Effects
            engine.enableEffect(this._effect);
            engine.setState(false);
            engine.setDepthBuffer(false);
            // VBOs
            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, this._effect);
            // Flares
            for (var index = 0; index < this.lensFlares.length; index++) {
                var flare = this.lensFlares[index];
                engine.setAlphaMode(flare.alphaMode);
                var x = centerX - (distX * flare.position);
                var y = centerY - (distY * flare.position);
                var cw = flare.size;
                var ch = flare.size * engine.getAspectRatio(this._scene.activeCamera, true);
                var cx = 2 * (x / (globalViewport.width + globalViewport.x * 2)) - 1.0;
                var cy = 1.0 - 2 * (y / (globalViewport.height + globalViewport.y * 2));
                var viewportMatrix = BABYLON.Matrix.FromValues(cw / 2, 0, 0, 0, 0, ch / 2, 0, 0, 0, 0, 1, 0, cx, cy, 0, 1);
                this._effect.setMatrix("viewportMatrix", viewportMatrix);
                // Texture
                this._effect.setTexture("textureSampler", flare.texture);
                // Color
                this._effect.setFloat4("color", flare.color.r * intensity, flare.color.g * intensity, flare.color.b * intensity, 1.0);
                // Draw order
                engine.draw(true, 0, 6);
            }
            engine.setDepthBuffer(true);
            engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);
            return true;
        };
        LensFlareSystem.prototype.dispose = function () {
            var vertexBuffer = this._vertexBuffers[BABYLON.VertexBuffer.PositionKind];
            if (vertexBuffer) {
                vertexBuffer.dispose();
                this._vertexBuffers[BABYLON.VertexBuffer.PositionKind] = null;
            }
            if (this._indexBuffer) {
                this._scene.getEngine()._releaseBuffer(this._indexBuffer);
                this._indexBuffer = null;
            }
            while (this.lensFlares.length) {
                this.lensFlares[0].dispose();
            }
            // Remove from scene
            var index = this._scene.lensFlareSystems.indexOf(this);
            this._scene.lensFlareSystems.splice(index, 1);
        };
        LensFlareSystem.Parse = function (parsedLensFlareSystem, scene, rootUrl) {
            var emitter = scene.getLastEntryByID(parsedLensFlareSystem.emitterId);
            var name = parsedLensFlareSystem.name || "lensFlareSystem#" + parsedLensFlareSystem.emitterId;
            var lensFlareSystem = new LensFlareSystem(name, emitter, scene);
            lensFlareSystem.id = parsedLensFlareSystem.id || name;
            lensFlareSystem.borderLimit = parsedLensFlareSystem.borderLimit;
            for (var index = 0; index < parsedLensFlareSystem.flares.length; index++) {
                var parsedFlare = parsedLensFlareSystem.flares[index];
                var flare = new BABYLON.LensFlare(parsedFlare.size, parsedFlare.position, BABYLON.Color3.FromArray(parsedFlare.color), rootUrl + parsedFlare.textureName, lensFlareSystem);
            }
            return lensFlareSystem;
        };
        LensFlareSystem.prototype.serialize = function () {
            var serializationObject = {};
            serializationObject.id = this.id;
            serializationObject.name = this.name;
            serializationObject.emitterId = this.getEmitter().id;
            serializationObject.borderLimit = this.borderLimit;
            serializationObject.flares = [];
            for (var index = 0; index < this.lensFlares.length; index++) {
                var flare = this.lensFlares[index];
                serializationObject.flares.push({
                    size: flare.size,
                    position: flare.position,
                    color: flare.color.asArray(),
                    textureName: BABYLON.Tools.GetFilename(flare.texture.name)
                });
            }
            return serializationObject;
        };
        return LensFlareSystem;
    })();
    BABYLON.LensFlareSystem = LensFlareSystem;
})(BABYLON || (BABYLON = {}));

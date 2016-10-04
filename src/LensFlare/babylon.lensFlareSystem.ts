module BABYLON {
    export class LensFlareSystem {
        public lensFlares = new Array<LensFlare>();
        public borderLimit = 300;
        public viewportBorder = 0;
        public meshesSelectionPredicate: (mesh: Mesh) => boolean;
        public layerMask: number = 0x0FFFFFFF;
        public id: string;

        private _scene: Scene;
        private _emitter: any;
        private _vertexBuffers: { [key: string]: VertexBuffer } = {};
        private _indexBuffer: WebGLBuffer;
        private _effect: Effect;
        private _positionX: number;
        private _positionY: number;
        private _isEnabled = true;

        constructor(public name: string, emitter: any, scene: Scene) {

            this._scene = scene;
            this._emitter = emitter;
            this.id = name;
            scene.lensFlareSystems.push(this);

            this.meshesSelectionPredicate = m => m.material && m.isVisible && m.isEnabled() && m.isBlocker && ((m.layerMask & scene.activeCamera.layerMask) != 0);

            var engine = scene.getEngine();

            // VBO
            var vertices = [];
            vertices.push(1, 1);
            vertices.push(-1, 1);
            vertices.push(-1, -1);
            vertices.push(1, -1);

            this._vertexBuffers[VertexBuffer.PositionKind] = new VertexBuffer(engine, vertices, VertexBuffer.PositionKind, false, false, 2);

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
            this._effect = engine.createEffect("lensFlare",
                [VertexBuffer.PositionKind],
                ["color", "viewportMatrix"],
                ["textureSampler"], "");
        }

        public get isEnabled(): boolean {
            return this._isEnabled;
        }

        public set isEnabled(value: boolean) {
            this._isEnabled = value;
        }

        public getScene(): Scene {
            return this._scene;
        }

        public getEmitter(): any {
            return this._emitter;
        }

        public setEmitter(newEmitter: any): void {
            this._emitter = newEmitter;
        }

        public getEmitterPosition(): Vector3 {
            return this._emitter.getAbsolutePosition ? this._emitter.getAbsolutePosition() : this._emitter.position;
        }

        public computeEffectivePosition(globalViewport: Viewport): boolean {
            var position = this.getEmitterPosition();

            position = Vector3.Project(position, Matrix.Identity(), this._scene.getTransformMatrix(), globalViewport);

            this._positionX = position.x;
            this._positionY = position.y;

            position = Vector3.TransformCoordinates(this.getEmitterPosition(), this._scene.getViewMatrix());

            if (this.viewportBorder>0) {
                globalViewport.x -= this.viewportBorder;
                globalViewport.y -= this.viewportBorder;
                globalViewport.width += this.viewportBorder * 2;
                globalViewport.height += this.viewportBorder * 2;
                position.x += this.viewportBorder;
                position.y += this.viewportBorder;
                this._positionX += this.viewportBorder;
                this._positionY += this.viewportBorder;
            }

            if (position.z > 0) {
                if ((this._positionX > globalViewport.x) && (this._positionX < globalViewport.x + globalViewport.width)) {
                    if ((this._positionY > globalViewport.y) && (this._positionY < globalViewport.y + globalViewport.height))
                        return true;
                }
                return true;
            }

            return false;
        }

        public _isVisible(): boolean {
            if (!this._isEnabled) {
                return false;
            }

            var emitterPosition = this.getEmitterPosition();
            var direction = emitterPosition.subtract(this._scene.activeCamera.globalPosition);
            var distance = direction.length();
            direction.normalize();

            var ray = new Ray(this._scene.activeCamera.globalPosition, direction);
            var pickInfo = this._scene.pickWithRay(ray, this.meshesSelectionPredicate, true);

            return !pickInfo.hit || pickInfo.distance > distance;
        }

        public render(): boolean {
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
            } else if (this._positionX > globalViewport.x + globalViewport.width - this.borderLimit) {
                awayX = this._positionX - globalViewport.x - globalViewport.width + this.borderLimit;
            } else {
                awayX = 0;
            }

            if (this._positionY < this.borderLimit + globalViewport.y) {
                awayY = this.borderLimit + globalViewport.y - this._positionY;
            } else if (this._positionY > globalViewport.y + globalViewport.height - this.borderLimit) {
                awayY = this._positionY - globalViewport.y - globalViewport.height + this.borderLimit;
            } else {
                awayY = 0;
            }

            var away = (awayX > awayY) ? awayX : awayY;

            away -= this.viewportBorder;

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

            if (this.viewportBorder>0) {
                globalViewport.x += this.viewportBorder;
                globalViewport.y += this.viewportBorder;
                globalViewport.width -= this.viewportBorder * 2;
                globalViewport.height -= this.viewportBorder * 2;
                this._positionX -= this.viewportBorder;
                this._positionY -= this.viewportBorder;
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

                var viewportMatrix = Matrix.FromValues(
                    cw / 2, 0, 0, 0,
                    0, ch / 2, 0, 0,
                    0, 0, 1, 0,
                    cx, cy, 0, 1);

                this._effect.setMatrix("viewportMatrix", viewportMatrix);

                // Texture
                this._effect.setTexture("textureSampler", flare.texture);

                // Color
                this._effect.setFloat4("color", flare.color.r * intensity, flare.color.g * intensity, flare.color.b * intensity, 1.0);

                // Draw order
                engine.draw(true, 0, 6);
            }

            engine.setDepthBuffer(true);
            engine.setAlphaMode(Engine.ALPHA_DISABLE);
            return true;
        }

        public dispose(): void {
            var vertexBuffer = this._vertexBuffers[VertexBuffer.PositionKind];
            if (vertexBuffer) {
                vertexBuffer.dispose();
                this._vertexBuffers[VertexBuffer.PositionKind] = null;
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
        }

        public static Parse(parsedLensFlareSystem: any, scene: Scene, rootUrl: string): LensFlareSystem {
            var emitter = scene.getLastEntryByID(parsedLensFlareSystem.emitterId);

            var name = parsedLensFlareSystem.name || "lensFlareSystem#" + parsedLensFlareSystem.emitterId;

            var lensFlareSystem = new LensFlareSystem(name, emitter, scene);

            lensFlareSystem.id = parsedLensFlareSystem.id || name;
            lensFlareSystem.borderLimit = parsedLensFlareSystem.borderLimit;

            for (var index = 0; index < parsedLensFlareSystem.flares.length; index++) {
                var parsedFlare = parsedLensFlareSystem.flares[index];
                var flare = new LensFlare(parsedFlare.size, parsedFlare.position, Color3.FromArray(parsedFlare.color), rootUrl + parsedFlare.textureName, lensFlareSystem);
            }

            return lensFlareSystem;
        }

        public serialize(): any {
            var serializationObject: any = {};

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
                    textureName: Tools.GetFilename(flare.texture.name)
                });
            }

            return serializationObject;
        }
    }
} 
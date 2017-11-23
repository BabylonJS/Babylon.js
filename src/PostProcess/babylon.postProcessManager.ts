module BABYLON {
    export class PostProcessManager {
        private _scene: Scene;
        private _indexBuffer: Nullable<WebGLBuffer>;
        private _vertexBuffers: { [key: string]: Nullable<VertexBuffer> } = {};

        constructor(scene: Scene) {
            this._scene = scene;
        }

        private _prepareBuffers(): void {
            if (this._vertexBuffers[VertexBuffer.PositionKind]) {
                return;
            }

            // VBO
            var vertices = [];
            vertices.push(1, 1);
            vertices.push(-1, 1);
            vertices.push(-1, -1);
            vertices.push(1, -1);

            this._vertexBuffers[VertexBuffer.PositionKind] = new VertexBuffer(this._scene.getEngine(), vertices, VertexBuffer.PositionKind, false, false, 2);

            this._buildIndexBuffer();
        }

        private _buildIndexBuffer(): void {
            // Indices
            var indices = [];
            indices.push(0);
            indices.push(1);
            indices.push(2);

            indices.push(0);
            indices.push(2);
            indices.push(3);

            this._indexBuffer = this._scene.getEngine().createIndexBuffer(indices);
        }
        
        public _rebuild(): void {
            let vb = this._vertexBuffers[VertexBuffer.PositionKind];

            if (!vb) {
                return;
            }
            vb._rebuild();
            this._buildIndexBuffer();
        }
        
        // Methods
        public _prepareFrame(sourceTexture: Nullable<InternalTexture> = null, postProcesses: Nullable<PostProcess[]> = null): boolean {
            let camera = this._scene.activeCamera;
            if (!camera) {
                return false;
            }

            var postProcesses = postProcesses || (<Nullable<PostProcess[]>>camera._postProcesses);

            if (!postProcesses || postProcesses.length === 0 || !this._scene.postProcessesEnabled) {
                return false;
            }

            postProcesses[0].activate(camera, sourceTexture, postProcesses !== null && postProcesses !== undefined);
            return true;
        }

        public directRender(postProcesses: PostProcess[], targetTexture: Nullable<InternalTexture> = null, forceFullscreenViewport = false): void {
            if (!this._scene.activeCamera) {
                return;
            }

            var engine = this._scene.getEngine();

            for (var index = 0; index < postProcesses.length; index++) {
                if (index < postProcesses.length - 1) {
                    postProcesses[index + 1].activate(this._scene.activeCamera, targetTexture);
                } else {
                    if (targetTexture) {
                        engine.bindFramebuffer(targetTexture, 0, undefined, undefined, forceFullscreenViewport);
                    } else {
                        engine.restoreDefaultFramebuffer();
                    }
                }

                var pp = postProcesses[index];
                var effect = pp.apply();

                if (effect) {
                    pp.onBeforeRenderObservable.notifyObservers(effect);

                    // VBOs
                    this._prepareBuffers();
                    engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);

                    // Draw order
                    engine.draw(true, 0, 6);

                    pp.onAfterRenderObservable.notifyObservers(effect);
                }
            }

            // Restore depth buffer
            engine.setDepthBuffer(true);
            engine.setDepthWrite(true);
        }

        public _finalizeFrame(doNotPresent?: boolean, targetTexture?: InternalTexture, faceIndex?: number, postProcesses?: PostProcess[], forceFullscreenViewport = false): void {
            let camera = this._scene.activeCamera;

            if (!camera) {
                return;
            }

            postProcesses = postProcesses || camera._postProcesses;
            if (postProcesses.length === 0 || !this._scene.postProcessesEnabled) {
                return;
            }
            var engine = this._scene.getEngine();

            for (var index = 0, len = postProcesses.length; index < len; index++) {
                if (index < len - 1) {
                    postProcesses[index + 1].activate(camera, targetTexture);
                } else {
                    if (targetTexture) {
                        engine.bindFramebuffer(targetTexture, faceIndex, undefined, undefined, forceFullscreenViewport);
                    } else {
                        engine.restoreDefaultFramebuffer();
                    }
                }

                if (doNotPresent) {
                    break;
                }

                var pp = postProcesses[index];
                var effect = pp.apply();

                if (effect) {
                    pp.onBeforeRenderObservable.notifyObservers(effect);

                    // VBOs
                    this._prepareBuffers();
                    engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);

                    // Draw order
                    engine.draw(true, 0, 6);

                    pp.onAfterRenderObservable.notifyObservers(effect);
                }
            }

            // Restore states
            engine.setDepthBuffer(true);
            engine.setDepthWrite(true);
            engine.setAlphaMode(Engine.ALPHA_DISABLE);
        }

        public dispose(): void {
            var buffer = this._vertexBuffers[VertexBuffer.PositionKind];
            if (buffer) {
                buffer.dispose();
                this._vertexBuffers[VertexBuffer.PositionKind] = null;
            }

            if (this._indexBuffer) {
                this._scene.getEngine()._releaseBuffer(this._indexBuffer);
                this._indexBuffer = null;
            }
        }
    }
} 
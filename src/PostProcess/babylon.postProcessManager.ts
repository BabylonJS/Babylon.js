﻿module BABYLON {
    export class PostProcessManager {
        private _scene: Scene;
        private _indexBuffer: WebGLBuffer;
        private _vertexBuffers: { [key: string]: VertexBuffer } = {};

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

        // Methods
        public _prepareFrame(sourceTexture?: InternalTexture, postProcesses?: PostProcess[]): boolean {
            var postProcesses = postProcesses || this._scene.activeCamera._postProcesses;

            if (postProcesses.length === 0 || !this._scene.postProcessesEnabled) {
                return false;
            }

            postProcesses[0].activate(this._scene.activeCamera, sourceTexture, postProcesses !== null && postProcesses !== undefined);
            return true;
        }

        public directRender(postProcesses: PostProcess[], targetTexture?: InternalTexture, forceFullscreenViewport = false): void {
            var engine = this._scene.getEngine();

            for (var index = 0; index < postProcesses.length; index++) {
                if (index < postProcesses.length - 1) {
                    postProcesses[index + 1].activate(this._scene.activeCamera, targetTexture);
                } else {
                    if (targetTexture) {
                        engine.bindFramebuffer(targetTexture, 0, null, null, forceFullscreenViewport);
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

        public _finalizeFrame(doNotPresent?: boolean, targetTexture?: InternalTexture, faceIndex?: number, postProcesses?: PostProcess[]): void {
            postProcesses = postProcesses || this._scene.activeCamera._postProcesses;
            if (postProcesses.length === 0 || !this._scene.postProcessesEnabled) {
                return;
            }
            var engine = this._scene.getEngine();

            for (var index = 0, len = postProcesses.length; index < len; index++) {
                if (index < len - 1) {
                    postProcesses[index + 1].activate(this._scene.activeCamera, targetTexture);
                } else {
                    if (targetTexture) {
                        engine.bindFramebuffer(targetTexture, faceIndex);
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
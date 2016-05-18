module BABYLON {
    export class PostProcessManager {
        private _scene: Scene;
        private _indexBuffer: WebGLBuffer;
        private _vertexDeclaration = [2];
        private _vertexStrideSize = 2 * 4;
        private _vertexBuffer: WebGLBuffer;

        constructor(scene: Scene) {
            this._scene = scene;
        }

        private _prepareBuffers(): void {
            if (this._vertexBuffer) {
                return;
            }

            // VBO
            var vertices = [];
            vertices.push(1, 1);
            vertices.push(-1, 1);
            vertices.push(-1, -1);
            vertices.push(1, -1);
            this._vertexBuffer = this._scene.getEngine().createVertexBuffer(vertices);

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
        public _prepareFrame(sourceTexture?: WebGLTexture): boolean {
            var postProcesses = this._scene.activeCamera._postProcesses;

            if (postProcesses.length === 0 || !this._scene.postProcessesEnabled) {
                return false;
            }

            postProcesses[0].activate(this._scene.activeCamera, sourceTexture);
            return true;
        }

        public directRender(postProcesses: PostProcess[], targetTexture?: WebGLTexture): void {
            var engine = this._scene.getEngine();

            for (var index = 0; index < postProcesses.length; index++) {
                if (index < postProcesses.length - 1) {
                    postProcesses[index + 1].activate(this._scene.activeCamera, targetTexture);
                } else {
                    if (targetTexture) {
                        engine.bindFramebuffer(targetTexture);
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
                    engine.bindBuffers(this._vertexBuffer, this._indexBuffer, this._vertexDeclaration, this._vertexStrideSize, effect);

                    // Draw order
                    engine.draw(true, 0, 6);

                    pp.onAfterRenderObservable.notifyObservers(effect);                    
                }
            }

            // Restore depth buffer
            engine.setDepthBuffer(true);
            engine.setDepthWrite(true);
        }

        public _finalizeFrame(doNotPresent?: boolean, targetTexture?: WebGLTexture, faceIndex?: number, postProcesses?: PostProcess[]): void {
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
                    engine.bindBuffers(this._vertexBuffer, this._indexBuffer, this._vertexDeclaration, this._vertexStrideSize, effect);

                    // Draw order
                    engine.draw(true, 0, 6);

                    pp.onAfterRenderObservable.notifyObservers(effect);
                }
            }

            // Restore depth buffer
            engine.setDepthBuffer(true);
            engine.setDepthWrite(true);
        }

        public dispose(): void {
            if (this._vertexBuffer) {
                this._scene.getEngine()._releaseBuffer(this._vertexBuffer);
                this._vertexBuffer = null;
            }

            if (this._indexBuffer) {
                this._scene.getEngine()._releaseBuffer(this._indexBuffer);
                this._indexBuffer = null;
            }
        }
    }
} 
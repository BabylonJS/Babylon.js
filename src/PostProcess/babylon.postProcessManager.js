var BABYLON;
(function (BABYLON) {
    var PostProcessManager = (function () {
        function PostProcessManager(scene) {
            this._vertexDeclaration = [2];
            this._vertexStrideSize = 2 * 4;
            this._scene = scene;
        }
        PostProcessManager.prototype._prepareBuffers = function () {
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
        };
        // Methods
        PostProcessManager.prototype._prepareFrame = function (sourceTexture) {
            var postProcesses = this._scene.activeCamera._postProcesses;
            if (postProcesses.length === 0 || !this._scene.postProcessesEnabled) {
                return false;
            }
            postProcesses[0].activate(this._scene.activeCamera, sourceTexture);
            return true;
        };
        PostProcessManager.prototype.directRender = function (postProcesses, targetTexture) {
            var engine = this._scene.getEngine();
            for (var index = 0; index < postProcesses.length; index++) {
                if (index < postProcesses.length - 1) {
                    postProcesses[index + 1].activate(this._scene.activeCamera, targetTexture);
                }
                else {
                    if (targetTexture) {
                        engine.bindFramebuffer(targetTexture);
                    }
                    else {
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
        };
        PostProcessManager.prototype._finalizeFrame = function (doNotPresent, targetTexture, faceIndex, postProcesses) {
            postProcesses = postProcesses || this._scene.activeCamera._postProcesses;
            if (postProcesses.length === 0 || !this._scene.postProcessesEnabled) {
                return;
            }
            var engine = this._scene.getEngine();
            for (var index = 0, len = postProcesses.length; index < len; index++) {
                if (index < len - 1) {
                    postProcesses[index + 1].activate(this._scene.activeCamera, targetTexture);
                }
                else {
                    if (targetTexture) {
                        engine.bindFramebuffer(targetTexture, faceIndex);
                    }
                    else {
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
        };
        PostProcessManager.prototype.dispose = function () {
            if (this._vertexBuffer) {
                this._scene.getEngine()._releaseBuffer(this._vertexBuffer);
                this._vertexBuffer = null;
            }
            if (this._indexBuffer) {
                this._scene.getEngine()._releaseBuffer(this._indexBuffer);
                this._indexBuffer = null;
            }
        };
        return PostProcessManager;
    }());
    BABYLON.PostProcessManager = PostProcessManager;
})(BABYLON || (BABYLON = {}));

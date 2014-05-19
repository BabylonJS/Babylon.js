var BABYLON;
(function (BABYLON) {
    var PostProcessManager = (function () {
        function PostProcessManager(scene) {
            this._vertexDeclaration = [2];
            this._vertexStrideSize = 2 * 4;
            this._scene = scene;

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
        // Methods
        PostProcessManager.prototype._prepareFrame = function (sourceTexture) {
            var postProcesses = this._scene.activeCamera._postProcesses;
            var postProcessesTakenIndices = this._scene.activeCamera._postProcessesTakenIndices;

            if (postProcessesTakenIndices.length === 0 || !this._scene.postProcessesEnabled) {
                return false;
            }

            postProcesses[this._scene.activeCamera._postProcessesTakenIndices[0]].activate(this._scene.activeCamera, sourceTexture);

            return true;
        };

        PostProcessManager.prototype._finalizeFrame = function (doNotPresent, targetTexture) {
            var postProcesses = this._scene.activeCamera._postProcesses;
            var postProcessesTakenIndices = this._scene.activeCamera._postProcessesTakenIndices;
            if (postProcessesTakenIndices.length === 0 || !this._scene.postProcessesEnabled) {
                return;
            }

            var engine = this._scene.getEngine();

            for (var index = 0; index < postProcessesTakenIndices.length; index++) {
                if (index < postProcessesTakenIndices.length - 1) {
                    postProcesses[postProcessesTakenIndices[index + 1]].activate(this._scene.activeCamera);
                } else {
                    if (targetTexture) {
                        engine.bindFramebuffer(targetTexture);
                    } else {
                        engine.restoreDefaultFramebuffer();
                    }
                }

                if (doNotPresent) {
                    break;
                }

                var effect = postProcesses[postProcessesTakenIndices[index]].apply();

                if (effect) {
                    // VBOs
                    engine.bindBuffers(this._vertexBuffer, this._indexBuffer, this._vertexDeclaration, this._vertexStrideSize, effect);

                    // Draw order
                    engine.draw(true, 0, 6);
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
    })();
    BABYLON.PostProcessManager = PostProcessManager;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.postProcessManager.js.map

var BABYLON = BABYLON || {};

(function () {
    BABYLON.PostProcessManager = function (scene) {
        this.postProcesses = [];
        this._scene = scene;
        
        // VBO
        var vertices = [];
        vertices.push(1, 1);
        vertices.push(-1, 1);
        vertices.push(-1, -1);
        vertices.push(1, -1);
        this._vertexDeclaration = [2];
        this._vertexStrideSize = 2 * 4;
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
    };

    // Methods
    BABYLON.PostProcessManager.prototype._prepareFrame = function () {
        if (this.postProcesses.length === 0 || !this._scene.postProcessesEnabled) {
            return;
        }

        this.postProcesses[0].activate();
    };
    
    BABYLON.PostProcessManager.prototype._finalizeFrame = function () {
        if (this.postProcesses.length === 0 || !this._scene.postProcessesEnabled) {
            return;
        }

        var engine = this._scene.getEngine();
        
        for (var index = 0; index < this.postProcesses.length; index++) {            
            if (index < this.postProcesses.length - 1) {
                this.postProcesses[index + 1].activate();
            } else {
                engine.restoreDefaultFramebuffer();
            }

            var effect = this.postProcesses[index].apply();

            if (effect) {
                // VBOs
                engine.bindBuffers(this._vertexBuffer, this._indexBuffer, this._vertexDeclaration, this._vertexStrideSize, effect);

                // Draw order
                engine.draw(true, 0, 6);
            }
        }
    };

    BABYLON.PostProcessManager.prototype.dispose = function () {
        if (this._vertexBuffer) {
            this._scene.getEngine()._releaseBuffer(this._vertexBuffer);
            this._vertexBuffer = null;
        }

        if (this._indexBuffer) {
            this._scene.getEngine()._releaseBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        while (this.postProcesses.length) {
            this.postProcesses[0].dispose();
        }
    };
})();
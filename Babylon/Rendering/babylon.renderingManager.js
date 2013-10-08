var BABYLON = BABYLON || {};

(function () {
    BABYLON.RenderingManager = function (scene) {
        this._scene = scene;
        this._renderingGroups = [];
    };

    // Methods
    BABYLON.RenderingManager.prototype._renderParticles = function (index, activeMeshes) {
        // Particles
        var beforeParticlesDate = new Date();
        for (var particleIndex = 0; particleIndex < this._scene._activeParticleSystems.length; particleIndex++) {
            var particleSystem = this._scene._activeParticleSystems.data[particleIndex];

            if (particleSystem.renderingGroupId !== index) {
                continue;
            }

            if (!particleSystem.emitter.position || !activeMeshes || activeMeshes.indexOf(particleSystem.emitter) !== -1) {
                this._scene._activeParticles += particleSystem.render();
            }
        }
        this._scene._particlesDuration += new Date() - beforeParticlesDate;
    };

    BABYLON.RenderingManager.prototype.render = function (customRenderFunction, beforeTransparents, activeMeshes, renderParticles) {
        for (var index = 0 ; index < BABYLON.RenderingManager.MAX_RENDERINGGROUPS; index++) {
            var renderingGroup = this._renderingGroups[index];
            if (index > 0) {
                this._scene.getEngine().clear(0, false, true);
            }

            if (renderingGroup && !renderingGroup.render(customRenderFunction, index == 0 ? beforeTransparents  : null)) {
                this._renderingGroups.splice(index, 1);
            }

            if (renderParticles) {
                this._renderParticles(index, activeMeshes);
            }
        }
    };

    BABYLON.RenderingManager.prototype.reset = function () {
        for (var index in this._renderingGroups) {
            var renderingGroup = this._renderingGroups[index];
            renderingGroup.prepare();
        }
    };

    BABYLON.RenderingManager.prototype.dispatch = function (subMesh) {
        var mesh = subMesh.getMesh();
        var renderingGroupId = mesh.renderingGroupId || 0;

        if (!this._renderingGroups[renderingGroupId]) {
            this._renderingGroups[renderingGroupId] = new BABYLON.RenderingGroup(renderingGroupId, this._scene);
        }

        this._renderingGroups[renderingGroupId].dispatch(subMesh);
    };
    
    // Statics
    BABYLON.RenderingManager.MAX_RENDERINGGROUPS = 4;
})();
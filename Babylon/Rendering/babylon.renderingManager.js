var BABYLON;
(function (BABYLON) {
    var RenderingManager = (function () {
        function RenderingManager(scene) {
            this._renderingGroups = new Array();
            this._scene = scene;
        }
        RenderingManager.prototype._renderParticles = function (index, activeMeshes) {
            if (this._scene._activeParticleSystems.length === 0) {
                return;
            }

            // Particles
            var beforeParticlesDate = new Date().getTime();
            for (var particleIndex = 0; particleIndex < this._scene._activeParticleSystems.length; particleIndex++) {
                var particleSystem = this._scene._activeParticleSystems.data[particleIndex];

                if (particleSystem.renderingGroupId !== index) {
                    continue;
                }

                this._clearDepthBuffer();

                if (!particleSystem.emitter.position || !activeMeshes || activeMeshes.indexOf(particleSystem.emitter) !== -1) {
                    this._scene._activeParticles += particleSystem.render();
                }
            }
            this._scene._particlesDuration += new Date().getTime() - beforeParticlesDate;
        };

        RenderingManager.prototype._renderSprites = function (index) {
            if (this._scene.spriteManagers.length === 0) {
                return;
            }

            // Sprites
            var beforeSpritessDate = new Date().getTime();
            for (var id = 0; id < this._scene.spriteManagers.length; id++) {
                var spriteManager = this._scene.spriteManagers[id];

                if (spriteManager.renderingGroupId === index) {
                    this._clearDepthBuffer();
                    spriteManager.render();
                }
            }
            this._scene._spritesDuration += new Date().getTime() - beforeSpritessDate;
        };

        RenderingManager.prototype._clearDepthBuffer = function () {
            if (this._depthBufferAlreadyCleaned) {
                return;
            }

            this._scene.getEngine().clear(0, false, true);
            this._depthBufferAlreadyCleaned = true;
        };

        RenderingManager.prototype.render = function (customRenderFunction, activeMeshes, renderParticles, renderSprites) {
            var _this = this;
            for (var index = 0; index < BABYLON.RenderingManager.MAX_RENDERINGGROUPS; index++) {
                this._depthBufferAlreadyCleaned = false;
                var renderingGroup = this._renderingGroups[index];

                if (renderingGroup) {
                    this._clearDepthBuffer();
                    if (!renderingGroup.render(customRenderFunction, function () {
                        if (renderSprites) {
                            _this._renderSprites(index);
                        }
                    })) {
                        this._renderingGroups.splice(index, 1);
                    }
                } else if (renderSprites) {
                    this._renderSprites(index);
                }

                if (renderParticles) {
                    this._renderParticles(index, activeMeshes);
                }
            }
        };

        RenderingManager.prototype.reset = function () {
            for (var index in this._renderingGroups) {
                var renderingGroup = this._renderingGroups[index];
                renderingGroup.prepare();
            }
        };

        RenderingManager.prototype.dispatch = function (subMesh) {
            var mesh = subMesh.getMesh();
            var renderingGroupId = mesh.renderingGroupId || 0;

            if (!this._renderingGroups[renderingGroupId]) {
                this._renderingGroups[renderingGroupId] = new BABYLON.RenderingGroup(renderingGroupId, this._scene);
            }

            this._renderingGroups[renderingGroupId].dispatch(subMesh);
        };
        RenderingManager.MAX_RENDERINGGROUPS = 4;
        return RenderingManager;
    })();
    BABYLON.RenderingManager = RenderingManager;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.renderingManager.js.map

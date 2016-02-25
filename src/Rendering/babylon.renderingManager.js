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
            var activeCamera = this._scene.activeCamera;
            var beforeParticlesDate = BABYLON.Tools.Now;
            for (var particleIndex = 0; particleIndex < this._scene._activeParticleSystems.length; particleIndex++) {
                var particleSystem = this._scene._activeParticleSystems.data[particleIndex];
                if (particleSystem.renderingGroupId !== index) {
                    continue;
                }
                if ((activeCamera.layerMask & particleSystem.layerMask) === 0) {
                    continue;
                }
                this._clearDepthBuffer();
                if (!particleSystem.emitter.position || !activeMeshes || activeMeshes.indexOf(particleSystem.emitter) !== -1) {
                    this._scene._activeParticles += particleSystem.render();
                }
            }
            this._scene._particlesDuration += BABYLON.Tools.Now - beforeParticlesDate;
        };
        RenderingManager.prototype._renderSprites = function (index) {
            if (!this._scene.spritesEnabled || this._scene.spriteManagers.length === 0) {
                return;
            }
            // Sprites       
            var activeCamera = this._scene.activeCamera;
            var beforeSpritessDate = BABYLON.Tools.Now;
            for (var id = 0; id < this._scene.spriteManagers.length; id++) {
                var spriteManager = this._scene.spriteManagers[id];
                if (spriteManager.renderingGroupId === index && ((activeCamera.layerMask & spriteManager.layerMask) !== 0)) {
                    this._clearDepthBuffer();
                    spriteManager.render();
                }
            }
            this._scene._spritesDuration += BABYLON.Tools.Now - beforeSpritessDate;
        };
        RenderingManager.prototype._clearDepthBuffer = function () {
            if (this._depthBufferAlreadyCleaned) {
                return;
            }
            this._scene.getEngine().clear(0, false, true);
            this._depthBufferAlreadyCleaned = true;
        };
        RenderingManager.prototype._renderSpritesAndParticles = function () {
            if (this._currentRenderSprites) {
                this._renderSprites(this._currentIndex);
            }
            if (this._currentRenderParticles) {
                this._renderParticles(this._currentIndex, this._currentActiveMeshes);
            }
        };
        RenderingManager.prototype.render = function (customRenderFunction, activeMeshes, renderParticles, renderSprites) {
            this._currentActiveMeshes = activeMeshes;
            this._currentRenderParticles = renderParticles;
            this._currentRenderSprites = renderSprites;
            for (var index = 0; index < RenderingManager.MAX_RENDERINGGROUPS; index++) {
                this._depthBufferAlreadyCleaned = index == 0;
                var renderingGroup = this._renderingGroups[index];
                var needToStepBack = false;
                this._currentIndex = index;
                if (renderingGroup) {
                    this._clearDepthBuffer();
                    if (!renderingGroup.onBeforeTransparentRendering) {
                        renderingGroup.onBeforeTransparentRendering = this._renderSpritesAndParticles.bind(this);
                    }
                    if (!renderingGroup.render(customRenderFunction)) {
                        this._renderingGroups.splice(index, 1);
                        needToStepBack = true;
                        this._renderSpritesAndParticles();
                    }
                }
                else {
                    this._renderSpritesAndParticles();
                }
                if (needToStepBack) {
                    index--;
                }
            }
        };
        RenderingManager.prototype.reset = function () {
            this._renderingGroups.forEach(function (renderingGroup, index, array) {
                if (renderingGroup) {
                    renderingGroup.prepare();
                }
            });
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

var BABYLON;
(function (BABYLON) {
    var RenderingManager = (function () {
        function RenderingManager(scene) {
            this._renderingGroups = new Array();
            this._autoClearDepthStencil = {};
            this._customOpaqueSortCompareFn = {};
            this._customAlphaTestSortCompareFn = {};
            this._customTransparentSortCompareFn = {};
            this._scene = scene;
            for (var i = RenderingManager.MIN_RENDERINGGROUPS; i < RenderingManager.MAX_RENDERINGGROUPS; i++) {
                this._autoClearDepthStencil[i] = true;
            }
        }
        RenderingManager.prototype._renderParticles = function (index, activeMeshes) {
            if (this._scene._activeParticleSystems.length === 0) {
                return;
            }
            // Particles
            var activeCamera = this._scene.activeCamera;
            this._scene._particlesDuration.beginMonitoring();
            for (var particleIndex = 0; particleIndex < this._scene._activeParticleSystems.length; particleIndex++) {
                var particleSystem = this._scene._activeParticleSystems.data[particleIndex];
                if (particleSystem.renderingGroupId !== index) {
                    continue;
                }
                if ((activeCamera.layerMask & particleSystem.layerMask) === 0) {
                    continue;
                }
                this._clearDepthStencilBuffer();
                if (!particleSystem.emitter.position || !activeMeshes || activeMeshes.indexOf(particleSystem.emitter) !== -1) {
                    this._scene._activeParticles.addCount(particleSystem.render(), false);
                }
            }
            this._scene._particlesDuration.endMonitoring(false);
        };
        RenderingManager.prototype._renderSprites = function (index) {
            if (!this._scene.spritesEnabled || this._scene.spriteManagers.length === 0) {
                return;
            }
            // Sprites       
            var activeCamera = this._scene.activeCamera;
            this._scene._spritesDuration.beginMonitoring();
            for (var id = 0; id < this._scene.spriteManagers.length; id++) {
                var spriteManager = this._scene.spriteManagers[id];
                if (spriteManager.renderingGroupId === index && ((activeCamera.layerMask & spriteManager.layerMask) !== 0)) {
                    this._clearDepthStencilBuffer();
                    spriteManager.render();
                }
            }
            this._scene._spritesDuration.endMonitoring(false);
        };
        RenderingManager.prototype._clearDepthStencilBuffer = function () {
            if (this._depthStencilBufferAlreadyCleaned) {
                return;
            }
            this._scene.getEngine().clear(0, false, true, true);
            this._depthStencilBufferAlreadyCleaned = true;
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
            for (var index = RenderingManager.MIN_RENDERINGGROUPS; index < RenderingManager.MAX_RENDERINGGROUPS; index++) {
                this._depthStencilBufferAlreadyCleaned = index === RenderingManager.MIN_RENDERINGGROUPS;
                var renderingGroup = this._renderingGroups[index];
                var needToStepBack = false;
                this._currentIndex = index;
                if (renderingGroup) {
                    if (this._autoClearDepthStencil[index]) {
                        this._clearDepthStencilBuffer();
                    }
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
            for (var index = RenderingManager.MIN_RENDERINGGROUPS; index < RenderingManager.MAX_RENDERINGGROUPS; index++) {
                var renderingGroup = this._renderingGroups[index];
                if (renderingGroup) {
                    renderingGroup.prepare();
                }
            }
        };
        RenderingManager.prototype.dispatch = function (subMesh) {
            var mesh = subMesh.getMesh();
            var renderingGroupId = mesh.renderingGroupId || 0;
            if (!this._renderingGroups[renderingGroupId]) {
                this._renderingGroups[renderingGroupId] = new BABYLON.RenderingGroup(renderingGroupId, this._scene, this._customOpaqueSortCompareFn[renderingGroupId], this._customAlphaTestSortCompareFn[renderingGroupId], this._customTransparentSortCompareFn[renderingGroupId]);
            }
            this._renderingGroups[renderingGroupId].dispatch(subMesh);
        };
        /**
         * Overrides the default sort function applied in the renderging group to prepare the meshes.
         * This allowed control for front to back rendering or reversly depending of the special needs.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
         * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
         * @param transparentSortCompareFn The transparent queue comparison function use to sort.
         */
        RenderingManager.prototype.setRenderingOrder = function (renderingGroupId, opaqueSortCompareFn, alphaTestSortCompareFn, transparentSortCompareFn) {
            if (opaqueSortCompareFn === void 0) { opaqueSortCompareFn = null; }
            if (alphaTestSortCompareFn === void 0) { alphaTestSortCompareFn = null; }
            if (transparentSortCompareFn === void 0) { transparentSortCompareFn = null; }
            if (this._renderingGroups[renderingGroupId]) {
                var group = this._renderingGroups[renderingGroupId];
                group.opaqueSortCompareFn = this._customOpaqueSortCompareFn[renderingGroupId];
                group.alphaTestSortCompareFn = this._customAlphaTestSortCompareFn[renderingGroupId];
                group.transparentSortCompareFn = this._customTransparentSortCompareFn[renderingGroupId];
            }
            this._customOpaqueSortCompareFn[renderingGroupId] = opaqueSortCompareFn;
            this._customAlphaTestSortCompareFn[renderingGroupId] = alphaTestSortCompareFn;
            this._customTransparentSortCompareFn[renderingGroupId] = transparentSortCompareFn;
        };
        /**
         * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
         */
        RenderingManager.prototype.setRenderingAutoClearDepthStencil = function (renderingGroupId, autoClearDepthStencil) {
            this._autoClearDepthStencil[renderingGroupId] = autoClearDepthStencil;
        };
        /**
         * The max id used for rendering groups (not included)
         */
        RenderingManager.MAX_RENDERINGGROUPS = 4;
        /**
         * The min id used for rendering groups (included)
         */
        RenderingManager.MIN_RENDERINGGROUPS = 0;
        return RenderingManager;
    }());
    BABYLON.RenderingManager = RenderingManager;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.renderingManager.js.map
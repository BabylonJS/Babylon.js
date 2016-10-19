module BABYLON {
    export class RenderingManager {
        /**
         * The max id used for rendering groups (not included)
         */
        public static MAX_RENDERINGGROUPS = 4;

        /**
         * The min id used for rendering groups (included)
         */
        public static MIN_RENDERINGGROUPS = 0;

        private _scene: Scene;
        private _renderingGroups = new Array<RenderingGroup>();
        private _depthStencilBufferAlreadyCleaned: boolean;

        private _currentIndex: number;
        private _currentActiveMeshes: AbstractMesh[];
        private _currentRenderParticles: boolean;
        private _currentRenderSprites: boolean;

        private _autoClearDepthStencil: { [id:number]: boolean } = {};
        private _customOpaqueSortCompareFn: { [id:number]: (a: SubMesh, b: SubMesh) => number } = {};
        private _customAlphaTestSortCompareFn: { [id:number]: (a: SubMesh, b: SubMesh) => number } = {};
        private _customTransparentSortCompareFn: { [id:number]: (a: SubMesh, b: SubMesh) => number } = {};
        private _renderinGroupInfo: RenderingGroupInfo = null;

        constructor(scene: Scene) {
            this._scene = scene;

            for (let i = RenderingManager.MIN_RENDERINGGROUPS; i < RenderingManager.MAX_RENDERINGGROUPS; i++) {
                this._autoClearDepthStencil[i] = true;
            }
        }

        private _renderParticles(index: number, activeMeshes: AbstractMesh[]): void {
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
        }

        private _renderSprites(index: number): void {
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
        }

        private _clearDepthStencilBuffer(): void {
            if (this._depthStencilBufferAlreadyCleaned) {
                return;
            }

            this._scene.getEngine().clear(0, false, true, true);
            this._depthStencilBufferAlreadyCleaned = true;
        }

        private _renderSpritesAndParticles() {
            if (this._currentRenderSprites) {
                this._renderSprites(this._currentIndex);
            }

            if (this._currentRenderParticles) {
                this._renderParticles(this._currentIndex, this._currentActiveMeshes);
            }
        }

        public render(customRenderFunction: (opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>) => void,
            activeMeshes: AbstractMesh[], renderParticles: boolean, renderSprites: boolean): void {

            // Check if there's at least on observer on the onRenderingGroupObservable and initialize things to fire it
            let observable = this._scene.onRenderingGroupObservable.hasObservers() ? this._scene.onRenderingGroupObservable : null;
            let info: RenderingGroupInfo = null;
            if (observable) {
                if (!this._renderinGroupInfo) {
                    this._renderinGroupInfo = new RenderingGroupInfo();
                }
                info = this._renderinGroupInfo;
                info.scene = this._scene;
                info.camera = this._scene.activeCamera;
            }

            this._currentActiveMeshes = activeMeshes;
            this._currentRenderParticles = renderParticles;
            this._currentRenderSprites = renderSprites;

            for (var index = RenderingManager.MIN_RENDERINGGROUPS; index < RenderingManager.MAX_RENDERINGGROUPS; index++) {
                this._depthStencilBufferAlreadyCleaned = index === RenderingManager.MIN_RENDERINGGROUPS;
                var renderingGroup = this._renderingGroups[index];
                var needToStepBack = false;

                this._currentIndex = index;

                if (renderingGroup) {
                    let renderingGroupMask = 0;

                    // Fire PRECLEAR stage
                    if (observable) {
                        renderingGroupMask = Math.pow(2, index);
                        info.renderStage = RenderingGroupInfo.STAGE_PRECLEAR;
                        info.renderingGroupId = index;
                        observable.notifyObservers(info, renderingGroupMask);
                    }

                    // Clear depth/stencil if needed
                    if (this._autoClearDepthStencil[index]) {
                        this._clearDepthStencilBuffer();
                    }

                    // Fire PREOPAQUE stage
                    if (observable) {
                        info.renderStage = RenderingGroupInfo.STAGE_PREOPAQUE;
                        observable.notifyObservers(info, renderingGroupMask);
                    }

                    if (!renderingGroup.onBeforeTransparentRendering) {
                        renderingGroup.onBeforeTransparentRendering = this._renderSpritesAndParticles.bind(this);
                    }

                    // Fire PRETRANSPARENT stage
                    if (observable) {
                        info.renderStage = RenderingGroupInfo.STAGE_PRETRANSPARENT;
                        observable.notifyObservers(info, renderingGroupMask);
                    }

                    if (!renderingGroup.render(customRenderFunction)) {
                        this._renderingGroups.splice(index, 1);
                        needToStepBack = true;
                        this._renderSpritesAndParticles();
                    }

                    // Fire POSTTRANSPARENT stage
                    if (observable) {
                        info.renderStage = RenderingGroupInfo.STAGE_POSTTRANSPARENT;
                        observable.notifyObservers(info, renderingGroupMask);
                    }
                } else {
                    this._renderSpritesAndParticles();
                }

                if (needToStepBack) {
                    index--;
                }
            }
        }

        public reset(): void {
            for (var index = RenderingManager.MIN_RENDERINGGROUPS; index < RenderingManager.MAX_RENDERINGGROUPS; index++) {
                var renderingGroup = this._renderingGroups[index];
                if (renderingGroup) {
                    renderingGroup.prepare();
                }
            }
        }

        public dispatch(subMesh: SubMesh): void {
            var mesh = subMesh.getMesh();
            var renderingGroupId = mesh.renderingGroupId || 0;

            if (!this._renderingGroups[renderingGroupId]) {
                this._renderingGroups[renderingGroupId] = new RenderingGroup(renderingGroupId, this._scene,
                    this._customOpaqueSortCompareFn[renderingGroupId],
                    this._customAlphaTestSortCompareFn[renderingGroupId],
                    this._customTransparentSortCompareFn[renderingGroupId]
                );
            }

            this._renderingGroups[renderingGroupId].dispatch(subMesh);
        }

        /**
         * Overrides the default sort function applied in the renderging group to prepare the meshes.
         * This allowed control for front to back rendering or reversly depending of the special needs.
         * 
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
         * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
         * @param transparentSortCompareFn The transparent queue comparison function use to sort.
         */
        public setRenderingOrder(renderingGroupId: number,
            opaqueSortCompareFn: (a: SubMesh, b: SubMesh) => number = null,
            alphaTestSortCompareFn: (a: SubMesh, b: SubMesh) => number = null,
            transparentSortCompareFn: (a: SubMesh, b: SubMesh) => number = null) {

            this._customOpaqueSortCompareFn[renderingGroupId] = opaqueSortCompareFn;
            this._customAlphaTestSortCompareFn[renderingGroupId] = alphaTestSortCompareFn;
            this._customTransparentSortCompareFn[renderingGroupId] = transparentSortCompareFn;
                
            if (this._renderingGroups[renderingGroupId]) {
                var group = this._renderingGroups[renderingGroupId];
                group.opaqueSortCompareFn = this._customOpaqueSortCompareFn[renderingGroupId];
                group.alphaTestSortCompareFn = this._customAlphaTestSortCompareFn[renderingGroupId];
                group.transparentSortCompareFn = this._customTransparentSortCompareFn[renderingGroupId];
            }
        }

        /**
         * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
         * 
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
         */
        public setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean): void {            
            this._autoClearDepthStencil[renderingGroupId] = autoClearDepthStencil;
        }
    }
} 

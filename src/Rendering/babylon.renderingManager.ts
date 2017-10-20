module BABYLON {

    /**
     * Interface describing the different options available in the rendering manager
     * regarding Auto Clear between groups.
     */
    interface RenderingManageAutoClearOptions {
        autoClear: boolean;
        depth: boolean;
        stencil: boolean;
    }

    export class RenderingManager {
        /**
         * The max id used for rendering groups (not included)
         */
        public static MAX_RENDERINGGROUPS = 4;

        /**
         * The min id used for rendering groups (included)
         */
        public static MIN_RENDERINGGROUPS = 0;

        /**
         * Used to globally prevent autoclearing scenes.
         */
        public static AUTOCLEAR = true;

        private _scene: Scene;
        private _renderingGroups = new Array<RenderingGroup>();
        private _depthStencilBufferAlreadyCleaned: boolean;

        private _currentIndex: number;

        private _autoClearDepthStencil: { [id:number]: RenderingManageAutoClearOptions } = {};
        private _customOpaqueSortCompareFn: { [id:number]: Nullable<(a: SubMesh, b: SubMesh) => number> } = {};
        private _customAlphaTestSortCompareFn: { [id:number]: Nullable<(a: SubMesh, b: SubMesh) => number> } = {};
        private _customTransparentSortCompareFn: { [id:number]: Nullable<(a: SubMesh, b: SubMesh) => number> } = {};
        private _renderinGroupInfo: Nullable<RenderingGroupInfo> = null;

        constructor(scene: Scene) {
            this._scene = scene;

            for (let i = RenderingManager.MIN_RENDERINGGROUPS; i < RenderingManager.MAX_RENDERINGGROUPS; i++) {
                this._autoClearDepthStencil[i] = { autoClear: true, depth:true, stencil: true };
            }
        }        

        private _clearDepthStencilBuffer(depth = true, stencil = true): void {
            if (this._depthStencilBufferAlreadyCleaned) {
                return;
            }

            this._scene.getEngine().clear(null, false, depth, stencil);
            this._depthStencilBufferAlreadyCleaned = true;
        }

        public render(customRenderFunction: Nullable<(opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>) => void>,
            activeMeshes: Nullable<AbstractMesh[]>, renderParticles: boolean, renderSprites: boolean): void {          
                  
            // Check if there's at least on observer on the onRenderingGroupObservable and initialize things to fire it
            let observable = this._scene.onRenderingGroupObservable.hasObservers() ? this._scene.onRenderingGroupObservable : null;
            let info: Nullable<RenderingGroupInfo> = null;
            if (observable) {
                if (!this._renderinGroupInfo) {
                    this._renderinGroupInfo = new RenderingGroupInfo();
                }
                info = this._renderinGroupInfo;
                info.scene = this._scene;
                info.camera = this._scene.activeCamera;
            }

            // Dispatch sprites
            if (renderSprites) {
                for (let index = 0; index < this._scene.spriteManagers.length; index++) {
                    var manager = this._scene.spriteManagers[index];
                    this.dispatchSprites(manager);
                }
            }

            // Render
            for (let index = RenderingManager.MIN_RENDERINGGROUPS; index < RenderingManager.MAX_RENDERINGGROUPS; index++) {
                this._depthStencilBufferAlreadyCleaned = index === RenderingManager.MIN_RENDERINGGROUPS;
                var renderingGroup = this._renderingGroups[index];
                if(!renderingGroup && !observable)
                    continue;

                this._currentIndex = index;

                let renderingGroupMask = 0;

                // Fire PRECLEAR stage
                if (observable && info) {
                    renderingGroupMask = Math.pow(2, index);
                    info.renderStage = RenderingGroupInfo.STAGE_PRECLEAR;
                    info.renderingGroupId = index;
                    observable.notifyObservers(info, renderingGroupMask);
                }

                // Clear depth/stencil if needed
                if (RenderingManager.AUTOCLEAR) {
                    let autoClear = this._autoClearDepthStencil[index];
                    if (autoClear && autoClear.autoClear) {
                        this._clearDepthStencilBuffer(autoClear.depth, autoClear.stencil);
                    }
                }

                if (observable && info) {
                    // Fire PREOPAQUE stage
                    info.renderStage = RenderingGroupInfo.STAGE_PREOPAQUE;
                    observable.notifyObservers(info, renderingGroupMask);
                    // Fire PRETRANSPARENT stage
                    info.renderStage = RenderingGroupInfo.STAGE_PRETRANSPARENT;
                    observable.notifyObservers(info, renderingGroupMask);
                }

                if (renderingGroup)
                    renderingGroup.render(customRenderFunction, renderSprites, renderParticles, activeMeshes);

                // Fire POSTTRANSPARENT stage
                if (observable && info) {
                    info.renderStage = RenderingGroupInfo.STAGE_POSTTRANSPARENT;
                    observable.notifyObservers(info, renderingGroupMask);
                }
            }
        }

        public reset(): void {
            for (let index = RenderingManager.MIN_RENDERINGGROUPS; index < RenderingManager.MAX_RENDERINGGROUPS; index++) {
                var renderingGroup = this._renderingGroups[index];
                if (renderingGroup) {
                    renderingGroup.prepare();
                }
            }
        }

        public dispose(): void {
            for (let index = RenderingManager.MIN_RENDERINGGROUPS; index < RenderingManager.MAX_RENDERINGGROUPS; index++) {
                var renderingGroup = this._renderingGroups[index];
                if (renderingGroup) {
                    renderingGroup.dispose();
                }
            }

            this._renderingGroups.length = 0;
        }

        private _prepareRenderingGroup(renderingGroupId: number): void {
            if (!this._renderingGroups[renderingGroupId]) {
                this._renderingGroups[renderingGroupId] = new RenderingGroup(renderingGroupId, this._scene,
                    this._customOpaqueSortCompareFn[renderingGroupId],
                    this._customAlphaTestSortCompareFn[renderingGroupId],
                    this._customTransparentSortCompareFn[renderingGroupId]
                );
            }
        }

        public dispatchSprites(spriteManager: SpriteManager) {
            var renderingGroupId = spriteManager.renderingGroupId || 0;

            this._prepareRenderingGroup(renderingGroupId);

            this._renderingGroups[renderingGroupId].dispatchSprites(spriteManager);
        }

        public dispatchParticles(particleSystem: IParticleSystem) {
            var renderingGroupId = particleSystem.renderingGroupId || 0;

            this._prepareRenderingGroup(renderingGroupId);

            this._renderingGroups[renderingGroupId].dispatchParticles(particleSystem);
        }

        public dispatch(subMesh: SubMesh): void {
            var mesh = subMesh.getMesh();
            var renderingGroupId = mesh.renderingGroupId || 0;

            this._prepareRenderingGroup(renderingGroupId);

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
            opaqueSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null,
            alphaTestSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null,
            transparentSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null) {

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
         * @param depth Automatically clears depth between groups if true and autoClear is true.
         * @param stencil Automatically clears stencil between groups if true and autoClear is true.
         */
        public setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean,
            depth = true,
            stencil = true): void {            
            this._autoClearDepthStencil[renderingGroupId] = { 
                autoClear: autoClearDepthStencil,
                depth: depth,
                stencil: stencil
            };
        }
    }
} 

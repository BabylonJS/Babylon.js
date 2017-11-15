module BABYLON {
    export class RenderingGroup {
        private _scene: Scene;
        private _opaqueSubMeshes = new SmartArray<SubMesh>(256);
        private _transparentSubMeshes = new SmartArray<SubMesh>(256);
        private _alphaTestSubMeshes = new SmartArray<SubMesh>(256);
        private _depthOnlySubMeshes = new SmartArray<SubMesh>(256);
        private _particleSystems = new SmartArray<IParticleSystem>(256);
        private _spriteManagers = new SmartArray<SpriteManager>(256);        

        private _opaqueSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number>;
        private _alphaTestSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number>;
        private _transparentSortCompareFn: (a: SubMesh, b: SubMesh) => number;
        
        private _renderOpaque: (subMeshes: SmartArray<SubMesh>) => void;
        private _renderAlphaTest: (subMeshes: SmartArray<SubMesh>) => void;
        private _renderTransparent: (subMeshes: SmartArray<SubMesh>) => void;

        private _edgesRenderers = new SmartArray<EdgesRenderer>(16);

        public onBeforeTransparentRendering: () => void;

        /**
         * Set the opaque sort comparison function.
         * If null the sub meshes will be render in the order they were created 
         */
        public set opaqueSortCompareFn(value: Nullable<(a: SubMesh, b: SubMesh) => number>) {
            this._opaqueSortCompareFn = value;
            if (value) {
                this._renderOpaque = this.renderOpaqueSorted;
            }
            else {
                this._renderOpaque = RenderingGroup.renderUnsorted;
            }
        }

        /**
         * Set the alpha test sort comparison function.
         * If null the sub meshes will be render in the order they were created 
         */
        public set alphaTestSortCompareFn(value: Nullable<(a: SubMesh, b: SubMesh) => number>) {
            this._alphaTestSortCompareFn = value;
            if (value) {
                this._renderAlphaTest = this.renderAlphaTestSorted;
            }
            else {
                this._renderAlphaTest = RenderingGroup.renderUnsorted;
            }
        }

        /**
         * Set the transparent sort comparison function.
         * If null the sub meshes will be render in the order they were created 
         */
        public set transparentSortCompareFn(value: Nullable<(a: SubMesh, b: SubMesh) => number>) {
            if (value) {
                this._transparentSortCompareFn = value;
            }
            else {
                this._transparentSortCompareFn = RenderingGroup.defaultTransparentSortCompare;
            }
            this._renderTransparent = this.renderTransparentSorted;
        }

        /**
         * Creates a new rendering group.
         * @param index The rendering group index
         * @param opaqueSortCompareFn The opaque sort comparison function. If null no order is applied
         * @param alphaTestSortCompareFn The alpha test sort comparison function. If null no order is applied
         * @param transparentSortCompareFn The transparent sort comparison function. If null back to front + alpha index sort is applied
         */
        constructor(public index: number, scene: Scene,
            opaqueSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null,
            alphaTestSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null,
            transparentSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null) {
            this._scene = scene;

            this.opaqueSortCompareFn = opaqueSortCompareFn;
            this.alphaTestSortCompareFn = alphaTestSortCompareFn;
            this.transparentSortCompareFn = transparentSortCompareFn;            
        }

        /**
         * Render all the sub meshes contained in the group.
         * @param customRenderFunction Used to override the default render behaviour of the group.
         * @returns true if rendered some submeshes.
         */
        public render(customRenderFunction: Nullable<(opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>) => void>, renderSprites: boolean, renderParticles: boolean, activeMeshes: Nullable<AbstractMesh[]>): void {
            if (customRenderFunction) {
                customRenderFunction(this._opaqueSubMeshes, this._alphaTestSubMeshes, this._transparentSubMeshes, this._depthOnlySubMeshes);
                return;
            }

            var engine = this._scene.getEngine();

            // Depth only
            if (this._depthOnlySubMeshes.length !== 0) {
                engine.setAlphaTesting(true);
                engine.setColorWrite(false);
                this._renderAlphaTest(this._depthOnlySubMeshes);
                engine.setAlphaTesting(false);
                engine.setColorWrite(true);
            }            
            
            // Opaque
            if (this._opaqueSubMeshes.length !== 0) {
                this._renderOpaque(this._opaqueSubMeshes);
            }

            // Alpha test
            if (this._alphaTestSubMeshes.length !== 0) {
                engine.setAlphaTesting(true);
                this._renderAlphaTest(this._alphaTestSubMeshes);
                engine.setAlphaTesting(false);
            }

            var stencilState = engine.getStencilBuffer();
            engine.setStencilBuffer(false);

            // Sprites
            if (renderSprites) {
                this._renderSprites();
            }
            
            // Particles
            if (renderParticles) {
                this._renderParticles(activeMeshes);
            }

            if (this.onBeforeTransparentRendering) {
                this.onBeforeTransparentRendering();
            }

            // Transparent
            if (this._transparentSubMeshes.length !== 0) {
                this._renderTransparent(this._transparentSubMeshes);
                engine.setAlphaMode(Engine.ALPHA_DISABLE);
            }

            // Set back stencil to false in case it changes before the edge renderer.
            engine.setStencilBuffer(false);

            // Edges
            for (var edgesRendererIndex = 0; edgesRendererIndex < this._edgesRenderers.length; edgesRendererIndex++) {
                this._edgesRenderers.data[edgesRendererIndex].render();
            }

            // Restore Stencil state.
            engine.setStencilBuffer(stencilState);
        }

        /**
         * Renders the opaque submeshes in the order from the opaqueSortCompareFn.
         * @param subMeshes The submeshes to render
         */
        private renderOpaqueSorted(subMeshes: SmartArray<SubMesh>): void {
            return RenderingGroup.renderSorted(subMeshes, this._opaqueSortCompareFn, this._scene.activeCamera, false);
        }

        /**
         * Renders the opaque submeshes in the order from the alphatestSortCompareFn.
         * @param subMeshes The submeshes to render
         */
        private renderAlphaTestSorted(subMeshes: SmartArray<SubMesh>): void {
            return RenderingGroup.renderSorted(subMeshes, this._alphaTestSortCompareFn, this._scene.activeCamera, false);
        }

        /**
         * Renders the opaque submeshes in the order from the transparentSortCompareFn.
         * @param subMeshes The submeshes to render
         */
        private renderTransparentSorted(subMeshes: SmartArray<SubMesh>): void {
            return RenderingGroup.renderSorted(subMeshes, this._transparentSortCompareFn, this._scene.activeCamera, true);
        }

        /**
         * Renders the submeshes in a specified order.
         * @param subMeshes The submeshes to sort before render
         * @param sortCompareFn The comparison function use to sort
         * @param cameraPosition The camera position use to preprocess the submeshes to help sorting
         * @param transparent Specifies to activate blending if true
         */
        private static renderSorted(subMeshes: SmartArray<SubMesh>, sortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number>, camera: Nullable<Camera>, transparent: boolean): void {
            let subIndex = 0;
            let subMesh: SubMesh;
            let cameraPosition = camera ? camera.globalPosition : Vector3.Zero();
            for (; subIndex < subMeshes.length; subIndex++) {
                subMesh = subMeshes.data[subIndex];
                subMesh._alphaIndex = subMesh.getMesh().alphaIndex;
                subMesh._distanceToCamera = subMesh.getBoundingInfo().boundingSphere.centerWorld.subtract(cameraPosition).length();
            }

            let sortedArray = subMeshes.data.slice(0, subMeshes.length);

            if (sortCompareFn) {
                sortedArray.sort(sortCompareFn);
            }

            for (subIndex = 0; subIndex < sortedArray.length; subIndex++) {
                subMesh = sortedArray[subIndex];

                if (transparent) {
                    let material = subMesh.getMaterial();

                    if (material && material.needDepthPrePass) {
                        let engine = material.getScene().getEngine();
                        engine.setColorWrite(false);
                        engine.setAlphaTesting(true);
                        engine.setAlphaMode(Engine.ALPHA_DISABLE);
                        subMesh.render(false);
                        engine.setAlphaTesting(false);
                        engine.setColorWrite(true);
                    }
                }

                subMesh.render(transparent);
            }
        }

        /**
         * Renders the submeshes in the order they were dispatched (no sort applied).
         * @param subMeshes The submeshes to render
         */
        private static renderUnsorted(subMeshes: SmartArray<SubMesh>): void {
            for (var subIndex = 0; subIndex < subMeshes.length; subIndex++) {
                let submesh = subMeshes.data[subIndex];
                submesh.render(false);
            }
        }

        /**
         * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
         * are rendered back to front if in the same alpha index.
         * 
         * @param a The first submesh
         * @param b The second submesh
         * @returns The result of the comparison
         */
        public static defaultTransparentSortCompare(a: SubMesh, b:SubMesh) : number {
            // Alpha index first
            if (a._alphaIndex > b._alphaIndex) {
                return 1;
            }
            if (a._alphaIndex < b._alphaIndex) {
                return -1;
            }

            // Then distance to camera
            return RenderingGroup.backToFrontSortCompare(a, b);
        }

        /**
         * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
         * are rendered back to front.
         * 
         * @param a The first submesh
         * @param b The second submesh
         * @returns The result of the comparison
         */
        public static backToFrontSortCompare(a: SubMesh, b:SubMesh) : number {
            // Then distance to camera
            if (a._distanceToCamera < b._distanceToCamera) {
                return 1;
            }
            if (a._distanceToCamera > b._distanceToCamera) {
                return -1;
            }

            return 0;
        }

        /**
         * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
         * are rendered front to back (prevent overdraw).
         * 
         * @param a The first submesh
         * @param b The second submesh
         * @returns The result of the comparison
         */
        public static frontToBackSortCompare(a: SubMesh, b:SubMesh) : number {
            // Then distance to camera
            if (a._distanceToCamera < b._distanceToCamera) {
                return -1;
            }
            if (a._distanceToCamera > b._distanceToCamera) {
                return 1;
            }

            return 0;
        }

        /**
         * Resets the different lists of submeshes to prepare a new frame.
         */
        public prepare(): void {
            this._opaqueSubMeshes.reset();
            this._transparentSubMeshes.reset();
            this._alphaTestSubMeshes.reset();
            this._depthOnlySubMeshes.reset();
            this._particleSystems.reset();
            this._spriteManagers.reset();            
            this._edgesRenderers.reset();
        }

        public dispose(): void {
            this._opaqueSubMeshes.dispose();
            this._transparentSubMeshes.dispose();
            this._alphaTestSubMeshes.dispose();
            this._depthOnlySubMeshes.dispose();
            this._particleSystems.dispose();
            this._spriteManagers.dispose();                      
            this._edgesRenderers.dispose();
        }

        /**
         * Inserts the submesh in its correct queue depending on its material.
         * @param subMesh The submesh to dispatch
         */
        public dispatch(subMesh: SubMesh): void {
            var material = subMesh.getMaterial();
            var mesh = subMesh.getMesh();

            if (!material) {
                return;
            }

            if (material.needAlphaBlendingForMesh(mesh)) { // Transparent
                this._transparentSubMeshes.push(subMesh);
            } else if (material.needAlphaTesting()) { // Alpha test
                if (material.needDepthPrePass) {
                    this._depthOnlySubMeshes.push(subMesh);
                }
                
                this._alphaTestSubMeshes.push(subMesh);
            } else {
                if (material.needDepthPrePass) {
                    this._depthOnlySubMeshes.push(subMesh);
                }
                
                this._opaqueSubMeshes.push(subMesh); // Opaque
            }

            if (mesh._edgesRenderer) {
                this._edgesRenderers.push(mesh._edgesRenderer);
            }
        }

        public dispatchSprites(spriteManager: SpriteManager) {
            this._spriteManagers.push(spriteManager);
        }

        public dispatchParticles(particleSystem: IParticleSystem) {
            this._particleSystems.push(particleSystem);
        }

        private _renderParticles(activeMeshes: Nullable<AbstractMesh[]>): void {
            if (this._particleSystems.length === 0) {
                return;
            }

            // Particles
            var activeCamera = this._scene.activeCamera;
            this._scene.onBeforeParticlesRenderingObservable.notifyObservers(this._scene);
            for (var particleIndex = 0; particleIndex < this._scene._activeParticleSystems.length; particleIndex++) {
                var particleSystem = this._scene._activeParticleSystems.data[particleIndex];

                if ((activeCamera && activeCamera.layerMask & particleSystem.layerMask) === 0) {
                    continue;
                }

                let emitter: any = particleSystem.emitter;
                if (!emitter.position || !activeMeshes || activeMeshes.indexOf(emitter) !== -1) {
                    this._scene._activeParticles.addCount(particleSystem.render(), false);
                }
            }
            this._scene.onAfterParticlesRenderingObservable.notifyObservers(this._scene);
            
        }

        private _renderSprites(): void {
            if (!this._scene.spritesEnabled || this._spriteManagers.length === 0) {
                return;
            }

            // Sprites       
            var activeCamera = this._scene.activeCamera;
            this._scene.onBeforeSpritesRenderingObservable.notifyObservers(this._scene);
            for (var id = 0; id < this._spriteManagers.length; id++) {
                var spriteManager = this._spriteManagers.data[id];

                if (((activeCamera && activeCamera.layerMask & spriteManager.layerMask) !== 0)) {
                    spriteManager.render();
                }
            }
            this._scene.onAfterSpritesRenderingObservable.notifyObservers(this._scene);
        }
    }
} 
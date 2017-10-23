module BABYLON {
    export class RenderTargetTexture extends Texture {
        public static _REFRESHRATE_RENDER_ONCE: number = 0;
        public static _REFRESHRATE_RENDER_ONEVERYFRAME: number = 1;
        public static _REFRESHRATE_RENDER_ONEVERYTWOFRAMES: number = 2;

        public static get REFRESHRATE_RENDER_ONCE(): number {
            return RenderTargetTexture._REFRESHRATE_RENDER_ONCE;
        }

        public static get REFRESHRATE_RENDER_ONEVERYFRAME(): number {
            return RenderTargetTexture._REFRESHRATE_RENDER_ONEVERYFRAME;
        }

        public static get REFRESHRATE_RENDER_ONEVERYTWOFRAMES(): number {
            return RenderTargetTexture._REFRESHRATE_RENDER_ONEVERYTWOFRAMES;
        }

        /**
        * Use this predicate to dynamically define the list of mesh you want to render.
        * If set, the renderList property will be overwritten.
        */
        public renderListPredicate: (AbstractMesh: AbstractMesh) => boolean;

        /**
        * Use this list to define the list of mesh you want to render.
        */
        public renderList: Nullable<Array<AbstractMesh>> = new Array<AbstractMesh>();
        public renderParticles = true;
        public renderSprites = false;
        public coordinatesMode = Texture.PROJECTION_MODE;
        public activeCamera: Nullable<Camera>;
        public customRenderFunction: (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>, beforeTransparents?: () => void) => void;
        public useCameraPostProcesses: boolean;
        public ignoreCameraViewport: boolean = false;

        private _postProcessManager: Nullable<PostProcessManager>;
        private _postProcesses: PostProcess[];

        // Events

        /**
        * An event triggered when the texture is unbind.
        * @type {BABYLON.Observable}
        */
        public onBeforeBindObservable = new Observable<RenderTargetTexture>();

        /**
        * An event triggered when the texture is unbind.
        * @type {BABYLON.Observable}
        */
        public onAfterUnbindObservable = new Observable<RenderTargetTexture>();

        private _onAfterUnbindObserver: Nullable<Observer<RenderTargetTexture>>;
        public set onAfterUnbind(callback: () => void) {
            if (this._onAfterUnbindObserver) {
                this.onAfterUnbindObservable.remove(this._onAfterUnbindObserver);
            }
            this._onAfterUnbindObserver = this.onAfterUnbindObservable.add(callback);
        }

        /**
        * An event triggered before rendering the texture
        * @type {BABYLON.Observable}
        */
        public onBeforeRenderObservable = new Observable<number>();

        private _onBeforeRenderObserver: Nullable<Observer<number>>;
        public set onBeforeRender(callback: (faceIndex: number) => void) {
            if (this._onBeforeRenderObserver) {
                this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
            }
            this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(callback);
        }

        /**
        * An event triggered after rendering the texture
        * @type {BABYLON.Observable}
        */
        public onAfterRenderObservable = new Observable<number>();

        private _onAfterRenderObserver: Nullable<Observer<number>>;
        public set onAfterRender(callback: (faceIndex: number) => void) {
            if (this._onAfterRenderObserver) {
                this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
            }
            this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
        }

        /**
        * An event triggered after the texture clear
        * @type {BABYLON.Observable}
        */
        public onClearObservable = new Observable<Engine>();

        private _onClearObserver: Nullable<Observer<Engine>>;
        public set onClear(callback: (Engine: Engine) => void) {
            if (this._onClearObserver) {
                this.onClearObservable.remove(this._onClearObserver);
            }
            this._onClearObserver = this.onClearObservable.add(callback);
        }

        public clearColor: Color4;
        protected _size: number;
        public _generateMipMaps: boolean;
        protected _renderingManager: RenderingManager;
        public _waitingRenderList: string[];
        protected _doNotChangeAspectRatio: boolean;
        protected _currentRefreshId = -1;
        protected _refreshRate = 1;
        protected _textureMatrix: Matrix;
        protected _samples = 1;
        protected _renderTargetOptions: RenderTargetCreationOptions;
        public get renderTargetOptions(): RenderTargetCreationOptions {
            return this._renderTargetOptions;
        }

        constructor(name: string, size: any, scene: Nullable<Scene>, generateMipMaps?: boolean, doNotChangeAspectRatio: boolean = true, type: number = Engine.TEXTURETYPE_UNSIGNED_INT, public isCube = false, samplingMode = Texture.TRILINEAR_SAMPLINGMODE, generateDepthBuffer = true, generateStencilBuffer = false, isMulti = false) {
            super(null, scene, !generateMipMaps);
            scene = this.getScene();

            if (!scene) {
                return;
            }

            this.name = name;
            this.isRenderTarget = true;
            this._size = size;
            this._generateMipMaps = generateMipMaps ? true : false;
            this._doNotChangeAspectRatio = doNotChangeAspectRatio;

            // Rendering groups
            this._renderingManager = new RenderingManager(scene);

            if (isMulti) {
                return;
            }

            this._renderTargetOptions = {
                generateMipMaps: generateMipMaps,
                type: type,
                samplingMode: samplingMode,
                generateDepthBuffer: generateDepthBuffer,
                generateStencilBuffer: generateStencilBuffer
            };

            if (samplingMode === Texture.NEAREST_SAMPLINGMODE) {
                this.wrapU = Texture.CLAMP_ADDRESSMODE;
                this.wrapV = Texture.CLAMP_ADDRESSMODE;
            }

            if (isCube) {
                this._texture = scene.getEngine().createRenderTargetCubeTexture(size, this._renderTargetOptions);
                this.coordinatesMode = Texture.INVCUBIC_MODE;
                this._textureMatrix = Matrix.Identity();
            } else {
                this._texture = scene.getEngine().createRenderTargetTexture(size, this._renderTargetOptions);
            }

        }

        public get samples(): number {
            return this._samples;
        }

        public set samples(value: number) {
            if (this._samples === value) {
                return;
            }

            let scene = this.getScene();

            if (!scene) {
                return;
            }

            this._samples = scene.getEngine().updateRenderTargetTextureSampleCount(this._texture, value);
        }

        public resetRefreshCounter(): void {
            this._currentRefreshId = -1;
        }

        public get refreshRate(): number {
            return this._refreshRate;
        }

        // Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
        public set refreshRate(value: number) {
            this._refreshRate = value;
            this.resetRefreshCounter();
        }

        public addPostProcess(postProcess: PostProcess): void {
            if (!this._postProcessManager) {
                let scene = this.getScene();
                
                if (!scene) {
                    return;
                }                
                this._postProcessManager = new PostProcessManager(scene);
                this._postProcesses = new Array<PostProcess>();
            }

            this._postProcesses.push(postProcess);
            this._postProcesses[0].autoClear = false;
        }

        public clearPostProcesses(dispose?: boolean): void {
            if (!this._postProcesses) {
                return;
            }

            if (dispose) {
                for (var postProcess of this._postProcesses) {
                    postProcess.dispose();
                }
            }

            this._postProcesses = [];
        }

        public removePostProcess(postProcess: PostProcess): void {
            if (!this._postProcesses) {
                return;
            }

            var index = this._postProcesses.indexOf(postProcess);

            if (index === -1) {
                return;
            }

            this._postProcesses.splice(index, 1);

            if (this._postProcesses.length > 0) {
                this._postProcesses[0].autoClear = false;
            }
        }

        public _shouldRender(): boolean {
            if (this._currentRefreshId === -1) { // At least render once
                this._currentRefreshId = 1;
                return true;
            }

            if (this.refreshRate === this._currentRefreshId) {
                this._currentRefreshId = 1;
                return true;
            }

            this._currentRefreshId++;
            return false;
        }

        public getRenderSize(): number {
            return this._size;
        }

        public get canRescale(): boolean {
            return true;
        }

        public scale(ratio: number): void {
            var newSize = this._size * ratio;

            this.resize(newSize);
        }

        public getReflectionTextureMatrix(): Matrix {
            if (this.isCube) {
                return this._textureMatrix;
            }

            return super.getReflectionTextureMatrix();
        }

        public resize(size: any) {
            this.releaseInternalTexture();
            let scene = this.getScene();
            
            if (!scene) {
                return;
            } 

            if (this.isCube) {
                this._texture = scene.getEngine().createRenderTargetCubeTexture(size, this._renderTargetOptions);
            } else {
                this._texture = scene.getEngine().createRenderTargetTexture(size, this._renderTargetOptions);
            }

            this._size = size;
        }

        public render(useCameraPostProcess: boolean = false, dumpForDebug: boolean = false) {
            var scene = this.getScene();

            if (!scene) {
                return;
            }

            var engine = scene.getEngine();

            if (this.useCameraPostProcesses !== undefined) {
                useCameraPostProcess = this.useCameraPostProcesses;
            }

            if (this._waitingRenderList) {
                this.renderList = [];
                for (var index = 0; index < this._waitingRenderList.length; index++) {
                    var id = this._waitingRenderList[index];
                    let mesh = scene.getMeshByID(id);
                    if (mesh) {
                        this.renderList.push(mesh);
                    }
                }

                delete this._waitingRenderList;
            }

            // Is predicate defined?
            if (this.renderListPredicate) {
                if (this.renderList) {
                    this.renderList.splice(0); // Clear previous renderList
                } else {
                    this.renderList = [];
                }

                var scene = this.getScene();
                
                if (!scene) {
                    return;
                }

                var sceneMeshes = scene.meshes;

                for (var index = 0; index < sceneMeshes.length; index++) {
                    var mesh = sceneMeshes[index];
                    if (this.renderListPredicate(mesh)) {
                        this.renderList.push(mesh);
                    }
                }
            }

            this.onBeforeBindObservable.notifyObservers(this);

            // Set custom projection.
            // Needs to be before binding to prevent changing the aspect ratio.
            let camera: Nullable<Camera>;
            if (this.activeCamera) {
                camera = this.activeCamera;
                engine.setViewport(this.activeCamera.viewport, this._size, this._size);

                if (this.activeCamera !== scene.activeCamera) {
                    scene.setTransformMatrix(this.activeCamera.getViewMatrix(), this.activeCamera.getProjectionMatrix(true));
                }
            }
            else {
                camera = scene.activeCamera;
                if (camera) {
                    engine.setViewport(camera.viewport, this._size, this._size);
                }
            }

            // Prepare renderingManager
            this._renderingManager.reset();

            var currentRenderList = this.renderList ? this.renderList : scene.getActiveMeshes().data;
            var currentRenderListLength = this.renderList ? this.renderList.length : scene.getActiveMeshes().length;
            var sceneRenderId = scene.getRenderId();
            for (var meshIndex = 0; meshIndex < currentRenderListLength; meshIndex++) {
                var mesh = currentRenderList[meshIndex];

                if (mesh) {
                    if (!mesh.isReady()) {
                        // Reset _currentRefreshId
                        this.resetRefreshCounter();
                        continue;
                    }

                    mesh._preActivateForIntermediateRendering(sceneRenderId);

                    let isMasked;
                    if (!this.renderList && camera) {
                        isMasked = ((mesh.layerMask & camera.layerMask) === 0);
                    } else {
                        isMasked = false;
                    }

                    if (mesh.isEnabled() && mesh.isVisible && mesh.subMeshes && !isMasked) {
                        mesh._activate(sceneRenderId);

                        for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                            var subMesh = mesh.subMeshes[subIndex];
                            scene._activeIndices.addCount(subMesh.indexCount, false);
                            this._renderingManager.dispatch(subMesh);
                        }
                    }
                }
            }

            for (var particleIndex = 0; particleIndex < scene.particleSystems.length; particleIndex++) {
                var particleSystem = scene.particleSystems[particleIndex];

                let emitter: any = particleSystem.emitter;
                if (!particleSystem.isStarted() || !emitter || !emitter.position || !emitter.isEnabled()) {
                    continue;
                }

                if (currentRenderList.indexOf(emitter) >= 0) {
                    this._renderingManager.dispatchParticles(particleSystem);
                }
            }

            if (this.isCube) {
                for (var face = 0; face < 6; face++) {
                    this.renderToTarget(face, currentRenderList, currentRenderListLength, useCameraPostProcess, dumpForDebug);
                    scene.incrementRenderId();
                    scene.resetCachedMaterial();
                }
            } else {
                this.renderToTarget(0, currentRenderList, currentRenderListLength, useCameraPostProcess, dumpForDebug);
            }

            this.onAfterUnbindObservable.notifyObservers(this);

            if (scene.activeCamera) {
                if (this.activeCamera && this.activeCamera !== scene.activeCamera) {
                    scene.setTransformMatrix(scene.activeCamera.getViewMatrix(), scene.activeCamera.getProjectionMatrix(true));
                }
                engine.setViewport(scene.activeCamera.viewport);
            }

            scene.resetCachedMaterial();
        }

        private renderToTarget(faceIndex: number, currentRenderList: AbstractMesh[], currentRenderListLength: number, useCameraPostProcess: boolean, dumpForDebug: boolean): void {
            var scene = this.getScene();
            
            if (!scene) {
                return;
            }

            var engine = scene.getEngine();

            if (!this._texture) {
                return;
            }

            // Bind
            if (this._postProcessManager) {
                this._postProcessManager._prepareFrame(this._texture, this._postProcesses);
            }
            else if (!useCameraPostProcess || !scene.postProcessManager._prepareFrame(this._texture)) {
                if (this._texture) {
                    engine.bindFramebuffer(this._texture, this.isCube ? faceIndex : undefined, undefined, undefined, this.ignoreCameraViewport);
                }
            }

            this.onBeforeRenderObservable.notifyObservers(faceIndex);

            // Clear
            if (this.onClearObservable.hasObservers()) {
                this.onClearObservable.notifyObservers(engine);
            } else {
                engine.clear(this.clearColor || scene.clearColor, true, true, true);
            }

            if (!this._doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }

            // Render
            this._renderingManager.render(this.customRenderFunction, currentRenderList, this.renderParticles, this.renderSprites);

            if (this._postProcessManager) {
                this._postProcessManager._finalizeFrame(false, this._texture, faceIndex, this._postProcesses, this.ignoreCameraViewport);
            }
            else if (useCameraPostProcess) {
                scene.postProcessManager._finalizeFrame(false, this._texture, faceIndex);
            }

            if (!this._doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }

            // Dump ?
            if (dumpForDebug) {
                Tools.DumpFramebuffer(this._size, this._size, engine);
            }

            // Unbind
            if (!this.isCube || faceIndex === 5) {
                if (this.isCube) {

                    if (faceIndex === 5) {
                        engine.generateMipMapsForCubemap(this._texture);
                    }
                }

                engine.unBindFramebuffer(this._texture, this.isCube, () => {
                    this.onAfterRenderObservable.notifyObservers(faceIndex);
                });
            } else {
                this.onAfterRenderObservable.notifyObservers(faceIndex);
            }
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
            transparentSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null): void {

            this._renderingManager.setRenderingOrder(renderingGroupId,
                opaqueSortCompareFn,
                alphaTestSortCompareFn,
                transparentSortCompareFn);
        }

        /**
         * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
         * 
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
         */
        public setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean): void {
            this._renderingManager.setRenderingAutoClearDepthStencil(renderingGroupId, autoClearDepthStencil);
        }

        public clone(): RenderTargetTexture {
            var textureSize = this.getSize();
            var newTexture = new RenderTargetTexture(
                this.name,
                textureSize.width,
                this.getScene(),
                this._renderTargetOptions.generateMipMaps,
                this._doNotChangeAspectRatio,
                this._renderTargetOptions.type,
                this.isCube,
                this._renderTargetOptions.samplingMode,
                this._renderTargetOptions.generateDepthBuffer,
                this._renderTargetOptions.generateStencilBuffer
            );

            // Base texture
            newTexture.hasAlpha = this.hasAlpha;
            newTexture.level = this.level;

            // RenderTarget Texture
            newTexture.coordinatesMode = this.coordinatesMode;
            if (this.renderList) {
                newTexture.renderList = this.renderList.slice(0);
            }

            return newTexture;
        }

        public serialize(): any {
            if (!this.name) {
                return null;
            }

            var serializationObject = super.serialize();

            serializationObject.renderTargetSize = this.getRenderSize();
            serializationObject.renderList = [];

            if (this.renderList) {
                for (var index = 0; index < this.renderList.length; index++) {
                    serializationObject.renderList.push(this.renderList[index].id);
                }
            }

            return serializationObject;
        }

        // This will remove the attached framebuffer objects. The texture will not be able to be used as render target anymore
        public disposeFramebufferObjects(): void {
            let objBuffer = this.getInternalTexture();
            let scene = this.getScene();
            if (objBuffer && scene) {
                scene.getEngine()._releaseFramebufferObjects(objBuffer);
            }
        }

        public dispose(): void {
            if (this._postProcessManager) {
                this._postProcessManager.dispose();
                this._postProcessManager = null;
            }

            this.clearPostProcesses(true);

            this.renderList = null;

            // Remove from custom render targets
            var scene = this.getScene();

            if (!scene) {
                return;
            }

            var index = scene.customRenderTargets.indexOf(this);

            if (index >= 0) {
                scene.customRenderTargets.splice(index, 1);
            }

            for (var camera of scene.cameras) {
                index = camera.customRenderTargets.indexOf(this);

                if (index >= 0) {
                    camera.customRenderTargets.splice(index, 1);
                }
            }

            super.dispose();
        }

        public _rebuild(): void {
            if (this.refreshRate === RenderTargetTexture.REFRESHRATE_RENDER_ONCE) {
                this.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
            }

            if (this._postProcessManager) {
                this._postProcessManager._rebuild();
            }
        }
    }
}
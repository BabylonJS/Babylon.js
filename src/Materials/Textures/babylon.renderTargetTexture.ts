﻿module BABYLON {
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
        public renderList = new Array<AbstractMesh>();
        public renderParticles = true;
        public renderSprites = false;
        public coordinatesMode = Texture.PROJECTION_MODE;
        public activeCamera: Camera;
        public customRenderFunction: (opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, beforeTransparents?: () => void) => void;
        public useCameraPostProcesses: boolean;

        // Events

        /**
        * An event triggered when the texture is unbind.
        * @type {BABYLON.Observable}
        */
        public onAfterUnbindObservable = new Observable<RenderTargetTexture>();

        private _onAfterUnbindObserver: Observer<RenderTargetTexture>;
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

        private _onBeforeRenderObserver: Observer<number>;
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

        private _onAfterRenderObserver: Observer<number>;
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

        private _onClearObserver: Observer<Engine>;
        public set onClear(callback: (Engine: Engine) => void) {
            if (this._onClearObserver) {
                this.onClearObservable.remove(this._onClearObserver);
            }
            this._onClearObserver = this.onClearObservable.add(callback);
        }

        private _size: number;
        public _generateMipMaps: boolean;
        private _renderingManager: RenderingManager;
        public _waitingRenderList: string[];
        private _doNotChangeAspectRatio: boolean;
        private _currentRefreshId = -1;
        private _refreshRate = 1;
        private _textureMatrix: Matrix;
        private _samples = 1;
        protected _renderTargetOptions: {
            generateMipMaps: boolean,
            type: number,
            samplingMode: number,
            generateDepthBuffer: boolean,
            generateStencilBuffer: boolean
        };

        constructor(name: string, size: any, scene: Scene, generateMipMaps?: boolean, doNotChangeAspectRatio: boolean = true, type: number = Engine.TEXTURETYPE_UNSIGNED_INT, public isCube = false, samplingMode = Texture.TRILINEAR_SAMPLINGMODE, generateDepthBuffer = true, generateStencilBuffer = false) {
            super(null, scene, !generateMipMaps);

            this.name = name;
            this.isRenderTarget = true;
            this._size = size;
            this._generateMipMaps = generateMipMaps;
            this._doNotChangeAspectRatio = doNotChangeAspectRatio;

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

            // Rendering groups
            this._renderingManager = new RenderingManager(scene);
        }

        public get samples(): number {
            return this._samples;
        }

        public set samples(value: number) {
            if (this._samples === value) {
                return;
            }
            
            this._samples = this.getScene().getEngine().updateRenderTargetTextureSampleCount(this._texture, value);
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

        public isReady(): boolean {
            if (!this.getScene().renderTargetsEnabled) {
                return false;
            }
            return super.isReady();
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
            if (this.isCube) {
                this._texture = this.getScene().getEngine().createRenderTargetCubeTexture(size, this._renderTargetOptions);
            } else {
                this._texture = this.getScene().getEngine().createRenderTargetTexture(size, this._renderTargetOptions);
            }
        }

        public render(useCameraPostProcess?: boolean, dumpForDebug?: boolean) {
            var scene = this.getScene();
            var engine = scene.getEngine();

            if (this.useCameraPostProcesses !== undefined) {
                useCameraPostProcess = this.useCameraPostProcesses;
            }

            if (this._waitingRenderList) {
                this.renderList = [];
                for (var index = 0; index < this._waitingRenderList.length; index++) {
                    var id = this._waitingRenderList[index];
                    this.renderList.push(scene.getMeshByID(id));
                }

                delete this._waitingRenderList;
            }

            // Is predicate defined?
            if (this.renderListPredicate) {
                this.renderList.splice(0); // Clear previous renderList

                var sceneMeshes = this.getScene().meshes;

                for (var index = 0; index < sceneMeshes.length; index++) {
                    var mesh = sceneMeshes[index];
                    if (this.renderListPredicate(mesh)) {
                        this.renderList.push(mesh);
                    }
                }
            }

            if (this.renderList && this.renderList.length === 0) {
                return;
            }

            // Set custom projection.
            // Needs to be before binding to prevent changing the aspect ratio.
            if (this.activeCamera) {
                engine.setViewport(this.activeCamera.viewport);

                if (this.activeCamera !== scene.activeCamera)
                {
                    scene.setTransformMatrix(this.activeCamera.getViewMatrix(), this.activeCamera.getProjectionMatrix(true));
                }
            }
            else {
                engine.setViewport(scene.activeCamera.viewport);
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

                    if (mesh.isEnabled() && mesh.isVisible && mesh.subMeshes && ((mesh.layerMask & scene.activeCamera.layerMask) !== 0)) {
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

                    if (!particleSystem.isStarted() || !particleSystem.emitter || !particleSystem.emitter.position || !particleSystem.emitter.isEnabled()) {
                        continue;
                    }

                    if (currentRenderList.indexOf(particleSystem.emitter) >= 0) {
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

            if (this.activeCamera && this.activeCamera !== scene.activeCamera) {
                scene.setTransformMatrix(scene.activeCamera.getViewMatrix(), scene.activeCamera.getProjectionMatrix(true));
            }
            engine.setViewport(scene.activeCamera.viewport);

            scene.resetCachedMaterial();
        }

        renderToTarget(faceIndex: number, currentRenderList: AbstractMesh[], currentRenderListLength:number, useCameraPostProcess: boolean, dumpForDebug: boolean): void {
            var scene = this.getScene();
            var engine = scene.getEngine();

            // Bind
            if (!useCameraPostProcess || !scene.postProcessManager._prepareFrame(this._texture)) {
                if (this.isCube) {
                    engine.bindFramebuffer(this._texture, faceIndex);
                } else {
                    engine.bindFramebuffer(this._texture);
                }
            }

            this.onBeforeRenderObservable.notifyObservers(faceIndex);

            // Clear
            if (this.onClearObservable.hasObservers()) {
                this.onClearObservable.notifyObservers(engine);
            } else {
                engine.clear(scene.clearColor, true, true, true);
            }

            if (!this._doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }

            // Render
            this._renderingManager.render(this.customRenderFunction, currentRenderList, this.renderParticles, this.renderSprites);

            if (useCameraPostProcess) {
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
            opaqueSortCompareFn: (a: SubMesh, b: SubMesh) => number = null,
            alphaTestSortCompareFn: (a: SubMesh, b: SubMesh) => number = null,
            transparentSortCompareFn: (a: SubMesh, b: SubMesh) => number = null): void {
            
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
            newTexture.renderList = this.renderList.slice(0);

            return newTexture;
        }

        public serialize(): any {
            if (!this.name) {
                return null;
            }

            var serializationObject = super.serialize();

            serializationObject.renderTargetSize = this.getRenderSize();
            serializationObject.renderList = [];

            for (var index = 0; index < this.renderList.length; index++) {
                serializationObject.renderList.push(this.renderList[index].id);
            }

            return serializationObject;
        }
    }
}
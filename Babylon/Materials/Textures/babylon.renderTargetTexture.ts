module BABYLON {
    export class RenderTargetTexture extends Texture {
        public renderList = new Array<AbstractMesh>();
        public renderParticles = true;
        public renderSprites = false;
        public coordinatesMode = Texture.PROJECTION_MODE;
        public onBeforeRender: () => void;
        public onAfterRender: () => void;
        public onAfterUnbind: () => void;
        public onClear: (engine: Engine) => void;
        public activeCamera: Camera;
        public customRenderFunction: (opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, beforeTransparents?: () => void) => void;

        private _size: number;
        public _generateMipMaps: boolean;
        private _renderingManager: RenderingManager;
        public _waitingRenderList: string[];
        private _doNotChangeAspectRatio: boolean;
        private _currentRefreshId = -1;
        private _refreshRate = 1;

        constructor(name: string, size: any, scene: Scene, generateMipMaps?: boolean, doNotChangeAspectRatio: boolean = true, type: number = Engine.TEXTURETYPE_UNSIGNED_INT) {
            super(null, scene, !generateMipMaps);

            this.name = name;
            this.isRenderTarget = true;
            this._size = size;
            this._generateMipMaps = generateMipMaps;
            this._doNotChangeAspectRatio = doNotChangeAspectRatio;

            this._texture = scene.getEngine().createRenderTargetTexture(size, { generateMipMaps: generateMipMaps, type: type });

            // Rendering groups
            this._renderingManager = new RenderingManager(scene);
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

            this.resize(newSize, this._generateMipMaps);
        }

        public resize(size:any, generateMipMaps?: boolean) {
            this.releaseInternalTexture();
            this._texture = this.getScene().getEngine().createRenderTargetTexture(size, generateMipMaps);
        }

        public render(useCameraPostProcess?: boolean, dumpForDebug?: boolean) {
            var scene = this.getScene();
            var engine = scene.getEngine();

            if (this._waitingRenderList) {
                this.renderList = [];
                for (var index = 0; index < this._waitingRenderList.length; index++) {
                    var id = this._waitingRenderList[index];
                    this.renderList.push(scene.getMeshByID(id));
                }

                delete this._waitingRenderList;
            }

            if (this.renderList && this.renderList.length === 0) {
                return;
            }

            // Bind
            if (!useCameraPostProcess || !scene.postProcessManager._prepareFrame(this._texture)) {
                engine.bindFramebuffer(this._texture);
            }

            this._renderingManager.reset();

            var currentRenderList = this.renderList ? this.renderList : scene.getActiveMeshes().data;

            for (var meshIndex = 0; meshIndex < currentRenderList.length; meshIndex++) {
                var mesh = currentRenderList[meshIndex];

                if (mesh) {
                    if (!mesh.isReady()) {
                        // Reset _currentRefreshId
                        this.resetRefreshCounter();
                        continue;
                    }

                    if (mesh.isEnabled() && mesh.isVisible && mesh.subMeshes && ((mesh.layerMask & scene.activeCamera.layerMask) !== 0)) {
                        mesh._activate(scene.getRenderId());

                        for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                            var subMesh = mesh.subMeshes[subIndex];
                            scene._activeIndices += subMesh.indexCount;
                            this._renderingManager.dispatch(subMesh);
                        }
                    }
                }                
            }

            if (this.onBeforeRender) {
                this.onBeforeRender();
            }

            // Clear
            if (this.onClear) {
                this.onClear(engine);
            } else {
                engine.clear(scene.clearColor, true, true);
            }

            if (!this._doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }

            // Render
            this._renderingManager.render(this.customRenderFunction, currentRenderList, this.renderParticles, this.renderSprites);

            if (useCameraPostProcess) {
                scene.postProcessManager._finalizeFrame(false, this._texture);
            }

            if (!this._doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }

            if (this.onAfterRender) {
                this.onAfterRender();
            }

            // Dump ?
            if (dumpForDebug) {
                Tools.DumpFramebuffer(this._size, this._size, engine);
            }

            // Unbind
            engine.unBindFramebuffer(this._texture);

            if (this.onAfterUnbind) {
                this.onAfterUnbind();
            }
        }

        public clone(): RenderTargetTexture {
            var textureSize = this.getSize();
            var newTexture = new RenderTargetTexture(this.name, textureSize.width, this.getScene(), this._generateMipMaps);

            // Base texture
            newTexture.hasAlpha = this.hasAlpha;
            newTexture.level = this.level;

            // RenderTarget Texture
            newTexture.coordinatesMode = this.coordinatesMode;
            newTexture.renderList = this.renderList.slice(0);

            return newTexture;
        }
    }
} 
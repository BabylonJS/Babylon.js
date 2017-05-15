module BABYLON {
    export class MultiRenderTarget extends RenderTargetTexture {

        private _webGLTextures: WebGLTexture[];
        private _textures: Texture[];
        private _count: number;

        public get textures(): Texture[] {
            return this._textures;
        }

        public get depthTexture(): Texture {
            return this._textures[this._textures.length - 1];
        }

        public customRenderFunction: (opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, beforeTransparents?: () => void) => void;

        constructor(name: string, size: any, count: number, scene: Scene, options?: any) {
            options = options || {};

            var generateMipMaps = options.generateMipMaps ? options.generateMipMaps : false;
            var generateDepthTexture = options.generateDepthTexture ? options.generateDepthTexture : false;
            var doNotChangeAspectRatio = options.doNotChangeAspectRatio === undefined ? true : options.doNotChangeAspectRatio;

            super(name, size, scene, generateMipMaps, doNotChangeAspectRatio);

            var types = [];
            var samplingModes = [];

            for (var i = 0; i < count; i++) {
                if (options.types && options.types[i]) {
                    types.push(options.types[i]);
                } else {
                    types.push(Engine.TEXTURETYPE_FLOAT);
                }

                if (options.samplingModes && options.samplingModes[i]) {
                    samplingModes.push(options.samplingModes[i]);
                } else {
                    samplingModes.push(Texture.TRILINEAR_SAMPLINGMODE);
                }
            }

            var generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
            var generateStencilBuffer = options.generateStencilBuffer === undefined ? false : options.generateStencilBuffer;

            this._count = count;
            this._size = size;
            this._webGLTextures = scene.getEngine().createMultipleRenderTarget(size, {
                samplingModes: samplingModes,
                generateMipMaps: generateMipMaps,
                generateDepthBuffer: generateDepthBuffer,
                generateStencilBuffer: generateStencilBuffer,
                generateDepthTexture: generateDepthTexture,
                types: types,
                textureCount: count
            });

            this._textures = [];
            for (var i = 0; i < this._webGLTextures.length; i++) {
                var texture = new BABYLON.Texture(null, scene);
                texture._texture = this._webGLTextures[i];
                this._textures.push(texture);
            }
        }

        public get samples(): number {
            return this._samples;
        }

        public set samples(value: number) {
            if (this._samples === value) {
                return;
            }
            
            for (var i = 0 ; i < this._webGLTextures.length; i++) {
                this._samples = this.getScene().getEngine().updateRenderTargetTextureSampleCount(this._webGLTextures[i], value);
            }
        }

        public render(useCameraPostProcess?: boolean, dumpForDebug?: boolean) {
            var scene = this.getScene();
            var engine = scene.getEngine();

            engine.setViewport(scene.activeCamera.viewport);

            // Prepare renderingManager
            this._renderingManager.reset();

            var currentRenderList = scene.getActiveMeshes().data;
            var currentRenderListLength = scene.getActiveMeshes().length;
            var sceneRenderId = scene.getRenderId();
            for (var meshIndex = 0; meshIndex < currentRenderListLength; meshIndex++) {
                var mesh = currentRenderList[meshIndex];

                if (mesh) {
                    if (!mesh.isReady()) {
                        continue;
                    }

                    if (mesh.isEnabled() && mesh.isVisible && mesh.subMeshes && ((mesh.layerMask & scene.activeCamera.layerMask) !== 0)) {
                        for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                            var subMesh = mesh.subMeshes[subIndex];
                            scene._activeIndices.addCount(subMesh.indexCount, false);
                            this._renderingManager.dispatch(subMesh);
                        }
                    }
                }
            }

            this.renderToTarget(0, currentRenderList, currentRenderListLength, useCameraPostProcess, dumpForDebug);

            engine.setViewport(scene.activeCamera.viewport);

            scene.resetCachedMaterial();
        }

        public renderToTarget(faceIndex: number, currentRenderList: AbstractMesh[], currentRenderListLength:number, useCameraPostProcess: boolean, dumpForDebug: boolean): void {
            var scene = this.getScene();
            var engine = scene.getEngine();

            // Bind
            engine.bindFramebuffer(this._webGLTextures[0]);

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
            this._renderingManager.render(this.customRenderFunction, currentRenderList, false, false);

            if (!this._doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }

            // Dump ?
            if (dumpForDebug) {
                Tools.DumpFramebuffer(this._size, this._size, engine);
            }

            // Unbind
            engine.unBindFramebuffer(this._webGLTextures[0]);
        }


        public dispose(): void {
            for (var i = this._webGLTextures.length - 1; i >= 0; i--) {
                if (this._webGLTextures[i] !== undefined) {
                    this.getScene().getEngine().releaseInternalTexture(this._webGLTextures[i]);
                    this._webGLTextures.splice(i, 1);
                }
            }

            super.dispose();
        }
    }
}
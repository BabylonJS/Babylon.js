module BABYLON {
    export class RenderTargetTexture extends Texture {
        public renderList = new Array<AbstractMesh>();
        public renderParticles = true;
        public renderSprites = false;
        public coordinatesMode = BABYLON.Texture.PROJECTION_MODE;
        public onBeforeRender: () => void;
        public onAfterRender: () => void;
        public customRenderFunction: (opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, beforeTransparents?: () => void) => void;

        private _size: number;
        public _generateMipMaps: boolean;
        private _renderingManager
        public _waitingRenderList: string[];
        private _doNotChangeAspectRatio: boolean;

        constructor(name: string, size: any, scene: Scene, generateMipMaps?: boolean, doNotChangeAspectRatio?: boolean) {
            super(null, scene, !generateMipMaps);

            this.name = name;
            this.isRenderTarget = true;
            this._size = size;
            this._generateMipMaps = generateMipMaps;
            this._doNotChangeAspectRatio = doNotChangeAspectRatio;

            this._texture = scene.getEngine().createRenderTargetTexture(size, generateMipMaps);

            // Rendering groups
            this._renderingManager = new BABYLON.RenderingManager(scene);
        }

        public getRenderSize(): number {
            return this._size;
        }

        public resize(size, generateMipMaps) {
            this.releaseInternalTexture();
            this._texture = this.getScene().getEngine().createRenderTargetTexture(size, generateMipMaps);
        }

        public render(useCameraPostProcess?: boolean) {
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

            if (!this.renderList || this.renderList.length == 0) {
                return;
            }

            // Bind
            if (!useCameraPostProcess || !scene.postProcessManager._prepareFrame(this._texture)) {
                engine.bindFramebuffer(this._texture);
            }

            // Clear
            engine.clear(scene.clearColor, true, true);

            this._renderingManager.reset();

            for (var meshIndex = 0; meshIndex < this.renderList.length; meshIndex++) {
                var mesh = this.renderList[meshIndex];

                if (mesh && mesh.isEnabled() && mesh.isVisible && mesh.subMeshes) {
                    mesh._activate(scene.getRenderId());

                    for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                        var subMesh = mesh.subMeshes[subIndex];
                        scene._activeVertices += subMesh.verticesCount;
                        this._renderingManager.dispatch(subMesh);
                    }
                }
            }

            if (!this._doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }

            if (this.onBeforeRender) {
                this.onBeforeRender();
            }

            // Render

            this._renderingManager.render(this.customRenderFunction, this.renderList, this.renderParticles, this.renderSprites);

            if (useCameraPostProcess) {
                scene.postProcessManager._finalizeFrame(false, this._texture);
            }

            if (this.onAfterRender) {
                this.onAfterRender();
            }

            // Unbind
            engine.unBindFramebuffer(this._texture);

            if (!this._doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }
        }

        public clone(): RenderTargetTexture {
            var textureSize = this.getSize();
            var newTexture = new BABYLON.RenderTargetTexture(this.name, textureSize.width, this.getScene(), this._generateMipMaps);

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
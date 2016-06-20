module BABYLON {
    export class RenderingManager {
        public static MAX_RENDERINGGROUPS = 4;

        private _scene: Scene;
        private _renderingGroups = new Array<RenderingGroup>();
        private _depthBufferAlreadyCleaned: boolean;

        private _currentIndex: number;
        private _currentActiveMeshes: AbstractMesh[];
        private _currentRenderParticles: boolean;
        private _currentRenderSprites: boolean;

        constructor(scene: Scene) {
            this._scene = scene;
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

                this._clearDepthBuffer();

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
                    this._clearDepthBuffer();
                    spriteManager.render();
                }
            }
            this._scene._spritesDuration.endMonitoring(false);
        }

        private _clearDepthBuffer(): void {
            if (this._depthBufferAlreadyCleaned) {
                return;
            }

            this._scene.getEngine().clear(0, false, true);
            this._depthBufferAlreadyCleaned = true;
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
                } else {
                    this._renderSpritesAndParticles();
                }

                if (needToStepBack) {
                    index--;
                }
            }
        }

        public reset(): void {
            this._renderingGroups.forEach((renderingGroup, index, array) => {
                if (renderingGroup) {
                    renderingGroup.prepare();
                }
            });
        }

        public dispatch(subMesh: SubMesh): void {
            var mesh = subMesh.getMesh();
            var renderingGroupId = mesh.renderingGroupId || 0;

            if (!this._renderingGroups[renderingGroupId]) {
                this._renderingGroups[renderingGroupId] = new RenderingGroup(renderingGroupId, this._scene);
            }

            this._renderingGroups[renderingGroupId].dispatch(subMesh);
        }

    }
} 
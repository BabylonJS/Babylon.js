module BABYLON {
    export class RenderingManager {
        public static MAX_RENDERINGGROUPS = 4;

        private _scene: Scene;
        private _renderingGroups = new Array<RenderingGroup>();
        private _depthBufferAlreadyCleaned: boolean;

        constructor(scene: Scene) {
            this._scene = scene;
        }

        private _renderParticles(index: number, activeMeshes: AbstractMesh[]): void {
            if (this._scene._activeParticleSystems.length === 0) {
                return;
            }

            // Particles
            var beforeParticlesDate = Tools.Now;
            for (var particleIndex = 0; particleIndex < this._scene._activeParticleSystems.length; particleIndex++) {
                var particleSystem = this._scene._activeParticleSystems.data[particleIndex];

                if (particleSystem.renderingGroupId !== index) {
                    continue;
                }

                this._clearDepthBuffer();

                if (!particleSystem.emitter.position || !activeMeshes || activeMeshes.indexOf(particleSystem.emitter) !== -1) {
                    this._scene._activeParticles += particleSystem.render();
                }
            }
            this._scene._particlesDuration += Tools.Now - beforeParticlesDate;
        }

        private _renderSprites(index: number): void {
            if (!this._scene.spritesEnabled || this._scene.spriteManagers.length === 0) {
                return;
            }

            // Sprites       
            var beforeSpritessDate = Tools.Now;
            for (var id = 0; id < this._scene.spriteManagers.length; id++) {
                var spriteManager = this._scene.spriteManagers[id];

                if (spriteManager.renderingGroupId === index) {
                    this._clearDepthBuffer();
                    spriteManager.render();
                }
            }
            this._scene._spritesDuration += Tools.Now - beforeSpritessDate;
        }

        private _clearDepthBuffer(): void {
            if (this._depthBufferAlreadyCleaned) {
                return;
            }

            this._scene.getEngine().clear(0, false, true);
            this._depthBufferAlreadyCleaned = true;
        }

        public render(customRenderFunction: (opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>) => void,
            activeMeshes: AbstractMesh[], renderParticles: boolean, renderSprites: boolean): void {
            for (var index = 0; index < RenderingManager.MAX_RENDERINGGROUPS; index++) {
                this._depthBufferAlreadyCleaned = false;
                var renderingGroup = this._renderingGroups[index];
                var needToStepBack = false;

                if (renderingGroup) {
                    this._clearDepthBuffer();
                    if (!renderingGroup.render(customRenderFunction)) {
                        this._renderingGroups.splice(index, 1);
                        needToStepBack = true;
                    }
                }

                if (renderSprites) {
                    this._renderSprites(index);
                }

                if (renderParticles) {
                    this._renderParticles(index, activeMeshes);
                }

                if (needToStepBack) {
                    index--;
                }
            }
        }

        public reset(): void {
            this._renderingGroups.forEach(function (renderingGroup, index, array) {
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
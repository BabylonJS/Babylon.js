module BABYLON {
    export class PushMaterial extends Material {

        protected _activeEffect: Effect;

        constructor(name: string, scene: Scene) {
            super(name, scene);
            this.storeEffectOnSubMeshes = true;
        }

        public getEffect(): Effect {
            return this._activeEffect;
        }

        public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {
            if (!mesh) {
                return false;
            }

            if (!mesh.subMeshes || mesh.subMeshes.length === 0) {
                return true;
            }

            return this.isReadyForSubMesh(mesh, mesh.subMeshes[0], useInstances);
        }

        public bindOnlyWorldMatrix(world: Matrix): void {
            this._activeEffect.setMatrix("world", world);
        }

        public bind(world: Matrix, mesh?: Mesh): void {
            if (!mesh) {
                return;
            }

            this.bindForSubMesh(world, mesh, mesh.subMeshes[0]);
        }

        protected _afterBind(mesh: Mesh, effect?: Effect): void {
            super._afterBind(mesh);
            this.getScene()._cachedEffect = effect;
        }

        protected _mustRebind(scene: Scene, effect: Effect, visibility: number = 0) {
            return scene.isCachedMaterialValid(this, effect, visibility);
        }

        public markAsDirty(flag: number): void {
            if (flag & Material.TextureDirtyFlag) {
                this._markAllSubMeshesAsTexturesDirty();
            }

            if (flag & Material.LightDirtyFlag) {
                this._markAllSubMeshesAsLightsDirty();
            }

            if (flag & Material.FresnelDirtyFlag) {
                this._markAllSubMeshesAsFresnelDirty();
            }

            if (flag & Material.AttributesDirtyFlag) {
                this._markAllSubMeshesAsAttributesDirty();
            }

            if (flag & Material.MiscDirtyFlag) {
                this._markAllSubMeshesAsMiscDirty();
            }
        }

        protected _markAllSubMeshesAsDirty(func: (defines: MaterialDefines) => void) {
            for (var mesh of this.getScene().meshes) {
                if (!mesh.subMeshes) {
                    continue;
                }
                for (var subMesh of mesh.subMeshes) {
                    if (subMesh.getMaterial() !== this) {
                        continue;
                    }

                    if (!subMesh._materialDefines) {
                        return;
                    }

                    func(subMesh._materialDefines);
                }
            }
        }

        protected _markAllSubMeshesAsTexturesDirty() {
            this._markAllSubMeshesAsDirty(defines => defines.markAsTexturesDirty());
        }

        protected _markAllSubMeshesAsFresnelDirty() {
            this._markAllSubMeshesAsDirty(defines => defines.markAsFresnelDirty());
        }

        protected _markAllSubMeshesAsLightsDirty() {
            this._markAllSubMeshesAsDirty(defines => defines.markAsLightDirty());
        }

        protected _markAllSubMeshesAsAttributesDirty() {
            this._markAllSubMeshesAsDirty(defines => defines.markAsAttributesDirty());
        }

        protected _markAllSubMeshesAsMiscDirty() {
            this._markAllSubMeshesAsDirty(defines => defines.markAsMiscDirty());
        }
    }
} 
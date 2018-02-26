﻿module BABYLON {
    export class PushMaterial extends Material {

        protected _activeEffect: Effect;

        protected _normalMatrix : Matrix = new Matrix();

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

         /**
         * Binds the given world matrix to the active effect
         * 
         * @param world the matrix to bind
         */
        public bindOnlyWorldMatrix(world: Matrix): void {
            this._activeEffect.setMatrix("world", world);
        }

        /**
         * Binds the given normal matrix to the active effect
         * 
         * @param normalMatrix the matrix to bind
         */
        public bindOnlyNormalMatrix(normalMatrix: Matrix): void {                        
            this._activeEffect.setMatrix("normalMatrix", normalMatrix);
        }

        public bind(world: Matrix, mesh?: Mesh): void {
            if (!mesh) {
                return;
            }

            this.bindForSubMesh(world, mesh, mesh.subMeshes[0]);
        }

        protected _afterBind(mesh: Mesh, effect: Nullable<Effect> = null): void {
            super._afterBind(mesh);
            this.getScene()._cachedEffect = effect;
        }

        protected _mustRebind(scene: Scene, effect: Effect, visibility: number = 1) {
            return scene.isCachedMaterialInvalid(this, effect, visibility);
        }
    }
} 
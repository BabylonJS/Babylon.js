import type { Nullable } from "../types";
import type { Scene } from "../scene";
import { Matrix } from "../Maths/math.vector";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { Mesh } from "../Meshes/mesh";
import { Material } from "../Materials/material";
import type { Effect } from "../Materials/effect";
import type { SubMesh } from "../Meshes/subMesh";
/**
 * Base class of materials working in push mode in babylon JS
 * @internal
 */
export class PushMaterial extends Material {
    protected _activeEffect: Effect;

    protected _normalMatrix: Matrix = new Matrix();

    constructor(name: string, scene?: Scene, storeEffectOnSubMeshes = true) {
        super(name, scene);
        this._storeEffectOnSubMeshes = storeEffectOnSubMeshes;
    }

    public getEffect(): Effect {
        return this._storeEffectOnSubMeshes ? this._activeEffect : super.getEffect()!;
    }

    public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {
        if (!mesh) {
            return false;
        }

        if (!this._storeEffectOnSubMeshes) {
            return true;
        }

        if (!mesh.subMeshes || mesh.subMeshes.length === 0) {
            return true;
        }

        return this.isReadyForSubMesh(mesh, mesh.subMeshes[0], useInstances);
    }

    protected _isReadyForSubMesh(subMesh: SubMesh) {
        const defines = subMesh.materialDefines;
        if (!this.checkReadyOnEveryCall && subMesh.effect && defines) {
            if (defines._renderId === this.getScene().getRenderId()) {
                return true;
            }
        }

        return false;
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

    protected _afterBind(mesh?: Mesh, effect: Nullable<Effect> = null): void {
        super._afterBind(mesh, effect);
        this.getScene()._cachedEffect = effect;
    }

    protected _mustRebind(scene: Scene, effect: Effect, visibility: number = 1) {
        return scene.isCachedMaterialInvalid(this, effect, visibility);
    }
}

import { Nullable } from '../types';
import { IEffectFallbacks } from './iEffectFallbacks';

declare type Effect = import("./effect").Effect;
declare type AbstractMesh = import("../Meshes/abstractMesh").AbstractMesh;

/**
 * EffectFallbacks can be used to add fallbacks (properties to disable) to certain properties when desired to improve performance.
 * (Eg. Start at high quality with reflection and fog, if fps is low, remove reflection, if still low remove fog)
 */
export class EffectFallbacks implements IEffectFallbacks {
    private _defines: { [key: string]: Array<String> } = {};

    private _currentRank = 32;
    private _maxRank = -1;

    private _mesh: Nullable<AbstractMesh> = null;

    /**
     * Removes the fallback from the bound mesh.
     */
    public unBindMesh() {
        this._mesh = null;
    }

    /**
     * Adds a fallback on the specified property.
     * @param rank The rank of the fallback (Lower ranks will be fallbacked to first)
     * @param define The name of the define in the shader
     */
    public addFallback(rank: number, define: string): void {
        if (!this._defines[rank]) {
            if (rank < this._currentRank) {
                this._currentRank = rank;
            }

            if (rank > this._maxRank) {
                this._maxRank = rank;
            }

            this._defines[rank] = new Array<String>();
        }

        this._defines[rank].push(define);
    }

    /**
     * Sets the mesh to use CPU skinning when needing to fallback.
     * @param rank The rank of the fallback (Lower ranks will be fallbacked to first)
     * @param mesh The mesh to use the fallbacks.
     */
    public addCPUSkinningFallback(rank: number, mesh: AbstractMesh) {
        this._mesh = mesh;

        if (rank < this._currentRank) {
            this._currentRank = rank;
        }
        if (rank > this._maxRank) {
            this._maxRank = rank;
        }
    }

    /**
     * Checks to see if more fallbacks are still available.
     */
    public get hasMoreFallbacks(): boolean {
        return this._currentRank <= this._maxRank;
    }

    /**
     * Removes the defines that should be removed when falling back.
     * @param currentDefines defines the current define statements for the shader.
     * @param effect defines the current effect we try to compile
     * @returns The resulting defines with defines of the current rank removed.
     */
    public reduce(currentDefines: string, effect: Effect): string {
        // First we try to switch to CPU skinning
        if (this._mesh && this._mesh.computeBonesUsingShaders && this._mesh.numBoneInfluencers > 0) {
            this._mesh.computeBonesUsingShaders = false;
            currentDefines = currentDefines.replace("#define NUM_BONE_INFLUENCERS " + this._mesh.numBoneInfluencers, "#define NUM_BONE_INFLUENCERS 0");
            effect._bonesComputationForcedToCPU = true;

            var scene = this._mesh.getScene();
            for (var index = 0; index < scene.meshes.length; index++) {
                var otherMesh = scene.meshes[index];

                if (!otherMesh.material) {
                    if (!this._mesh.material && otherMesh.computeBonesUsingShaders && otherMesh.numBoneInfluencers > 0) {
                        otherMesh.computeBonesUsingShaders = false;
                    }
                    continue;
                }

                if (!otherMesh.computeBonesUsingShaders || otherMesh.numBoneInfluencers === 0) {
                    continue;
                }

                if (otherMesh.material.getEffect() === effect) {
                    otherMesh.computeBonesUsingShaders = false;
                } else if (otherMesh.subMeshes) {
                    for (var subMesh of otherMesh.subMeshes) {
                        let subMeshEffect = subMesh.effect;

                        if (subMeshEffect === effect) {
                            otherMesh.computeBonesUsingShaders = false;
                            break;
                        }
                    }
                }
            }
        }
        else {
            var currentFallbacks = this._defines[this._currentRank];
            if (currentFallbacks) {
                for (var index = 0; index < currentFallbacks.length; index++) {
                    currentDefines = currentDefines.replace("#define " + currentFallbacks[index], "");
                }
            }

            this._currentRank++;
        }

        return currentDefines;
    }
}
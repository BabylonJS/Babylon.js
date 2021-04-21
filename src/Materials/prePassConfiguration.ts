import { Matrix } from "../Maths/math.vector";
import { Mesh } from "../Meshes/mesh";
import { Scene } from "../scene";
import { Effect } from "../Materials/effect";
import { Constants } from "../Engines/constants";

/**
 * Configuration needed for prepass-capable materials
 */
export class PrePassConfiguration {
    /**
     * Previous world matrices of meshes carrying this material
     * Used for computing velocity
     */
    public previousWorldMatrices: { [index: number]: Matrix } = {};
    /**
     * Previous view project matrix
     * Used for computing velocity
     */
    public previousViewProjection: Matrix;
    /**
     * Current view projection matrix
     * Used for computing velocity
     */
    public currentViewProjection: Matrix;
    /**
     * Previous bones of meshes carrying this material
     * Used for computing velocity
     */
    public previousBones: { [index: number]: Float32Array } = {};

    /**
     * Add the required uniforms to the current list.
     * @param uniforms defines the current uniform list.
     */
    public static AddUniforms(uniforms: string[]): void {
        uniforms.push("previousWorld", "previousViewProjection");
    }

    /**
     * Add the required samplers to the current list.
     * @param samplers defines the current sampler list.
     */
    public static AddSamplers(samplers: string[]): void {
        // pass
    }

    /**
     * Binds the material data.
     * @param effect defines the effect to update
     * @param scene defines the scene the material belongs to.
     * @param mesh The mesh
     * @param world World matrix of this mesh
     * @param isFrozen Is the material frozen
     */
    public bindForSubMesh(effect: Effect, scene: Scene, mesh: Mesh, world: Matrix, isFrozen: boolean): void {
        if (scene.prePassRenderer && scene.prePassRenderer.enabled && scene.prePassRenderer.currentRTisSceneRT) {
            if (scene.prePassRenderer.getIndex(Constants.PREPASS_VELOCITY_TEXTURE_TYPE) !== -1) {
                if (!this.previousWorldMatrices[mesh.uniqueId]) {
                    this.previousWorldMatrices[mesh.uniqueId] = Matrix.Identity();
                }

                if (!this.previousViewProjection) {
                    this.previousViewProjection = scene.getTransformMatrix().clone();
                    this.currentViewProjection = scene.getTransformMatrix().clone();
                }

                if (this.currentViewProjection.updateFlag !== scene.getTransformMatrix().updateFlag) {
                    // First update of the prepass configuration for this rendering pass
                    this.previousViewProjection.copyFrom(this.currentViewProjection);
                    this.currentViewProjection.copyFrom(scene.getTransformMatrix());
                    this.currentViewProjection.updateFlag = scene.getTransformMatrix().updateFlag;
                }

                effect.setMatrix("previousWorld", this.previousWorldMatrices[mesh.uniqueId]);
                effect.setMatrix("previousViewProjection", this.previousViewProjection);

                this.previousWorldMatrices[mesh.uniqueId] = world.clone();
            }
        }
    }
}
import { Matrix } from "../Maths/math.vector";
import { Mesh } from "../Meshes/mesh";
import { Scene } from "../scene";
import { Effect } from "../Materials/effect";
import { Constants } from "../Engines/constants";

export class PrePassConfiguration {
    public previousWorldMatrices: { [index: number]: Matrix } = {};
    public previousViewProjection: Matrix;
    public previousBones: { [index: number]: Float32Array } = {};

    constructor() {

    }

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
     * @param effect defines theeffect to update
     * @param scene defines the scene the material belongs to.
     */
    public bindForSubMesh(effect: Effect, scene: Scene, mesh: Mesh, world: Matrix, isFrozen: boolean): void {
        if (scene.prePassRenderer && scene.prePassRenderer.enabled) {
            if (scene.prePassRenderer.getIndex(Constants.PREPASS_VELOCITY_TEXTURE_TYPE) !== -1) {
                if (!this.previousWorldMatrices[mesh.uniqueId]) {
                    this.previousWorldMatrices[mesh.uniqueId] = Matrix.Identity();
                }

                if (!this.previousViewProjection) {
                    this.previousViewProjection = scene.getTransformMatrix();
                }
                
                effect.setMatrix("previousWorld", this.previousWorldMatrices[mesh.uniqueId]);
                effect.setMatrix("previousViewProjection", this.previousViewProjection);

                this.previousWorldMatrices[mesh.uniqueId] = world.clone();
                this.previousViewProjection = scene.getTransformMatrix().clone();
            }
        }
    }
}
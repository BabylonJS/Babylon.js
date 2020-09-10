import { UniformBuffer } from "../../Materials/uniformBuffer";
import { Matrix } from "../../Maths/math.vector";
import { Mesh } from "../../Meshes/mesh";
import { Scene } from "../../scene";
import { Constants } from "../../Engines/constants";

export class PBRAdditionnalPrePassConfiguration {
    public previousWorldMatrices: { [index: number]: Matrix } = {};
    public previousViewProjection: Matrix;
    public previousBones: { [index: number]: number[] } = {};

    constructor() {

    }

    /**
     * Add the required uniforms to the current buffer.
     * @param uniformBuffer defines the current uniform buffer.
     */
    public static PrepareUniformBuffer(uniformBuffer: UniformBuffer): void {
        uniformBuffer.addUniform("previousWorld", 16);
        uniformBuffer.addUniform("previousViewProjection", 16);
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
     * @param uniformBuffer defines the Uniform buffer to fill in.
     * @param scene defines the scene the material belongs to.
     * @param engine defines the engine the material belongs to.
     * @param isFrozen defines whether the material is frozen or not.
     * @param lodBasedMicrosurface defines whether the material relies on lod based microsurface or not.
     * @param realTimeFiltering defines whether the textures should be filtered on the fly.
     */
    public bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, mesh: Mesh, world: Matrix, isFrozen: boolean): void {

        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            if (scene.prePassRenderer && scene.prePassRenderer.enabled) {
                if (scene.prePassRenderer.getIndex(Constants.PREPASS_VELOCITY_TEXTURE_TYPE) !== -1) {
                    if (!this.previousWorldMatrices[mesh.uniqueId]) {
                        this.previousWorldMatrices[mesh.uniqueId] = Matrix.Identity();
                    }

                    if (!this.previousViewProjection) {
                        this.previousViewProjection = scene.getTransformMatrix();
                    }
                    
                    uniformBuffer.updateMatrix("previousWorld", this.previousWorldMatrices[mesh.uniqueId]);
                    uniformBuffer.updateMatrix("previousViewProjection", this.previousViewProjection);

                    this.previousWorldMatrices[mesh.uniqueId] = world.clone();
                    this.previousViewProjection = scene.getTransformMatrix().clone();
                }
            }
        }

    }
}
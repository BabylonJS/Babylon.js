import { AnimationRange, RawTexture, Scene, Texture } from "..";
import { Mesh } from "../Meshes/mesh";

/**
 * Class to bake vertex animation textures.
 */
export class VertexAnimationBaker {
    private _scene: Scene;
    private _mesh: Mesh;

    /**
     *
     * @param scene Defines the scene the VAT belongs to
     * @param mesh Defines the mesh the VAT belongs to
     * @param skeleton Defines the skeleton the VAT belongs to
     */
    constructor(scene: Scene, mesh: Mesh) {
        this._scene = scene;
        this._mesh = mesh;
    }

    /**
     * Bakes the animation into the texture. This should be called once, when the
     * scene starts, so the VAT is generated and associated to the mesh.
     * @returns Float32Array
     */
    public async bakeVertexData(ranges: AnimationRange[]): Promise<Float32Array> {
        if (!this._mesh.skeleton) {
            throw new Error("No skeleton in this mesh.");
        }
        const boneCount = this._mesh.skeleton.bones.length;

        /** total number of frames in our animations */
        const frameCount = ranges.reduce((previous: number, current: AnimationRange) => previous + current.to - current.from + 1, 0);

        // reset our loop data
        let textureIndex = 0;
        const vertexData = new Float32Array((boneCount + 1) * 4 * 4 * frameCount);
        this._scene.stopAnimation(this._mesh);
        this._mesh.skeleton.returnToRest();

        // render all frames from our slices
        for (const range of ranges) {
            for (let frameIndex = range.from; frameIndex <= range.to; frameIndex++) {
                await this._executeAnimationFrame(vertexData, frameIndex, textureIndex++);
            }
        }

        // at this point we have the vertex data, so convert it to an actual texture
        // and build a material
        this._scene.stopAnimation(this._mesh);
        this._mesh.skeleton.returnToRest();
        return vertexData;
    }

    /**
     * Runs an animation frame and stores its vertex data
     *
     * @param vertexData The array to save data to.
     * @param frameIndex Current frame in the skeleton animation to render.
     * @param textureIndex Current index of the texture data.
     * @returns
     */
    private async _executeAnimationFrame(vertexData: Float32Array, frameIndex: number, textureIndex: number): Promise<void> {
        return new Promise<void>((resolve, _reject) => {
            this._scene.beginAnimation(this._mesh.skeleton, frameIndex, frameIndex, false, 1.0, () => {
                this._scene.render();

                // generate matrices
                const skeletonMatrices = this._mesh.skeleton!.getTransformMatrices(this._mesh);
                vertexData.set(skeletonMatrices, textureIndex * skeletonMatrices.length);

                resolve();
            });
        });
    }

    /**
     * Builds a vertex animation texture given the vertexData in an array.
     * @param vertexData
     * @returns RawTexture
     */
    public textureFromBakedVertexData(vertexData: Float32Array): RawTexture {
        if (!this._mesh.skeleton) {
            throw new Error("No skeleton in this mesh.");
        }
        const boneCount = this._mesh.skeleton.bones.length;

        return RawTexture.CreateRGBATexture(
            vertexData,
            (boneCount + 1) * 4,
            vertexData.length / ((boneCount + 1) * 4 * 4),
            this._scene,
            false,
            false,
            Texture.NEAREST_NEAREST,
            1
        );
    }
}

import type { AnimationRange } from "../Animations/animationRange";
import { RawTexture } from "../Materials/Textures/rawTexture";
import { Texture } from "../Materials/Textures/texture";
import type { Mesh } from "../Meshes/mesh";
import { EncodeArrayBufferToBase64, DecodeBase64ToBinary } from "../Misc/stringTools";
import type { Scene } from "../scene";
import { Constants } from "../Engines/constants";

/**
 * Class to bake vertex animation textures.
 * @since 5.0
 */
export class VertexAnimationBaker {
    private _scene: Scene;
    private _mesh: Mesh;

    /**
     * Create a new VertexAnimationBaker object which can help baking animations into a texture.
     * @param scene Defines the scene the VAT belongs to
     * @param mesh Defines the mesh the VAT belongs to
     */
    constructor(scene: Scene, mesh: Mesh) {
        this._scene = scene;
        this._mesh = mesh;
    }

    /**
     * Bakes the animation into the texture. This should be called once, when the
     * scene starts, so the VAT is generated and associated to the mesh.
     * @param ranges Defines the ranges in the animation that will be baked.
     * @returns The array of matrix transforms for each vertex (columns) and frame (rows), as a Float32Array.
     */
    public async bakeVertexData(ranges: AnimationRange[]): Promise<Float32Array> {
        if (!this._mesh.skeleton) {
            throw new Error("No skeleton in this mesh.");
        }
        const boneCount = this._mesh.skeleton.bones.length;

        /** total number of frames in our animations */
        const frameCount = ranges.reduce((previous: number, current: AnimationRange) => previous + current.to - current.from + 1, 0);

        if (isNaN(frameCount)) {
            throw new Error("Invalid animation ranges.");
        }

        // reset our loop data
        let textureIndex = 0;
        const textureSize = (boneCount + 1) * 4 * 4 * frameCount;
        const vertexData = new Float32Array(textureSize);
        this._scene.stopAnimation(this._mesh);
        this._mesh.skeleton.returnToRest();

        // render all frames from our slices
        for (const range of ranges) {
            for (let frameIndex = range.from; frameIndex <= range.to; frameIndex++) {
                await this._executeAnimationFrame(vertexData, frameIndex, textureIndex++);
            }
        }

        return vertexData;
    }

    /**
     * Runs an animation frame and stores its vertex data
     *
     * @param vertexData The array to save data to.
     * @param frameIndex Current frame in the skeleton animation to render.
     * @param textureIndex Current index of the texture data.
     */
    private async _executeAnimationFrame(vertexData: Float32Array, frameIndex: number, textureIndex: number): Promise<void> {
        return new Promise<void>((resolve, _reject) => {
            this._scene.beginAnimation(this._mesh.skeleton, frameIndex, frameIndex, false, 1.0, () => {
                // generate matrices
                const skeletonMatrices = this._mesh.skeleton!.getTransformMatrices(this._mesh);
                vertexData.set(skeletonMatrices, textureIndex * skeletonMatrices.length);

                resolve();
            });
        });
    }
    /**
     * Builds a vertex animation texture given the vertexData in an array.
     * @param vertexData The vertex animation data. You can generate it with bakeVertexData().
     * @returns The vertex animation texture to be used with BakedVertexAnimationManager.
     */
    public textureFromBakedVertexData(vertexData: Float32Array): RawTexture {
        if (!this._mesh.skeleton) {
            throw new Error("No skeleton in this mesh.");
        }
        const boneCount = this._mesh.skeleton.bones.length;

        const texture = RawTexture.CreateRGBATexture(
            vertexData,
            (boneCount + 1) * 4,
            vertexData.length / ((boneCount + 1) * 4 * 4),
            this._scene,
            false,
            false,
            Texture.NEAREST_NEAREST,
            Constants.TEXTURETYPE_FLOAT
        );
        texture.name = "VAT" + this._mesh.skeleton.name;
        return texture;
    }
    /**
     * Serializes our vertexData to an object, with a nice string for the vertexData.
     * @param vertexData The vertex array data.
     * @returns This object serialized to a JS dict.
     */
    public serializeBakedVertexDataToObject(vertexData: Float32Array): Record<string, any> {
        if (!this._mesh.skeleton) {
            throw new Error("No skeleton in this mesh.");
        }

        // this converts the float array to a serialized base64 string, ~1.3x larger
        // than the original.
        const boneCount = this._mesh.skeleton.bones.length;
        const width = (boneCount + 1) * 4;
        const height = vertexData.length / ((boneCount + 1) * 4 * 4);
        const data = {
            vertexData: EncodeArrayBufferToBase64(vertexData),
            width,
            height,
        };
        return data;
    }
    /**
     * Loads previously baked data.
     * @param data The object as serialized by serializeBakedVertexDataToObject()
     * @returns The array of matrix transforms for each vertex (columns) and frame (rows), as a Float32Array.
     */
    public loadBakedVertexDataFromObject(data: Record<string, any>): Float32Array {
        return new Float32Array(DecodeBase64ToBinary(data.vertexData));
    }
    /**
     * Serializes our vertexData to a JSON string, with a nice string for the vertexData.
     * Should be called right after bakeVertexData().
     * @param vertexData The vertex array data.
     * @returns This object serialized to a safe string.
     */
    public serializeBakedVertexDataToJSON(vertexData: Float32Array): string {
        return JSON.stringify(this.serializeBakedVertexDataToObject(vertexData));
    }
    /**
     * Loads previously baked data in string format.
     * @param json The json string as serialized by serializeBakedVertexDataToJSON().
     * @returns The array of matrix transforms for each vertex (columns) and frame (rows), as a Float32Array.
     */
    public loadBakedVertexDataFromJSON(json: string): Float32Array {
        return this.loadBakedVertexDataFromObject(JSON.parse(json));
    }
}

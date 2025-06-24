import type { AnimationRange } from "../Animations/animationRange";
import { RawTexture } from "../Materials/Textures/rawTexture";
import { Texture } from "../Materials/Textures/texture";
import type { Mesh } from "../Meshes/mesh";
import { EncodeArrayBufferToBase64, DecodeBase64ToBinary } from "../Misc/stringTools";
import type { Scene } from "../scene";
import { Constants } from "../Engines/constants";
import { Skeleton } from "core/Bones/skeleton";
import type { Nullable } from "core/types";
import { ToHalfFloat } from "../Misc/textureTools";
import { Logger } from "../Misc/logger";

/**
 * Class to bake vertex animation textures.
 * @since 5.0
 */
export class VertexAnimationBaker {
    private _scene: Scene;
    private _mesh: Nullable<Mesh>;
    private _skeleton: Nullable<Skeleton>;

    /**
     * Create a new VertexAnimationBaker object which can help baking animations into a texture.
     * @param scene Defines the scene the VAT belongs to
     * @param meshOrSkeleton Defines the skeleton or the mesh from which to retrieve the skeleton from.
     */
    constructor(scene: Scene, meshOrSkeleton: Mesh | Skeleton) {
        this._scene = scene;
        if (meshOrSkeleton instanceof Skeleton) {
            this._skeleton = meshOrSkeleton;
            this._mesh = null;
        } else {
            this._mesh = meshOrSkeleton;
            this._skeleton = meshOrSkeleton.skeleton;
        }
    }

    /**
     *
     * @param ranges Defines the ranges in the animation that will be baked.
     * @param halfFloat If true, the vertex data will be returned as half-float (Uint16Array), otherwise as full float (Float32Array).
     * @returns The array of matrix transforms for each vertex (columns) and frame (rows), as a Float32Array or Uint16Array.
     */
    public bakeVertexDataSync(ranges: AnimationRange[], halfFloat: boolean): Float32Array | Uint16Array {
        if (!this._skeleton) {
            throw new Error("No skeleton provided.");
        }
        const bones = this._skeleton.bones.length;
        const floatsPerFrame = (bones + 1) * 16;
        const totalFrames = ranges.reduce((sum, r) => sum + (Math.floor(r.to) - Math.floor(r.from) + 1), 0);

        const vertexData = halfFloat ? new Uint16Array(floatsPerFrame * totalFrames) : new Float32Array(floatsPerFrame * totalFrames);

        let frameIdx = 0;

        this._skeleton.returnToRest();

        for (const range of ranges) {
            for (let f = Math.floor(range.from); f <= Math.floor(range.to); f++) {
                this._scene.beginAnimation(this._skeleton, f, f, false, 1.0);
                this._scene.render();
                this._skeleton.computeAbsoluteMatrices(true);
                const matrices = this._skeleton.getTransformMatrices(this._mesh);
                const base = frameIdx * floatsPerFrame;
                if (halfFloat) {
                    matrices.forEach((val, i) => {
                        vertexData[base + i] = ToHalfFloat(val);
                    });
                } else {
                    matrices.forEach((val, i) => {
                        vertexData[base + i] = val;
                    });
                }
                frameIdx++;
            }
        }

        return vertexData;
    }

    /**
     * Bakes the animation into the texture. This should be called once, when the
     * scene starts, so the VAT is generated and associated to the mesh.
     * @param ranges Defines the ranges in the animation that will be baked.
     * @returns The array of matrix transforms for each vertex (columns) and frame (rows), as a Float32Array.
     */
    // async function, without Async suffix, to avoid breaking the API
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public async bakeVertexData(ranges: AnimationRange[]): Promise<Float32Array> {
        if (!this._skeleton) {
            throw new Error("No skeleton provided.");
        }
        const boneCount = this._skeleton.bones.length;

        /** total number of frames in our animations */
        const frameCount = ranges.reduce((previous: number, current: AnimationRange) => previous + current.to - current.from + 1, 0);

        if (isNaN(frameCount)) {
            throw new Error("Invalid animation ranges.");
        }

        // reset our loop data
        let textureIndex = 0;
        const textureSize = (boneCount + 1) * 4 * 4 * frameCount;
        const vertexData = new Float32Array(textureSize);
        this._scene.stopAnimation(this._skeleton);
        this._skeleton.returnToRest();

        // render all frames from our slices
        for (const range of ranges) {
            for (let frameIndex = range.from; frameIndex <= range.to; frameIndex++) {
                // eslint-disable-next-line no-await-in-loop
                await this._executeAnimationFrameAsync(vertexData, frameIndex, textureIndex++);
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
     * @returns A promise that resolves when the animation frame is done.
     */
    private async _executeAnimationFrameAsync(vertexData: Float32Array, frameIndex: number, textureIndex: number): Promise<void> {
        return await new Promise<void>((resolve, _reject) => {
            this._scene.beginAnimation(this._skeleton, frameIndex, frameIndex, false, 1.0, () => {
                // generate matrices
                const skeletonMatrices = this._skeleton!.getTransformMatrices(this._mesh);
                vertexData.set(skeletonMatrices, textureIndex * skeletonMatrices.length);

                resolve();
            });
        });
    }
    /**
     * Builds a vertex animation texture given the vertexData in an array.
     * @param vertexData The vertex animation data. You can generate it with bakeVertexData(). You can pass in a Float32Array to return a full precision texture, or a Uint16Array to return a half-float texture.
     * If you pass in a Uint16Array, make sure your device supports half-float textures
     * @returns The vertex animation texture to be used with BakedVertexAnimationManager.
     */
    public textureFromBakedVertexData(vertexData: Float32Array | Uint16Array): RawTexture {
        if (!this._skeleton) {
            throw new Error("No skeleton provided.");
        }
        const boneCount = this._skeleton.bones.length;

        if (vertexData instanceof Uint16Array) {
            if (!this._scene.getEngine().getCaps().textureHalfFloatRender) {
                Logger.Warn("VertexAnimationBaker: Half-float textures are not supported on this device");
            }
        }

        const texture = RawTexture.CreateRGBATexture(
            vertexData,
            (boneCount + 1) * 4,
            vertexData.length / ((boneCount + 1) * 4 * 4),
            this._scene,
            false,
            false,
            Texture.NEAREST_NEAREST,
            vertexData instanceof Float32Array ? Constants.TEXTURETYPE_FLOAT : Constants.TEXTURETYPE_HALF_FLOAT
        );
        texture.name = "VAT" + this._skeleton.name;
        return texture;
    }
    /**
     * Serializes our vertexData to an object, with a nice string for the vertexData.
     * @param vertexData The vertex array data.
     * @returns This object serialized to a JS dict.
     */
    public serializeBakedVertexDataToObject(vertexData: Float32Array): Record<string, any> {
        if (!this._skeleton) {
            throw new Error("No skeleton provided.");
        }

        // this converts the float array to a serialized base64 string, ~1.3x larger
        // than the original.
        const boneCount = this._skeleton.bones.length;
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

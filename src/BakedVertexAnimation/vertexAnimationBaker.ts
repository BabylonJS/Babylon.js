import { AnimationRange } from "../Animations/animationRange";
import { RawTexture } from "../Materials/Textures/rawTexture";
import { Texture } from "../Materials/Textures/texture";
import { Mesh } from "../Meshes/mesh";
import { Scene } from "../scene";
import { GenerateBase64StringFromPixelData } from "../Misc/copyTools";
import { DecodeBase64ToBinary } from "../Misc/stringTools";

/**
 * Class to bake vertex animation textures.
 */
export class VertexAnimationBaker {
    private _scene: Scene;
    private _mesh: Mesh;

    /**
     * Create a new VertexAnimationBaker object which can help baking animations into a texture.
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
     * @param ranges Defines the ranges in the animation that will be baked.
     * @returns Float32Array
     */
    public async bakeVertexData(ranges: AnimationRange[]): Promise<Float32Array> {
        if (!this._mesh.skeleton) {
            throw new Error("No skeleton in this mesh.");
        }
        const boneCount = this._mesh.skeleton.bones.length;

        /** total number of frames in our animations */
        const frameCount = ranges.reduce(
            (previous: number, current: AnimationRange) => previous + current.to - current.from + 1,
            0
        );

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
     * @returns
     */
    private async _executeAnimationFrame(vertexData: Float32Array, frameIndex: number, textureIndex: number): Promise<void> {
        return new Promise<void>((resolve, _reject) => {
            this._scene.beginAnimation(this._mesh.skeleton, frameIndex, frameIndex, false, 1.0, () => {
                this._mesh.skeleton!.prepare();

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
     * @returns RawTexture
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
            1
        );
        texture.name = "VAT" + this._mesh.skeleton.name;
        return texture;
    }
    /**
     * Serializes our vertexData to an object, with a nice string for the vertexData.
     * @param vertexData The vertex array data.
     * @returns Object
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
            vertexData: GenerateBase64StringFromPixelData(vertexData, { width, height }),
            width,
            height
        };
        return data;
    }
    /**
     * Loads previously baked data.
     * @param data The object as serialized by serializeBakedVertexDataToObject()
     * @returns self
     */
    public loadBakedVertexDataFromObject(data: Record<string, any>): Float32Array {
        const vertexData = new Float32Array(
            DecodeBase64ToBinary(data.vertexData)
        );
        return vertexData;
    }
    /**
     * Serializes our vertexData to a JSON string, with a nice string for the vertexData.
     * Should be called right after bakeVertexData(), since we release the vertexData
     * from memory on rebuild().
     * @param vertexData The vertex array data.
     * @returns string
     */
    public serializeBakedVertexDataToJSON(vertexData: Float32Array): string {
        return JSON.stringify(this.serializeBakedVertexDataToObject(vertexData));
    }
    /**
     * Loads previously baked data.
     * @param json The json string.
     * @returns self
     */
    public loadBakedVertexDataFromJSON(json: string): Float32Array {
        return this.loadBakedVertexDataFromObject(JSON.parse(json));
    }
}

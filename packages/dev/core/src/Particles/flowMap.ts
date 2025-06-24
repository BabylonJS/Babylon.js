import { Matrix, Vector3 } from "../Maths/math.vector";
import type { Particle } from "../Particles/particle";
import type { IVector3Like } from "../Maths/math.like";
import type { Texture } from "core/Materials/Textures/texture";
import { TextureTools } from "core/Misc/textureTools";

const FlowVector = new Vector3(0, 0, 0);
const ScaledFlowVector = new Vector3(0, 0, 0);
const ScreenPos = new Vector3(0, 0, 0);

/**
 * Represents an object that can move or be influenced by FlowMap
 */
export interface IFlowable {
    /**
     * The direction vector indicating the flow or movement direction of the object.
     */
    direction: Vector3;

    /**
     * The current position of the object in 3D space.
     */
    position: Vector3;
}

/**
 * Class used to represent a particle flow map.
 * #5DM02T#7
 * GPUParts: #5DM02T#12 (webgl2)
 * GPUParts: #5DM02T#13 (webgpu)
 */
export class FlowMap {
    /**
     * Create a new flow map.
     * @param width defines the width of the flow map
     * @param height defines the height of the flow map
     * @param data defines the data of the flow map
     */
    constructor(
        public readonly width: number,
        public readonly height: number,
        public readonly data: Uint8ClampedArray
    ) {}

    public processFlowable(flowable: IFlowable, strength = 1, flowMapSamplePosOrTransformationMatrix?: IVector3Like | Matrix) {
        if (!flowMapSamplePosOrTransformationMatrix) {
            return;
        }

        // Convert world pos to screen pos
        if (flowMapSamplePosOrTransformationMatrix instanceof Matrix) {
            Vector3.TransformCoordinatesToRef(flowable.position, flowMapSamplePosOrTransformationMatrix, ScreenPos);
        } else {
            ScreenPos.x = flowMapSamplePosOrTransformationMatrix.x;
            ScreenPos.y = flowMapSamplePosOrTransformationMatrix.y;
            ScreenPos.z = flowMapSamplePosOrTransformationMatrix.z;
        }

        const u = ScreenPos.x * 0.5 + 0.5;
        const v = 1.0 - (ScreenPos.y * 0.5 + 0.5);

        const x = Math.floor(u * this.width);
        const y = Math.floor(v * this.height);

        // Clamp
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return;
        }

        const index = (y * this.width + x) * 4;
        const r = this.data[index];
        const g = this.data[index + 1];
        const b = this.data[index + 2];
        const a = this.data[index + 3];

        const fx = (r / 255.0) * 2.0 - 1.0;
        const fy = (g / 255.0) * 2.0 - 1.0;
        const fz = (b / 255.0) * 2.0 - 1.0;
        const localStrength = a / 255.0;

        FlowVector.set(fx, fy, fz);
        FlowVector.scaleToRef(strength * localStrength, ScaledFlowVector);

        flowable.direction.addInPlace(ScaledFlowVector); // Update IFlowable velocity
    }

    /** @internal */
    public _processParticle(particle: Particle, strength = 1, matrix?: Matrix) {
        this.processFlowable(particle, strength, matrix);
    }

    /**
     * Creates a FlowMap from a url.
     * @param url The url of the image to load
     * @returns a promise that resolves to a FlowMap object
     */
    public static async FromUrlAsync(url: string): Promise<FlowMap> {
        return await new Promise((resolve, reject) => {
            const flowCanvas = document.createElement("canvas");
            const flowCtx = flowCanvas.getContext("2d")!;
            let flowImageData = null;

            const flowMapImage = new Image();
            flowMapImage.crossOrigin = "anonymous"; // If loading from another domain
            flowMapImage.src = url;

            flowMapImage.onerror = (e) => {
                reject(new Error(`Failed to load image: ${url} : ${e}`));
            };

            flowMapImage.onload = () => {
                flowCanvas.width = flowMapImage.width;
                flowCanvas.height = flowMapImage.height;
                flowCtx.drawImage(flowMapImage, 0, 0);
                flowImageData = flowCtx.getImageData(0, 0, flowCanvas.width, flowCanvas.height);

                resolve(new FlowMap(flowCanvas.width, flowCanvas.height, flowImageData.data));
            };
        });
    }

    /**
     * Load from a texture
     * @param texture defines the source texture
     * @returns a promise fulfilled when image data is loaded
     */
    public static async ExtractFromTextureAsync(texture: Texture) {
        return await new Promise<FlowMap>((resolve, reject) => {
            if (!texture.isReady()) {
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                texture.onLoadObservable.addOnce(async () => {
                    try {
                        const result = await this.ExtractFromTextureAsync(texture);
                        resolve(result);
                    } catch (e) {
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject(e);
                    }
                });
                return;
            }
            const size = texture.getSize();
            TextureTools.GetTextureDataAsync(texture, size.width, size.height)
                // eslint-disable-next-line github/no-then
                .then((data) => {
                    resolve(new FlowMap(size.width, size.height, new Uint8ClampedArray(data)));
                })
                // eslint-disable-next-line github/no-then
                .catch(reject);
        });
    }
}

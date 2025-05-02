import { Matrix, Vector3 } from "core/Maths/math.vector";
import type { Particle } from "./particle";
import type { ThinParticleSystem } from "./thinParticleSystem";

const FlowVector = new Vector3(0, 0, 0);
const ScaledFlowVector = new Vector3(0, 0, 0);
const ScreenPos = new Vector3(0, 0, 0);

/**
 * Class used to represent a particle flow map.
 * #5DM02T#7
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

    /** @internal */
    public _processParticle(particle: Particle, system: ThinParticleSystem, strength = 1) {
        const scene = system.getScene()!;
        const camera = scene.activeCamera!;
        const engine = scene.getEngine();
        const renderWidth = engine.getRenderWidth();
        const renderHeight = engine.getRenderHeight();

        // Convert world pos to screen pos
        Vector3.ProjectToRef(particle.position, Matrix.IdentityReadOnly, scene.getTransformMatrix(), camera.viewport.toGlobal(renderWidth, renderHeight), ScreenPos);

        const u = ScreenPos.x / renderWidth;
        const v = ScreenPos.y / renderHeight; // Flip Y

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
        FlowVector.scaleToRef(system._tempScaledUpdateSpeed * strength * localStrength, ScaledFlowVector);

        particle.direction.addInPlace(ScaledFlowVector); // Update particle velocity
    }

    /**
     * Creates a FlowMap from a url.
     * @param url The url of the image to load
     * @returns a promise that resolves to a FlowMap object
     */
    public static async FromUrlAsync(url: string): Promise<FlowMap> {
        return new Promise((resolve, reject) => {
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
}

/** This file must only contain pure code and pure imports */

import { type Scene } from "core/scene.pure";
import { ShaderMaterial } from "core/Materials/shaderMaterial.pure";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Constants } from "core/Engines/constants";
import { type StorageBuffer } from "core/Buffers/storageBuffer";
import { Vector2, Vector4 } from "core/Maths/math.vector.pure";

/**
 * Composites the resolved Gaussian Point Splatting color over the scene with a fullscreen triangle.
 * The result depth-tests against the scene without writing depth. WebGPU only.
 */
export class GaussianPointSplattingBlitMaterial extends ShaderMaterial {
    // Reused per-frame uniform value; ShaderMaterial keeps a reference to it.
    private readonly _resolution = new Vector2();
    private readonly _projZ = new Vector4();

    /**
     * Creates a new blit material.
     * @param name material name
     * @param scene hosting scene
     */
    constructor(name: string, scene: Scene) {
        super(
            name,
            scene,
            { vertex: "gaussianPointSplattingBlit", fragment: "gaussianPointSplattingBlit" },
            {
                attributes: ["position"],
                uniforms: ["resolution", "projZ", "logarithmicDepthConstant"],
                storageBuffers: ["accumBuffer", "accumDepth"],
                shaderLanguage: ShaderLanguage.WGSL,
                needAlphaBlending: true,
            }
        );

        this.backFaceCulling = false;
        this.alphaMode = Constants.ALPHA_PREMULTIPLIED;
        this.setFloat("logarithmicDepthConstant", 0);
    }

    /**
     * Binds the resolved accumulation buffer (premultiplied color + coverage) to sample from.
     * @param buffer the renderer's accumulation buffer
     */
    public setAccumBuffer(buffer: StorageBuffer): void {
        this.setStorageBuffer("accumBuffer", buffer);
    }

    /**
     * Binds the resolved per-pixel surface depth buffer used for fragDepth compositing.
     * @param buffer the renderer's accumulation depth buffer
     */
    public setAccumDepthBuffer(buffer: StorageBuffer): void {
        this.setStorageBuffer("accumDepth", buffer);
    }

    /**
     * Sets the render resolution used to index the accumulation buffer.
     * @param width render width in pixels
     * @param height render height in pixels
     */
    public setResolution(width: number, height: number): void {
        this.setVector2("resolution", this._resolution.set(width, height));
    }

    /**
     * Sets the active camera's projection matrix z-row, used to recover clip-space w for logarithmic depth.
     * @param m10 projection matrix element [10]
     * @param m11 projection matrix element [11]
     * @param m14 projection matrix element [14]
     * @param m15 projection matrix element [15]
     */
    public setProjectionZ(m10: number, m11: number, m14: number, m15: number): void {
        this.setVector4("projZ", this._projZ.set(m10, m11, m14, m15));
    }

    /**
     * Sets the logarithmic depth constant (2 / log2(camera.maxZ + 1)) so the composite depth-tests against
     * scenes rendered with logarithmic depth. 0 keeps the regular NDC depth.
     * @param constant the logarithmic depth constant, or 0 to disable
     */
    public setLogarithmicDepthConstant(constant: number): void {
        this.setFloat("logarithmicDepthConstant", constant);
    }
}

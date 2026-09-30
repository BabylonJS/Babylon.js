/** This file must only contain pure code and pure imports */

import { type Scene } from "core/scene.pure";
import { ShaderMaterial } from "core/Materials/shaderMaterial.pure";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Constants } from "core/Engines/constants";
import { type StorageBuffer } from "core/Buffers/storageBuffer";
import { Vector2, Vector4 } from "core/Maths/math.vector.pure";

/**
 * Writes resolved Gaussian Point Splatting depth into a DepthRenderer map with a fullscreen triangle.
 * Samples coverage and NDC depth from storage buffers, emits the DepthRenderer linear metric in red, and
 * writes fragDepth for depth-test composition. WebGPU only.
 *
 * This is opaque nearest-surface depth, not the coverage-weighted `DepthRenderer.alphaBlendedDepth`
 * result from the classic raster path. It can jitter between Gaussians at the visible surface, so it is
 * suitable for SSAO/DOF/AOV but not exact depth equality.
 */
export class GaussianPointSplattingDepthBlitMaterial extends ShaderMaterial {
    // Reused per-frame uniform values; ShaderMaterial keeps references to them.
    private readonly _resolution = new Vector2();
    private readonly _projZ = new Vector4();
    private readonly _depthValues = new Vector2();

    /**
     * Creates a new depth blit material.
     * @param name material name
     * @param scene hosting scene
     */
    constructor(name: string, scene: Scene) {
        super(
            name,
            scene,
            { vertex: "gaussianPointSplattingBlit", fragment: "gaussianPointSplattingDepthBlit" },
            {
                attributes: ["position"],
                uniforms: ["resolution", "depthValues", "projZ", "reverseDepth"],
                storageBuffers: ["accumBuffer", "accumDepth"],
                shaderLanguage: ShaderLanguage.WGSL,
                needAlphaBlending: false,
            }
        );

        // Fullscreen pass; depth writes are kept so the blit composes against meshes already in the depth map.
        this.backFaceCulling = false;
        this.alphaMode = Constants.ALPHA_DISABLE;
        this.forceDepthWrite = true;
    }

    /**
     * Binds the resolved accumulation buffer; only its coverage channel is read, to reject empty pixels.
     * @param buffer the renderer's accumulation buffer
     */
    public setAccumBuffer(buffer: StorageBuffer): void {
        this.setStorageBuffer("accumBuffer", buffer);
    }

    /**
     * Binds the resolved per-pixel surface depth buffer (NDC z).
     * @param buffer the renderer's accumulation depth buffer
     */
    public setAccumDepthBuffer(buffer: StorageBuffer): void {
        this.setStorageBuffer("accumDepth", buffer);
    }

    /**
     * Sets the render resolution used to index the accumulation buffers.
     * @param width render width in pixels
     * @param height render height in pixels
     */
    public setResolution(width: number, height: number): void {
        this.setVector2("resolution", this._resolution.set(width, height));
    }

    /**
     * Sets the active camera's projection matrix z-row, used to recover clip-space z from the stored NDC z.
     * @param m10 projection matrix element [10]
     * @param m11 projection matrix element [11]
     * @param m14 projection matrix element [14]
     * @param m15 projection matrix element [15]
     */
    public setProjectionZ(m10: number, m11: number, m14: number, m15: number): void {
        this.setVector4("projZ", this._projZ.set(m10, m11, m14, m15));
    }

    /**
     * Sets the depth renderer's (minZ, minZ + maxZ) normalization pair.
     * @param minZ the depth metric offset
     * @param minZPlusMaxZ the depth metric divisor
     */
    public setDepthValues(minZ: number, minZPlusMaxZ: number): void {
        this.setVector2("depthValues", this._depthValues.set(minZ, minZPlusMaxZ));
    }

    /**
     * Sets whether the engine uses a reverse depth buffer (negates clip-space z in the metric).
     * @param reverse true when the engine uses a reverse depth buffer
     */
    public setReverseDepth(reverse: boolean): void {
        this.setFloat("reverseDepth", reverse ? 1 : 0);
    }
}

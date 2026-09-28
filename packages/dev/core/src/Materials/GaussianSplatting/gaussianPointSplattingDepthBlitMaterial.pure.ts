/** This file must only contain pure code and pure imports */

import { type Scene } from "core/scene.pure";
import { ShaderMaterial } from "core/Materials/shaderMaterial.pure";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Constants } from "core/Engines/constants";
import { type StorageBuffer } from "core/Buffers/storageBuffer";

/**
 * Writes the Gaussian Point Splatting resolved depth into a DepthRenderer's depth map with a fullscreen
 * triangle. It reuses the point-splatting blit vertex shader (camera-independent clip-space passthrough)
 * and reads the resolved coverage + NDC depth from read-only storage buffers, emitting the DepthRenderer's
 * linear depth metric in the red channel and the NDC depth as fragDepth. WebGPU only.
 *
 * Note that this depth is OPAQUE and is NOT the alpha-blended depth the classic path produces under
 * `DepthRenderer.alphaBlendedDepth`. The classic material emits every overlapping ellipsoid with its
 * Gaussian opacity and alpha-composites them, so its value is a coverage-weighted average over the cloud
 * (pulled backwards by the farther Gaussians and by the residual-transmittance background term). The
 * compute instead resolves visibility with a per-pixel atomic depth-min, so each covered pixel carries the
 * depth of a single Gaussian — the nearest visible surface.
 *
 * Two consequences worth knowing for depth consumers:
 * - It converges to the nearest surface, not to the classic blend. The two differ by a few percent of the
 *   depth metric, and the difference is largest (not smallest) where a single opaque Gaussian dominates,
 *   because that is where the classic blend is most diluted by the background.
 * - The value never fully settles. The frame's winner is drawn with the alpha-compositing probabilities,
 *   so it keeps hopping between the depths of the Gaussians clustered at that surface (plus the 16-bit
 *   view-z key quantization). The residual jitter is roughly an order of magnitude smaller than the offset
 *   from the classic blend, which is fine for SSAO/DOF/AOV but not for exact depth equality.
 */
export class GaussianPointSplattingDepthBlitMaterial extends ShaderMaterial {
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

        // Fullscreen pass: never cull. The depth map is opaque (one resolved surface per pixel), and depth
        // writes are kept so the blit z-tests/composes against ordinary meshes already in the depth map.
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
        this.setVector2("resolution", { x: width, y: height });
    }

    /**
     * Sets the active camera's projection matrix z-row, used to recover clip-space z from the stored NDC z.
     * @param m10 projection matrix element [10]
     * @param m11 projection matrix element [11]
     * @param m14 projection matrix element [14]
     * @param m15 projection matrix element [15]
     */
    public setProjectionZ(m10: number, m11: number, m14: number, m15: number): void {
        this.setVector4("projZ", { x: m10, y: m11, z: m14, w: m15 });
    }

    /**
     * Sets the depth renderer's (minZ, minZ + maxZ) normalization pair.
     * @param minZ the depth metric offset
     * @param minZPlusMaxZ the depth metric divisor
     */
    public setDepthValues(minZ: number, minZPlusMaxZ: number): void {
        this.setVector2("depthValues", { x: minZ, y: minZPlusMaxZ });
    }

    /**
     * Sets whether the engine uses a reverse depth buffer (negates clip-space z in the metric).
     * @param reverse true when the engine uses a reverse depth buffer
     */
    public setReverseDepth(reverse: boolean): void {
        this.setFloat("reverseDepth", reverse ? 1 : 0);
    }
}

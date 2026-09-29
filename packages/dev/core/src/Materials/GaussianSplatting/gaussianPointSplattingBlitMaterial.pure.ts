/** This file must only contain pure code and pure imports */

import { type Scene } from "core/scene.pure";
import { ShaderMaterial } from "core/Materials/shaderMaterial.pure";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Constants } from "core/Engines/constants";
import { type StorageBuffer } from "core/Buffers/storageBuffer";

/**
 * Composites the Gaussian Point Splatting accumulation buffer onto the target with a fullscreen
 * triangle. The vertex shader passes clip-space positions straight through (camera-independent); the
 * fragment shader reads the resolved premultiplied color + coverage from a read-only storage buffer
 * (indexed by a resolution-independent screen UV) and premultiplied-alpha-blends it over the scene,
 * depth-testing against the resolved surface without writing color-pass depth. WebGPU only.
 */
export class GaussianPointSplattingBlitMaterial extends ShaderMaterial {
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
                uniforms: ["resolution"],
                storageBuffers: ["accumBuffer", "accumDepth"],
                shaderLanguage: ShaderLanguage.WGSL,
                needAlphaBlending: true,
            }
        );

        // Fullscreen pass: never cull. Premultiplied-alpha blend the accumulated coverage over the scene.
        this.backFaceCulling = false;
        this.alphaMode = Constants.ALPHA_PREMULTIPLIED;
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
        this.setVector2("resolution", { x: width, y: height });
    }
}

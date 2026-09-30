/** This file must only contain pure code and pure imports */

import { type Scene } from "core/scene.pure";
import { ShaderMaterial } from "core/Materials/shaderMaterial.pure";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Constants } from "core/Engines/constants";
import { type StorageBuffer } from "core/Buffers/storageBuffer";
import { Vector2 } from "core/Maths/math.vector.pure";

/**
 * Composites the resolved Gaussian Point Splatting color over the scene with a fullscreen triangle.
 * The result depth-tests against the scene without writing depth. WebGPU only.
 */
export class GaussianPointSplattingBlitMaterial extends ShaderMaterial {
    // Reused per-frame uniform value; ShaderMaterial keeps a reference to it.
    private readonly _resolution = new Vector2();

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
        this.setVector2("resolution", this._resolution.set(width, height));
    }
}

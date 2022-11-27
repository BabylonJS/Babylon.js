import { VertexBuffer } from "core/Buffers/buffer";
import { Constants } from "core/Engines/constants";
import { EffectWrapper } from "core/Materials/effectRenderer";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";

import { FluidRenderingObject } from "./fluidRenderingObject";

/**
 * Defines a rendering object based on a list of vertex buffers
 * The list must contain at least a "position" buffer!
 */
export class FluidRenderingObjectVertexBuffer extends FluidRenderingObject {
    private _numParticles: number;
    private _disposeVBOffset: boolean;
    private _diffuseEffectWrapper: Nullable<EffectWrapper>;

    /**
     * Gets the name of the class
     */
    public getClassName(): string {
        return "FluidRenderingObjectVertexBuffer";
    }

    /**
     * Creates a new instance of the class
     * @param scene The scene the particles should be rendered into
     * @param vertexBuffers The list of vertex buffers (should contain at least a "position" buffer!)
     * @param numParticles Number of vertices to take into account from the buffers
     */
    constructor(scene: Scene, public readonly vertexBuffers: { [key: string]: VertexBuffer }, numParticles: number) {
        super(scene);

        this._numParticles = numParticles;
        this._disposeVBOffset = false;
        this._diffuseEffectWrapper = null;

        if (!vertexBuffers["offset"]) {
            vertexBuffers["offset"] = new VertexBuffer(this._engine, [0, 0, 1, 0, 0, 1, 1, 1], "offset", false, false, 2);
            this._disposeVBOffset = true;
        }
    }

    protected _createEffects(): void {
        super._createEffects();

        const uniformNames = ["view", "projection", "size"];
        const attributeNames = ["position", "offset", "color"];

        this._diffuseEffectWrapper = new EffectWrapper({
            engine: this._engine,
            useShaderStore: true,
            vertexShader: "fluidRenderingParticleDiffuse",
            fragmentShader: "fluidRenderingParticleDiffuse",
            attributeNames,
            uniformNames,
            samplerNames: [],
        });
    }

    /**
     * Indicates if the object is ready to be rendered
     * @returns True if everything is ready for the object to be rendered, otherwise false
     */
    public isReady(): boolean {
        return super.isReady() && (this._diffuseEffectWrapper?.effect!.isReady() ?? false);
    }

    /**
     * Gets the number of particles in this object
     * @returns The number of particles
     */
    public numParticles(): number {
        return this._numParticles;
    }

    /**
     * Sets the number of particles in this object
     * @param num The number of particles to take into account
     */
    public setNumParticles(num: number) {
        this._numParticles = num;
    }

    /**
     * Render the diffuse texture for this object
     */
    public renderDiffuseTexture(): void {
        const numParticles = this.numParticles();

        if (!this._diffuseEffectWrapper || numParticles === 0) {
            return;
        }

        const diffuseDrawWrapper = this._diffuseEffectWrapper._drawWrapper;
        const diffuseEffect = diffuseDrawWrapper.effect!;

        this._engine.enableEffect(diffuseDrawWrapper);
        this._engine.bindBuffers(this.vertexBuffers, this.indexBuffer, diffuseEffect);

        diffuseEffect.setMatrix("view", this._scene.getViewMatrix());
        diffuseEffect.setMatrix("projection", this._scene.getProjectionMatrix());
        if (this._particleSize !== null) {
            diffuseEffect.setFloat2("size", this._particleSize, this._particleSize);
        }

        if (this.useInstancing) {
            this._engine.drawArraysType(Constants.MATERIAL_TriangleStripDrawMode, 0, 4, numParticles);
        } else {
            this._engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, numParticles);
        }
    }

    /**
     * Releases the ressources used by the class
     */
    public dispose(): void {
        super.dispose();

        this._diffuseEffectWrapper?.dispose();

        if (this._disposeVBOffset) {
            this.vertexBuffers["offset"].dispose();
        }
    }
}

import type { VertexBuffer } from "core/Buffers/buffer";
import type { DataBuffer } from "core/Buffers/dataBuffer";
import { Constants } from "core/Engines/constants";
import type { Engine } from "core/Engines/engine";
import { EffectWrapper } from "core/Materials/effectRenderer";
import { Observable } from "core/Misc/observable";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";

/**
 * Defines the base object used for fluid rendering.
 * It is based on a list of vertices (particles)
 */
export abstract class FluidRenderingObject {
    protected _scene: Scene;
    protected _engine: Engine;
    protected _effectsAreDirty: boolean;
    protected _depthEffectWrapper: Nullable<EffectWrapper>;
    protected _thicknessEffectWrapper: Nullable<EffectWrapper>;

    /** Defines the priority of the object. Objects will be rendered in ascending order of priority */
    public priority = 0;

    protected _particleSize = 0.1;

    /** Observable triggered when the size of the particle is changed */
    public onParticleSizeChanged = new Observable<FluidRenderingObject>();

    /** Gets or sets the size of the particle */
    public get particleSize() {
        return this._particleSize;
    }

    public set particleSize(size: number) {
        if (size === this._particleSize) {
            return;
        }

        this._particleSize = size;
        this.onParticleSizeChanged.notifyObservers(this);
    }

    /** Defines the alpha value of a particle */
    public particleThicknessAlpha = 0.05;

    /** Indicates if the object uses instancing or not */
    public get useInstancing() {
        return !this.indexBuffer;
    }

    private _useVelocity = false;

    /** Indicates if velocity of particles should be used when rendering the object. The vertex buffer set must contain a "velocity" buffer for this to work! */
    public get useVelocity() {
        return this._useVelocity;
    }

    public set useVelocity(use: boolean) {
        if (this._useVelocity === use || !this._hasVelocity()) {
            return;
        }

        this._useVelocity = use;
        this._effectsAreDirty = true;
    }

    private _hasVelocity() {
        return !!this.vertexBuffers?.velocity;
    }

    /**
     * Gets the vertex buffers
     */
    public abstract get vertexBuffers(): { [key: string]: VertexBuffer };

    /**
     * Gets the index buffer (or null if the object is using instancing)
     */
    public get indexBuffer(): Nullable<DataBuffer> {
        return null;
    }

    /**
     * @returns the name of the class
     */
    public getClassName(): string {
        return "FluidRenderingObject";
    }

    /**
     * Instantiates a fluid rendering object
     * @param scene The scene the object is part of
     */
    constructor(scene: Scene) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._effectsAreDirty = true;
        this._depthEffectWrapper = null;
        this._thicknessEffectWrapper = null;
    }

    protected _createEffects(): void {
        const uniformNames = ["view", "projection", "particleRadius", "size"];
        const attributeNames = ["position", "offset"];
        const defines: string[] = [];

        this._effectsAreDirty = false;

        if (this.useVelocity) {
            attributeNames.push("velocity");
            defines.push("#define FLUIDRENDERING_VELOCITY");
        }

        if (this._scene.useRightHandedSystem) {
            defines.push("#define FLUIDRENDERING_RHS");
        }

        this._depthEffectWrapper = new EffectWrapper({
            engine: this._engine,
            useShaderStore: true,
            vertexShader: "fluidRenderingParticleDepth",
            fragmentShader: "fluidRenderingParticleDepth",
            attributeNames,
            uniformNames,
            samplerNames: [],
            defines,
        });

        uniformNames.push("particleAlpha");

        this._thicknessEffectWrapper = new EffectWrapper({
            engine: this._engine,
            useShaderStore: true,
            vertexShader: "fluidRenderingParticleThickness",
            fragmentShader: "fluidRenderingParticleThickness",
            attributeNames: ["position", "offset"],
            uniformNames,
            samplerNames: [],
        });
    }

    /**
     * Indicates if the object is ready to be rendered
     * @returns True if everything is ready for the object to be rendered, otherwise false
     */
    public isReady(): boolean {
        if (this._effectsAreDirty) {
            this._createEffects();
        }

        if (!this._depthEffectWrapper || !this._thicknessEffectWrapper) {
            return false;
        }

        const depthEffect = this._depthEffectWrapper._drawWrapper.effect!;
        const thicknessEffect = this._thicknessEffectWrapper._drawWrapper.effect!;

        return depthEffect.isReady() && thicknessEffect.isReady();
    }

    /**
     * Gets the number of particles (vertices) of this object
     * @returns The number of particles
     */
    public abstract get numParticles(): number;

    /**
     * Render the depth texture for this object
     */
    public renderDepthTexture(): void {
        const numParticles = this.numParticles;

        if (!this._depthEffectWrapper || numParticles === 0) {
            return;
        }

        const depthDrawWrapper = this._depthEffectWrapper._drawWrapper;
        const depthEffect = depthDrawWrapper.effect!;

        this._engine.enableEffect(depthDrawWrapper);
        this._engine.bindBuffers(this.vertexBuffers, this.indexBuffer, depthEffect);

        depthEffect.setMatrix("view", this._scene.getViewMatrix());
        depthEffect.setMatrix("projection", this._scene.getProjectionMatrix());
        depthEffect.setFloat2("size", this._particleSize, this._particleSize);
        depthEffect.setFloat("particleRadius", this._particleSize / 2);

        if (this.useInstancing) {
            this._engine.drawArraysType(Constants.MATERIAL_TriangleStripDrawMode, 0, 4, numParticles);
        } else {
            this._engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, numParticles);
        }
    }

    /**
     * Render the thickness texture for this object
     */
    public renderThicknessTexture(): void {
        const numParticles = this.numParticles;

        if (!this._thicknessEffectWrapper || numParticles === 0) {
            return;
        }

        const thicknessDrawWrapper = this._thicknessEffectWrapper._drawWrapper;
        const thicknessEffect = thicknessDrawWrapper.effect!;

        this._engine.setAlphaMode(Constants.ALPHA_ONEONE);
        this._engine.setDepthWrite(false);

        this._engine.enableEffect(thicknessDrawWrapper);
        this._engine.bindBuffers(this.vertexBuffers, this.indexBuffer, thicknessEffect);

        thicknessEffect.setMatrix("view", this._scene.getViewMatrix());
        thicknessEffect.setMatrix("projection", this._scene.getProjectionMatrix());
        thicknessEffect.setFloat("particleAlpha", this.particleThicknessAlpha);
        thicknessEffect.setFloat2("size", this._particleSize, this._particleSize);

        if (this.useInstancing) {
            this._engine.drawArraysType(Constants.MATERIAL_TriangleStripDrawMode, 0, 4, numParticles);
        } else {
            this._engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, numParticles);
        }

        this._engine.setDepthWrite(true);
        this._engine.setAlphaMode(Constants.ALPHA_DISABLE);
    }

    /**
     * Render the diffuse texture for this object
     */
    public renderDiffuseTexture(): void {
        // do nothing by default
    }

    /**
     * Releases the ressources used by the class
     */
    public dispose(): void {
        this._depthEffectWrapper?.dispose();
        this._thicknessEffectWrapper?.dispose();
    }
}

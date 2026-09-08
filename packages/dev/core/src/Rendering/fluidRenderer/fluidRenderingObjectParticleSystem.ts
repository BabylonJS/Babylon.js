import { VertexBuffer } from "core/Buffers/buffer";
import { type DataBuffer } from "core/Buffers/dataBuffer";
import { Constants } from "core/Engines/constants";
import { type Effect } from "core/Materials/effect";
import { type Observer } from "core/Misc/observable";
import { type IParticleSystem } from "core/Particles/IParticleSystem";
import { type Scene } from "core/scene";
import { type Nullable } from "core/types";

import { FluidRenderingObject } from "./fluidRenderingObject";
import { type ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Defines a rendering object based on a particle system
 */
export class FluidRenderingObjectParticleSystem extends FluidRenderingObject {
    private _particleSystem: IParticleSystem;
    private _originalRender: () => number;
    private _blendMode: number;
    private _onBeforeDrawParticleObserver: Nullable<Observer<Nullable<Effect>>>;
    private _updateInAnimate: boolean;
    private _offsetBuffer: Nullable<VertexBuffer>;
    private _vertexBuffersWithOffset: WeakMap<object, { [key: string]: VertexBuffer }>;

    /** Gets the particle system */
    public get particleSystem() {
        return this._particleSystem;
    }

    /**
     * @returns the name of the class
     */
    public override getClassName(): string {
        return "FluidRenderingObjectParticleSystem";
    }

    private _useTrueRenderingForDiffuseTexture = true;

    /**
     * Gets or sets a boolean indicating that the diffuse texture should be generated based on the regular rendering of the particle system (default: true).
     * Sometimes, generating the diffuse texture this way may be sub-optimal. In that case, you can disable this property, in which case the particle system will be
     * rendered using a ALPHA_COMBINE mode instead of the one used by the particle system.
     */
    public get useTrueRenderingForDiffuseTexture() {
        return this._useTrueRenderingForDiffuseTexture;
    }

    public set useTrueRenderingForDiffuseTexture(use: boolean) {
        if (this._useTrueRenderingForDiffuseTexture === use) {
            return;
        }

        this._useTrueRenderingForDiffuseTexture = use;

        if (use) {
            this._particleSystem.blendMode = this._blendMode;
            this._particleSystem.onBeforeDrawParticlesObservable.remove(this._onBeforeDrawParticleObserver);
            this._onBeforeDrawParticleObserver = null;
        } else {
            this._particleSystem.blendMode = -1;
            this._onBeforeDrawParticleObserver = this._particleSystem.onBeforeDrawParticlesObservable.add(() => {
                this._engine.setAlphaMode(Constants.ALPHA_COMBINE);
            });
        }
    }

    /**
     * Gets the vertex buffers
     */
    public get vertexBuffers(): { [key: string]: VertexBuffer } {
        const buffers = this._particleSystem.vertexBuffers as { [key: string]: VertexBuffer };

        if (!buffers || !this._isGPUParticleSystem) {
            return buffers;
        }

        // GPUParticleSystem's "offset" quad is centered ([-0.5, 0.5]) while the fluid shaders expect [0, 1]: substitute our own quad.
        let patched = this._vertexBuffersWithOffset.get(buffers);
        if (!patched) {
            this._offsetBuffer ??= new VertexBuffer(this._engine, [0, 0, 1, 0, 0, 1, 1, 1], "offset", false, false, 2);
            patched = { ...buffers, offset: this._offsetBuffer };
            this._vertexBuffersWithOffset.set(buffers, patched);
        }

        return patched;
    }

    private get _isGPUParticleSystem(): boolean {
        return this._particleSystem.getClassName() === "GPUParticleSystem";
    }

    /**
     * Gets the index buffer (or null if the object is using instancing)
     */
    public override get indexBuffer(): Nullable<DataBuffer> {
        return this._particleSystem.indexBuffer;
    }

    /**
     * Creates a new instance of the class
     * @param scene The scene the particle system is part of
     * @param ps The particle system
     * @param shaderLanguage The shader language to use
     */
    constructor(scene: Scene, ps: IParticleSystem, shaderLanguage?: ShaderLanguage) {
        super(scene, shaderLanguage);

        this._particleSystem = ps;

        this._originalRender = ps.render.bind(ps);
        this._blendMode = ps.blendMode;
        this._onBeforeDrawParticleObserver = null;
        this._offsetBuffer = null;
        this._vertexBuffersWithOffset = new WeakMap();
        this._updateInAnimate = this._particleSystem.updateInAnimate;
        this._particleSystem.updateInAnimate = true;
        this._particleSystem.render = () => 0;

        this.particleSize = (ps.minSize + ps.maxSize) / 2;

        this.useTrueRenderingForDiffuseTexture = false;
    }

    /**
     * GPUParticleSystem stores "size" as (baseSize, scaleX, scaleY); ParticleSystem as (width, height).
     * @returns the number of components of the "size" attribute
     */
    protected override _getPerParticleSizeAttributeSize(): number {
        return this._isGPUParticleSystem ? 3 : 2;
    }

    /**
     * Indicates if the object is ready to be rendered
     * @returns True if everything is ready for the object to be rendered, otherwise false
     */
    public override isReady(): boolean {
        return super.isReady() && this._particleSystem.isReady();
    }

    /**
     * Gets the number of particles in this particle system
     * @returns The number of particles
     */
    public get numParticles(): number {
        return this._particleSystem.getActiveCount();
    }

    /**
     * Render the diffuse texture for this object
     */
    public override renderDiffuseTexture(): void {
        this._originalRender();
    }

    /**
     * Releases the resources used by the class
     */
    public override dispose() {
        super.dispose();

        this._offsetBuffer?.dispose();
        this._offsetBuffer = null;

        this._particleSystem.onBeforeDrawParticlesObservable.remove(this._onBeforeDrawParticleObserver);
        this._onBeforeDrawParticleObserver = null;
        this._particleSystem.render = this._originalRender;
        this._particleSystem.blendMode = this._blendMode;
        this._particleSystem.updateInAnimate = this._updateInAnimate;
    }
}

import type { VertexBuffer } from "core/Buffers/buffer";
import type { DataBuffer } from "core/Buffers/dataBuffer";
import { Constants } from "core/Engines/constants";
import type { Effect } from "core/Materials/effect";
import type { Observer } from "core/Misc/observable";
import type { IParticleSystem } from "core/Particles/IParticleSystem";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { FluidRenderingObject } from "./fluidRenderingObject";

export class FluidRenderingObjectParticleSystem extends FluidRenderingObject {
    private _particleSystem: IParticleSystem;
    private _originalRender: () => number;
    private _renderDiffuse: () => number;
    private _blendMode: number;
    private _onBeforeDrawParticleObserver: Nullable<Observer<Nullable<Effect>>>;

    public get particleSystem() {
        return this._particleSystem;
    }

    public getClassName(): string {
        return "FluidRenderingObjectParticleSystem";
    }

    private _useTrueRenderingForDiffuseTexture = true;

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

    public get vertexBuffers(): { [key: string]: VertexBuffer } {
        return this._particleSystem.vertexBuffers as { [key: string]: VertexBuffer };
    }

    public get indexBuffer(): Nullable<DataBuffer> {
        return this._particleSystem.indexBuffer;
    }

    constructor(scene: Scene, ps: IParticleSystem) {
        super(scene);

        this._particleSystem = ps;

        this._originalRender = ps.render.bind(ps);
        this._renderDiffuse = ps.isGPU ? ps.render.bind(ps, true, false, true) : this._originalRender;
        this._blendMode = ps.blendMode;
        this._onBeforeDrawParticleObserver = null;

        if (ps.isGPU) {
            ps.render = ps.render.bind(ps, false, true, false);
        } else {
            ps.render = () => 0;
        }

        this.particleSize = (ps.minSize + ps.maxSize) / 2;

        this.useTrueRenderingForDiffuseTexture = false;
    }

    public isReady(): boolean {
        return super.isReady() && this._particleSystem.isReady();
    }

    public numParticles(): number {
        return this._particleSystem.getActiveCount();
    }

    public renderDiffuseTexture(): void {
        this._renderDiffuse();
    }

    public dispose() {
        super.dispose();

        this._particleSystem.onBeforeDrawParticlesObservable.remove(this._onBeforeDrawParticleObserver);
        this._onBeforeDrawParticleObserver = null;
        this._particleSystem.render = this._originalRender;
        this._particleSystem.blendMode = this._blendMode;
    }
}

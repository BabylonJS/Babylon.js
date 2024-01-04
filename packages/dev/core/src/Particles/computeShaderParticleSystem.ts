import type { ThinEngine } from "../Engines/thinEngine";
import type { WebGPUEngine } from "../Engines/webgpuEngine";
import { StorageBuffer } from "../Buffers/storageBuffer";
import { ComputeShader } from "../Compute/computeShader";
import { UniformBuffer } from "../Materials/uniformBuffer";
import type { IGPUParticleSystemPlatform } from "./IGPUParticleSystemPlatform";
import type { Buffer, VertexBuffer } from "../Buffers/buffer";
import type { GPUParticleSystem } from "./gpuParticleSystem";

import type { DataArray, Nullable } from "../types";
import type { DataBuffer } from "../Buffers/dataBuffer";
import { Constants } from "../Engines/constants";
import { UniformBufferEffectCommonAccessor } from "../Materials/uniformBufferEffectCommonAccessor";
import type { ComputeBindingMapping } from "../Engines/Extensions/engine.computeShader";
import type { Effect } from "../Materials/effect";
import { RegisterClass } from "../Misc/typeStore";

import "../ShadersWGSL/gpuUpdateParticles.compute";

/** @internal */
export class ComputeShaderParticleSystem implements IGPUParticleSystemPlatform {
    private _parent: GPUParticleSystem;
    private _engine: ThinEngine;
    private _updateComputeShader: ComputeShader;
    private _simParamsComputeShader: UniformBuffer;
    private _bufferComputeShader: StorageBuffer[] = [];
    private _renderVertexBuffers: Array<{ [key: string]: VertexBuffer }> = [];

    public readonly alignDataInBuffer = true;

    constructor(parent: GPUParticleSystem, engine: ThinEngine) {
        this._parent = parent;
        this._engine = engine;
    }

    public contextLost(): void {
        this._updateComputeShader = undefined as any;
        this._bufferComputeShader.length = 0;
        this._renderVertexBuffers.length = 0;
    }

    public isUpdateBufferCreated(): boolean {
        return !!this._updateComputeShader;
    }

    public isUpdateBufferReady(): boolean {
        return this._updateComputeShader?.isReady() ?? false;
    }

    public createUpdateBuffer(defines: string): UniformBufferEffectCommonAccessor {
        const bindingsMapping: ComputeBindingMapping = {
            params: { group: 0, binding: 0 },
            particlesIn: { group: 0, binding: 1 },
            particlesOut: { group: 0, binding: 2 },
            randomTexture: { group: 0, binding: 3 },
            randomTexture2: { group: 0, binding: 4 },
        };
        if (this._parent._sizeGradientsTexture) {
            bindingsMapping["sizeGradientTexture"] = { group: 1, binding: 1 };
        }
        if (this._parent._angularSpeedGradientsTexture) {
            bindingsMapping["angularSpeedGradientTexture"] = { group: 1, binding: 3 };
        }
        if (this._parent._velocityGradientsTexture) {
            bindingsMapping["velocityGradientTexture"] = { group: 1, binding: 5 };
        }
        if (this._parent._limitVelocityGradientsTexture) {
            bindingsMapping["limitVelocityGradientTexture"] = { group: 1, binding: 7 };
        }
        if (this._parent._dragGradientsTexture) {
            bindingsMapping["dragGradientTexture"] = { group: 1, binding: 9 };
        }
        if (this._parent.noiseTexture) {
            bindingsMapping["noiseTexture"] = { group: 1, binding: 11 };
        }

        this._updateComputeShader = new ComputeShader("updateParticles", this._engine as WebGPUEngine, "gpuUpdateParticles", { bindingsMapping, defines: defines.split("\n") });

        this._simParamsComputeShader?.dispose();
        this._simParamsComputeShader = new UniformBuffer(this._engine, undefined, undefined, "ComputeShaderParticleSystemUBO");

        this._simParamsComputeShader.addUniform("currentCount", 1);
        this._simParamsComputeShader.addUniform("timeDelta", 1);
        this._simParamsComputeShader.addUniform("stopFactor", 1);
        this._simParamsComputeShader.addUniform("randomTextureSize", 1);
        this._simParamsComputeShader.addUniform("lifeTime", 2);
        this._simParamsComputeShader.addUniform("emitPower", 2);
        if (!this._parent._colorGradientsTexture) {
            this._simParamsComputeShader.addUniform("color1", 4);
            this._simParamsComputeShader.addUniform("color2", 4);
        }
        this._simParamsComputeShader.addUniform("sizeRange", 2);
        this._simParamsComputeShader.addUniform("scaleRange", 4);
        this._simParamsComputeShader.addUniform("angleRange", 4);
        this._simParamsComputeShader.addUniform("gravity", 3);
        if (this._parent._limitVelocityGradientsTexture) {
            this._simParamsComputeShader.addUniform("limitVelocityDamping", 1);
        }
        if (this._parent.isAnimationSheetEnabled) {
            this._simParamsComputeShader.addUniform("cellInfos", 4);
        }
        if (this._parent.noiseTexture) {
            this._simParamsComputeShader.addUniform("noiseStrength", 3);
        }
        if (!this._parent.isLocal) {
            this._simParamsComputeShader.addUniform("emitterWM", 16);
        }
        if (this._parent.particleEmitterType) {
            this._parent.particleEmitterType.buildUniformLayout(this._simParamsComputeShader);
        }

        this._updateComputeShader.setUniformBuffer("params", this._simParamsComputeShader);

        return new UniformBufferEffectCommonAccessor(this._simParamsComputeShader);
    }

    public createVertexBuffers(updateBuffer: Buffer, renderVertexBuffers: { [key: string]: VertexBuffer }): void {
        this._renderVertexBuffers.push(renderVertexBuffers);
    }

    public createParticleBuffer(data: number[]): DataArray | DataBuffer {
        const buffer = new StorageBuffer(
            this._engine,
            data.length * 4,
            Constants.BUFFER_CREATIONFLAG_READWRITE | Constants.BUFFER_CREATIONFLAG_VERTEX,
            "ComputeShaderParticleSystemBuffer"
        );

        buffer.update(data);
        this._bufferComputeShader.push(buffer);

        return buffer.getBuffer();
    }

    public bindDrawBuffers(index: number, effect: Effect, indexBuffer: Nullable<DataBuffer>): void {
        this._engine.bindBuffers(this._renderVertexBuffers[index], indexBuffer, effect);
    }

    public preUpdateParticleBuffer(): void {}

    public updateParticleBuffer(index: number, targetBuffer: Buffer, currentActiveCount: number): void {
        this._simParamsComputeShader.update();

        this._updateComputeShader.setTexture("randomTexture", this._parent._randomTexture, false);
        this._updateComputeShader.setTexture("randomTexture2", this._parent._randomTexture2, false);
        if (this._parent._sizeGradientsTexture) {
            this._updateComputeShader.setTexture("sizeGradientTexture", this._parent._sizeGradientsTexture);
        }

        if (this._parent._angularSpeedGradientsTexture) {
            this._updateComputeShader.setTexture("angularSpeedGradientTexture", this._parent._angularSpeedGradientsTexture);
        }

        if (this._parent._velocityGradientsTexture) {
            this._updateComputeShader.setTexture("velocityGradientTexture", this._parent._velocityGradientsTexture);
        }

        if (this._parent._limitVelocityGradientsTexture) {
            this._updateComputeShader.setTexture("limitVelocityGradientTexture", this._parent._limitVelocityGradientsTexture);
        }

        if (this._parent._dragGradientsTexture) {
            this._updateComputeShader.setTexture("dragGradientTexture", this._parent._dragGradientsTexture);
        }

        if (this._parent.noiseTexture) {
            this._updateComputeShader.setTexture("noiseTexture", this._parent.noiseTexture);
        }

        this._updateComputeShader.setStorageBuffer("particlesIn", this._bufferComputeShader[index]);
        this._updateComputeShader.setStorageBuffer("particlesOut", this._bufferComputeShader[index ^ 1]);

        this._updateComputeShader.dispatch(Math.ceil(currentActiveCount / 64));
    }

    public releaseBuffers(): void {
        for (let i = 0; i < this._bufferComputeShader.length; ++i) {
            this._bufferComputeShader[i].dispose();
        }

        this._bufferComputeShader.length = 0;

        this._simParamsComputeShader?.dispose();
        (<any>this._simParamsComputeShader) = null;

        (<any>this._updateComputeShader) = null;
    }

    public releaseVertexBuffers(): void {
        this._renderVertexBuffers.length = 0;
    }
}

RegisterClass("BABYLON.ComputeShaderParticleSystem", ComputeShaderParticleSystem);

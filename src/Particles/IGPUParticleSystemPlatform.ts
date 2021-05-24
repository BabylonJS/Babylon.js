import { Buffer } from "../Buffers/buffer";
import { VertexBuffer } from "../Buffers/buffer";
import { DataBuffer } from "../Buffers/dataBuffer";
import { Effect } from "../Materials/effect";
import { UniformBufferEffectCommonAccessor } from "../Materials/uniformBufferEffectCommonAccessor";
import { DataArray } from "../types";

/** @hidden */
export interface IGPUParticleSystemPlatform {

    alignDataInBuffer: boolean;

    isUpdateBufferCreated: () => boolean;
    isUpdateBufferReady: () => boolean;

    createUpdateBuffer: (defines: string) => UniformBufferEffectCommonAccessor;
    createVertexBuffers: (updateBuffer: Buffer, renderVertexBuffers: { [key: string]: VertexBuffer }) => void;
    createParticleBuffer: (data: number[]) => DataArray | DataBuffer;

    bindDrawBuffers: (index: number, effect: Effect) => void;

    preUpdateParticleBuffer: () => void;
    updateParticleBuffer: (index: number, targetBuffer: Buffer, currentActiveCount: number) => void;

    releaseBuffers: () => void;
    releaseVertexBuffers: () => void;
}

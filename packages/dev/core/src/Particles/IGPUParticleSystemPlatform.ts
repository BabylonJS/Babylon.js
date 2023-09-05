import type { Buffer, VertexBuffer } from "../Buffers/buffer";

import type { DataBuffer } from "../Buffers/dataBuffer";
import type { Effect } from "../Materials/effect";
import type { UniformBufferEffectCommonAccessor } from "../Materials/uniformBufferEffectCommonAccessor";
import type { DataArray, Nullable } from "../types";

/** @internal */
export interface IGPUParticleSystemPlatform {
    alignDataInBuffer: boolean;

    contextLost: () => void;

    isUpdateBufferCreated: () => boolean;
    isUpdateBufferReady: () => boolean;

    createUpdateBuffer: (defines: string) => UniformBufferEffectCommonAccessor;
    createVertexBuffers: (updateBuffer: Buffer, renderVertexBuffers: { [key: string]: VertexBuffer }) => void;
    createParticleBuffer: (data: number[]) => DataArray | DataBuffer;

    bindDrawBuffers: (index: number, effect: Effect, indexBuffer: Nullable<DataBuffer>) => void;

    preUpdateParticleBuffer: () => void;
    updateParticleBuffer: (index: number, targetBuffer: Buffer, currentActiveCount: number) => void;

    releaseBuffers: () => void;
    releaseVertexBuffers: () => void;
}

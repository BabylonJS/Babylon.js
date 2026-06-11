/**
 * Render-pass command-stream lowering for hosts where each WebGPU encoder call crosses a JS/native
 * boundary (e.g. BabylonNative over wgpu-native). This is the WebGPU counterpart of the
 * CommandBufferEncoder + NativeDataStream pairing used by the bgfx-based NativeEngine (see
 * thinNativeEngine.pure.ts): commands are encoded as words into a reused buffer and submitted across
 * the bridge in batches, guarded by a protocol-version handshake against JS/native drift. The
 * conduits necessarily differ: WebGPUEngine also ships to browsers, so the host contract is injected
 * (IWebGPURenderPassCommandRecorderProvider) rather than read from the _native global, command
 * tokens are protocol integers rather than native-provided handles, and commands carry WebGPU
 * render-pass semantics (pipelines, bind groups, draws) referencing host resource-handle ids.
 */
import { type VertexBuffer } from "../../Buffers/buffer.pure";
import { type DataBuffer } from "../../Buffers/dataBuffer";
import { Logger } from "../../Misc/logger";
import { type Nullable } from "../../types";
import * as WebGPUConstants from "./webgpuConstants";

/**
 * Version of the render-pass command-stream encoding. The host decoder reports the version it was
 * built against through IWebGPURenderPassCommandRecorderProvider.protocolVersion; when the versions
 * differ, the stream disables itself and draws fall back to direct encoder calls. This mirrors the
 * PROTOCOL_VERSION guard of the bgfx-based NativeEngine, soft-failing instead of throwing because
 * this path is an optimization rather than the engine's only transport. Bump it whenever opcodes or
 * command layouts change.
 */
export const WebGPURenderPassCommandStreamProtocolVersion = 1;

/** @internal */
export const WebGPURenderPassCommandOpcode = {
    setPipeline: 1,
    setBindGroup: 2,
    setVertexBuffer: 3,
    setIndexBuffer: 4,
    draw: 9,
    drawIndexed: 10,
    drawIndirect: 11,
    drawIndexedIndirect: 12,
} as const;

/** @internal */
export const WebGPURenderPassDrawKind = {
    INDEXED: 0,
    NON_INDEXED: 1,
} as const;

/** @internal */
export type WebGPURenderPassDrawKind = (typeof WebGPURenderPassDrawKind)[keyof typeof WebGPURenderPassDrawKind];

const DefaultBufferOffset = 0;
const DefaultBaseVertex = 0;
const DefaultFirstInstance = 0;
const NoDynamicOffsets = 0;

/**
 * Render pass encoder extended with an optional host recording hook.
 * The recorder must consume the command words synchronously: the buffer is owned by the stream and
 * is reused as soon as the call returns.
 * @internal
 */
export interface IWebGPUCommandRecordingRenderPass extends GPURenderPassEncoder {
    _recordCommands?: (commands: Uint32Array, drawCount: number, multiDrawCallCount: number, multiDrawDrawCount: number, wordCount: number) => boolean;
}

/**
 * Contract implemented by hosts whose WebGPU backend can record batched render-pass command streams
 * (e.g. BabylonNative over wgpu-native, where every render-pass encoder call crosses the JS/native
 * boundary). Install an implementation through WebGPUEngine.renderPassCommandRecorderProvider to let
 * compatibility-mode draws be encoded into a command stream and submitted in batches instead of one
 * encoder call per state change and draw.
 */
export interface IWebGPURenderPassCommandRecorderProvider {
    /**
     * The command-stream protocol version the host decoder was built against (see
     * WebGPURenderPassCommandStreamProtocolVersion). A mismatch permanently disables the stream for
     * the engine and draws fall back to direct encoder calls.
     */
    protocolVersion: number;
    /**
     * Returns true while command-stream recording is enabled on the host.
     */
    isEnabled(): boolean;
    /**
     * Returns the host handle id for a backend resource (pipeline, buffer or bind group), or 0 when
     * the resource has no host handle (which makes the draw fall back to direct encoder calls).
     * @param resource the backend resource to identify
     */
    getResourceId(resource: Nullable<object>): number;
    /**
     * Optionally returns the host's last backend error, used to enrich diagnostics when recording fails.
     */
    getLastError?(): string | undefined;
}

/** @internal */
interface IWebGPURenderPassDrawCommandBase {
    renderPass: GPURenderPassEncoder | GPURenderBundleEncoder;
    drawKind: WebGPURenderPassDrawKind;
    pipeline: GPURenderPipeline;
    bindGroups: GPUBindGroup[];
    vertexBuffers: VertexBuffer[];
    count: number;
    instancesCount: number;
    start: number;
    indirectDrawBuffer: Nullable<GPUBuffer>;
}

/** @internal */
export interface IWebGPURenderPassIndexedDrawCommand extends IWebGPURenderPassDrawCommandBase {
    drawKind: typeof WebGPURenderPassDrawKind.INDEXED;
    indexBuffer: DataBuffer;
    indexFormat: GPUIndexFormat;
}

/** @internal */
export interface IWebGPURenderPassNonIndexedDrawCommand extends IWebGPURenderPassDrawCommandBase {
    drawKind: typeof WebGPURenderPassDrawKind.NON_INDEXED;
    indexBuffer: null;
    indexFormat: null;
}

/**
 * Draw commands are consumed synchronously by both the lowering and the replay paths, so callers may
 * (and the engine does) reuse a single command instance across draws to keep the hot path allocation-free.
 * @internal
 */
export type IWebGPURenderPassDrawCommand = IWebGPURenderPassIndexedDrawCommand | IWebGPURenderPassNonIndexedDrawCommand;

/**
 * Creates a reusable indexed draw command. Every field must be (re)assigned before each submission.
 * @internal
 */
export function CreateWebGPURenderPassIndexedDrawCommand(): IWebGPURenderPassIndexedDrawCommand {
    return {
        renderPass: null as unknown as GPURenderPassEncoder,
        drawKind: WebGPURenderPassDrawKind.INDEXED,
        pipeline: null as unknown as GPURenderPipeline,
        bindGroups: [],
        vertexBuffers: [],
        indexBuffer: null as unknown as DataBuffer,
        indexFormat: WebGPUConstants.IndexFormat.Uint32,
        count: 0,
        instancesCount: 0,
        start: 0,
        indirectDrawBuffer: null,
    };
}

/**
 * Creates a reusable non-indexed draw command. Every field must be (re)assigned before each submission.
 * @internal
 */
export function CreateWebGPURenderPassNonIndexedDrawCommand(): IWebGPURenderPassNonIndexedDrawCommand {
    return {
        renderPass: null as unknown as GPURenderPassEncoder,
        drawKind: WebGPURenderPassDrawKind.NON_INDEXED,
        pipeline: null as unknown as GPURenderPipeline,
        bindGroups: [],
        vertexBuffers: [],
        indexBuffer: null,
        indexFormat: null,
        count: 0,
        instancesCount: 0,
        start: 0,
        indirectDrawBuffer: null,
    };
}

/** @internal */
export interface IWebGPURenderPassCommandStreamOptions {
    getProvider: () => Nullable<IWebGPURenderPassCommandRecorderProvider>;
}

/** @internal */
export function ApplyWebGPURenderPassDrawCommand(command: IWebGPURenderPassDrawCommand): void {
    const renderPass = command.renderPass;
    const isIndexedDraw = command.drawKind === WebGPURenderPassDrawKind.INDEXED;

    renderPass.setPipeline(command.pipeline);

    if (isIndexedDraw) {
        renderPass.setIndexBuffer(command.indexBuffer.underlyingResource, command.indexFormat, DefaultBufferOffset);
    }

    for (let index = 0; index < command.vertexBuffers.length; index++) {
        const vertexBuffer = command.vertexBuffers[index];
        const buffer = vertexBuffer.effectiveBuffer;
        if (buffer) {
            renderPass.setVertexBuffer(index, buffer.underlyingResource, vertexBuffer._validOffsetRange ? 0 : vertexBuffer.byteOffset);
        }
    }

    for (let i = 0; i < command.bindGroups.length; i++) {
        renderPass.setBindGroup(i, command.bindGroups[i]);
    }

    if (command.indirectDrawBuffer) {
        if (isIndexedDraw) {
            renderPass.drawIndexedIndirect(command.indirectDrawBuffer, DefaultBufferOffset);
        } else {
            renderPass.drawIndirect(command.indirectDrawBuffer, DefaultBufferOffset);
        }
    } else if (isIndexedDraw) {
        renderPass.drawIndexed(command.count, command.instancesCount || 1, command.start, DefaultBaseVertex, DefaultFirstInstance);
    } else {
        renderPass.draw(command.count, command.instancesCount || 1, command.start, DefaultFirstInstance);
    }
}

/** @internal */
export class WebGPURenderPassCommandStream {
    private _commandWords = new Uint32Array(256);
    private _commandWordCount = 0;
    private _drawCount = 0;
    private _renderPass: Nullable<GPURenderPassEncoder | GPURenderBundleEncoder> = null;
    private _pipelineId = 0;
    private _indexBufferId = 0;
    private _indexFormat: Nullable<GPUIndexFormat> = null;
    private _vertexBufferIds: number[] = [];
    private _vertexBufferOffsets: number[] = [];
    private _bindGroupIds: number[] = [];
    private _scratchVertexBufferIds: number[] = [];
    private _scratchVertexBufferOffsets: number[] = [];
    private _scratchBindGroupIds: number[] = [];
    private _disabledAfterFailure = false;

    public constructor(private readonly _options: IWebGPURenderPassCommandStreamOptions) {}

    public flush(): boolean {
        const renderPass = this._renderPass;
        const wordCount = this._commandWordCount;
        if (!renderPass || wordCount === 0) {
            // Nothing is pending: keep this path free of any work so disabled engines pay nothing per draw.
            return false;
        }

        const recordCommands = (renderPass as IWebGPUCommandRecordingRenderPass)._recordCommands;
        if (typeof recordCommands !== "function") {
            this.reset();
            this._disable("WebGPU render pass command stream cannot flush: the active render pass does not support command recording.");
            return false;
        }

        const success = recordCommands.call(renderPass, this._commandWords, this._drawCount, 0, 0, wordCount) === true;
        this.reset();

        if (!success) {
            const lastError = this._options.getProvider()?.getLastError?.();
            const detail = lastError && lastError.length > 0 ? `: ${lastError}` : "";
            this._disable(`WebGPU render pass command stream recording failed${detail}. The draws batched for this flush were dropped.`);
            return false;
        }

        return true;
    }

    public reset(): void {
        this._commandWordCount = 0;
        this._drawCount = 0;
        this._renderPass = null;
        this._pipelineId = 0;
        this._indexBufferId = 0;
        this._indexFormat = null;
        this._vertexBufferIds.length = 0;
        this._vertexBufferOffsets.length = 0;
        this._bindGroupIds.length = 0;
    }

    public tryAppend(command: IWebGPURenderPassDrawCommand): boolean {
        if (this._disabledAfterFailure) {
            return false;
        }

        const provider = this._options.getProvider();
        if (!provider || !provider.isEnabled()) {
            return false;
        }

        if (provider.protocolVersion !== WebGPURenderPassCommandStreamProtocolVersion) {
            this._disable(
                `WebGPU render pass command stream protocol mismatch: the host decoder reports version ${provider.protocolVersion} but the engine encodes version ${WebGPURenderPassCommandStreamProtocolVersion}.`
            );
            return false;
        }

        const recordCommands = (command.renderPass as IWebGPUCommandRecordingRenderPass)._recordCommands;
        if (typeof recordCommands !== "function") {
            return false;
        }

        const pipelineId = provider.getResourceId(command.pipeline);
        if (pipelineId === 0) {
            return false;
        }

        const isIndexedDraw = command.drawKind === WebGPURenderPassDrawKind.INDEXED;
        const indexBufferId = isIndexedDraw ? provider.getResourceId(command.indexBuffer.underlyingResource) : 0;
        if (isIndexedDraw && indexBufferId === 0) {
            return false;
        }

        const vertexBufferIds = this._scratchVertexBufferIds;
        const vertexBufferOffsets = this._scratchVertexBufferOffsets;
        for (let index = 0; index < command.vertexBuffers.length; index++) {
            const vertexBuffer = command.vertexBuffers[index];
            const buffer = vertexBuffer.effectiveBuffer;
            if (!buffer) {
                vertexBufferIds[index] = 0;
                vertexBufferOffsets[index] = 0;
                continue;
            }

            const bufferId = provider.getResourceId(buffer.underlyingResource);
            if (bufferId === 0) {
                return false;
            }
            vertexBufferIds[index] = bufferId;
            vertexBufferOffsets[index] = vertexBuffer._validOffsetRange ? 0 : vertexBuffer.byteOffset;
        }

        const bindGroupIds = this._scratchBindGroupIds;
        for (let i = 0; i < command.bindGroups.length; i++) {
            const bindGroupId = provider.getResourceId(command.bindGroups[i]);
            if (bindGroupId === 0) {
                return false;
            }
            bindGroupIds[i] = bindGroupId;
        }

        const indirectDrawBufferId = command.indirectDrawBuffer ? provider.getResourceId(command.indirectDrawBuffer) : 0;
        if (command.indirectDrawBuffer && indirectDrawBufferId === 0) {
            return false;
        }

        if (this._renderPass && this._renderPass !== command.renderPass) {
            this.flush();
            if (this._disabledAfterFailure) {
                return false;
            }
        }

        this._renderPass = command.renderPass;
        if (this._pipelineId !== pipelineId) {
            this._pushU32(WebGPURenderPassCommandOpcode.setPipeline);
            this._pushU64(pipelineId);
            this._pipelineId = pipelineId;
        }

        if (isIndexedDraw) {
            if (this._indexBufferId !== indexBufferId || this._indexFormat !== command.indexFormat) {
                this._pushU32(WebGPURenderPassCommandOpcode.setIndexBuffer);
                this._pushU64(indexBufferId);
                this._pushU32(command.indexFormat === WebGPUConstants.IndexFormat.Uint32 ? 1 : 0);
                this._pushU64(DefaultBufferOffset);
                this._pushU64Max();
                this._indexBufferId = indexBufferId;
                this._indexFormat = command.indexFormat;
            }
        }

        for (let index = 0; index < command.vertexBuffers.length; index++) {
            const bufferId = vertexBufferIds[index];
            if (!bufferId) {
                continue;
            }

            const offset = vertexBufferOffsets[index];
            if (this._vertexBufferIds[index] !== bufferId || this._vertexBufferOffsets[index] !== offset) {
                this._pushU32(WebGPURenderPassCommandOpcode.setVertexBuffer);
                this._pushU32(index);
                this._pushU64(bufferId);
                this._pushU64(offset);
                this._pushU64Max();
                this._vertexBufferIds[index] = bufferId;
                this._vertexBufferOffsets[index] = offset;
            }
        }

        for (let i = 0; i < command.bindGroups.length; i++) {
            const bindGroupId = bindGroupIds[i];
            if (this._bindGroupIds[i] !== bindGroupId) {
                this._pushU32(WebGPURenderPassCommandOpcode.setBindGroup);
                this._pushU32(i);
                this._pushU64(bindGroupId);
                this._pushU32(NoDynamicOffsets);
                this._bindGroupIds[i] = bindGroupId;
            }
        }

        if (command.indirectDrawBuffer) {
            this._pushU32(isIndexedDraw ? WebGPURenderPassCommandOpcode.drawIndexedIndirect : WebGPURenderPassCommandOpcode.drawIndirect);
            this._pushU64(indirectDrawBufferId);
            this._pushU64(DefaultBufferOffset);
        } else if (isIndexedDraw) {
            this._pushU32(WebGPURenderPassCommandOpcode.drawIndexed);
            this._pushU32(command.count);
            this._pushU32(command.instancesCount || 1);
            this._pushU32(command.start);
            this._pushU32(DefaultBaseVertex);
            this._pushU32(DefaultFirstInstance);
        } else {
            this._pushU32(WebGPURenderPassCommandOpcode.draw);
            this._pushU32(command.count);
            this._pushU32(command.instancesCount || 1);
            this._pushU32(command.start);
            this._pushU32(DefaultFirstInstance);
        }

        this._drawCount++;
        return true;
    }

    private _disable(message: string): void {
        this._disabledAfterFailure = true;
        Logger.Error(`${message} Subsequent draws fall back to direct encoder calls.`);
    }

    private _ensureCapacity(additionalWords: number): void {
        const requiredWords = this._commandWordCount + additionalWords;
        if (requiredWords <= this._commandWords.length) {
            return;
        }

        let capacity = this._commandWords.length;
        while (capacity < requiredWords) {
            capacity *= 2;
        }
        const commands = new Uint32Array(capacity);
        commands.set(this._commandWords.subarray(0, this._commandWordCount));
        this._commandWords = commands;
    }

    private _pushU32(value: number): void {
        this._ensureCapacity(1);
        this._commandWords[this._commandWordCount++] = value >>> 0;
    }

    private _pushU64(value: number): void {
        const normalized = Number.isFinite(value) && value > 0 ? value : 0;
        this._ensureCapacity(2);
        this._commandWords[this._commandWordCount++] = normalized >>> 0;
        this._commandWords[this._commandWordCount++] = Math.floor(normalized / 0x100000000) >>> 0;
    }

    private _pushU64Max(): void {
        this._ensureCapacity(2);
        this._commandWords[this._commandWordCount++] = 0xffffffff;
        this._commandWords[this._commandWordCount++] = 0xffffffff;
    }
}

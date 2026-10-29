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
 *
 * Ownership and recovery contract:
 * - Every backend object referenced by a pending command word (pipeline, buffers, bind groups) is
 *   retained by the stream until the host has consumed the batch, the same guarantee the
 *   CommandBufferEncoder gives through its pending-argument list. Hosts whose wrappers release the
 *   backend resource from a GC finalizer therefore never see a dangling id while words are pending.
 * - Recording is all-or-nothing on the host side (see IWebGPUCommandRecordingRenderPass). When the
 *   host rejects a batch, the stream replays that batch through direct encoder calls from the words
 *   and the retained objects, so no draw of the frame is lost (render-once targets never keep an
 *   incomplete result), then disables itself for the engine's lifetime and reports why.
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

/**
 * Upper bound on the draws batched into one host recording call. Bounding the batch keeps the
 * command words and the retained resource references at a fixed, reusable capacity over long
 * sessions (no unbounded growth, no regrowth churn) while still amortizing the bridge crossing over
 * up to this many draws.
 */
export const WebGPURenderPassCommandStreamMaxDrawsPerBatch = 1024;

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
const U64WordCount = 2;

/**
 * Render pass encoder extended with an optional host recording hook.
 * @internal
 */
export interface IWebGPUCommandRecordingRenderPass extends GPURenderPassEncoder {
    /**
     * Records a batch of commands encoded by WebGPURenderPassCommandStream into this pass.
     *
     * The recorder must consume the command words synchronously: the buffer is owned by the stream
     * and is reused as soon as the call returns. Recording is all-or-nothing: the host returns true
     * once every command of the batch has been recorded, and returns false (or throws) without
     * having recorded any of them when it rejects the batch, leaving the encoder usable. The stream
     * relies on this to replay a rejected batch through direct encoder calls. The JS objects of
     * every resource referenced by the batch are retained by the stream until this call returns;
     * from then on the host owns their lifetime for the rest of the pass.
     */
    _recordCommands?: (commands: Uint32Array, drawCount: number, multiDrawCallCount: number, multiDrawDrawCount: number, wordCount: number) => boolean;
}

/**
 * Why a render-pass command stream disabled itself (see IWebGPURenderPassCommandStreamDisableInfo).
 * - "protocol-mismatch": the host decoder was built against another WebGPURenderPassCommandStreamProtocolVersion.
 * - "recorder-missing": the active render pass stopped exposing a recording hook while commands were pending.
 * - "recording-rejected": the host returned false from _recordCommands.
 * - "recording-threw": the host threw from _recordCommands.
 */
export type WebGPURenderPassCommandStreamDisableReason = "protocol-mismatch" | "recorder-missing" | "recording-rejected" | "recording-threw";

/**
 * Details reported once when a render-pass command stream disables itself, so integrating
 * applications can surface the event (telemetry, diagnostics) alongside the Logger.Error entry.
 */
export interface IWebGPURenderPassCommandStreamDisableInfo {
    /** Why the stream disabled itself. */
    reason: WebGPURenderPassCommandStreamDisableReason;
    /** The message that was logged. */
    message: string;
    /** The host's last backend error when the provider exposes one (see IWebGPURenderPassCommandRecorderProvider.getLastError). */
    hostError?: string;
    /** Number of draws from the rejected batch that were replayed through direct encoder calls (0 when nothing was pending). */
    replayedDrawCount: number;
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
     * Ids must be positive safe integers (at most Number.MAX_SAFE_INTEGER) so they encode losslessly
     * into 64-bit command words; out-of-range ids are treated as missing. The stream retains the
     * resource object itself until the words referencing its id have been consumed by the host, so
     * an id never outlives its object while pending.
     * @param resource the backend resource to identify
     */
    getResourceId(resource: Nullable<object>): number;
    /**
     * Optionally returns the host's last backend error, used to enrich diagnostics when recording fails.
     */
    getLastError?(): string | undefined;
    /**
     * Optionally invoked once, after the failure has been logged and the rejected batch replayed,
     * when the stream disables itself for the rest of the engine's lifetime.
     * @param info what happened and how much was replayed
     */
    onDisabled?(info: IWebGPURenderPassCommandStreamDisableInfo): void;
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

function ReadU64(words: Uint32Array, index: number): number {
    return words[index] + words[index + 1] * 0x100000000;
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
    // One entry per pending command word that references a backend object, in encoding order. It
    // pins those objects until the host has consumed the batch and lets a rejected batch be replayed.
    private _pendingResources: Nullable<object>[] = [];
    private _pendingResourceCount = 0;
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
            this._recoverFromRejectedBatch(
                renderPass,
                "recorder-missing",
                "WebGPU render pass command stream cannot flush: the active render pass does not support command recording."
            );
            return false;
        }

        let recorded = false;
        let thrown: unknown = null;
        try {
            recorded = recordCommands.call(renderPass, this._commandWords, this._drawCount, 0, 0, wordCount) === true;
        } catch (error) {
            thrown = error ?? new Error("unknown error");
        }

        if (recorded) {
            this.reset();
            return true;
        }

        // A recording failure past the protocol-version handshake indicates a broken host decoder, so the
        // batch is replayed directly and the stream falls back permanently to direct encoder calls.
        if (thrown) {
            const detail = thrown instanceof Error ? thrown.message : String(thrown);
            this._recoverFromRejectedBatch(renderPass, "recording-threw", `WebGPU render pass command stream recording threw: ${detail}.`);
        } else {
            // Read the host error before replaying: the direct calls may overwrite it.
            const hostError = this._options.getProvider()?.getLastError?.();
            const detail = hostError && hostError.length > 0 ? `: ${hostError}` : "";
            this._recoverFromRejectedBatch(renderPass, "recording-rejected", `WebGPU render pass command stream recording failed${detail}.`, hostError);
        }
        return false;
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
        // Release the retained objects without shrinking the array so long sessions reuse its capacity.
        const pendingResources = this._pendingResources;
        for (let index = 0; index < this._pendingResourceCount; index++) {
            pendingResources[index] = null;
        }
        this._pendingResourceCount = 0;
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
                "protocol-mismatch",
                `WebGPU render pass command stream protocol mismatch: the host decoder reports version ${provider.protocolVersion} but the engine encodes version ${WebGPURenderPassCommandStreamProtocolVersion}.`
            );
            return false;
        }

        const recordCommands = (command.renderPass as IWebGPUCommandRecordingRenderPass)._recordCommands;
        if (typeof recordCommands !== "function") {
            return false;
        }

        const pipelineId = this._getValidResourceId(provider, command.pipeline);
        if (pipelineId === 0) {
            return false;
        }

        const isIndexedDraw = command.drawKind === WebGPURenderPassDrawKind.INDEXED;
        const indexBufferId = isIndexedDraw ? this._getValidResourceId(provider, command.indexBuffer.underlyingResource) : 0;
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

            const bufferId = this._getValidResourceId(provider, buffer.underlyingResource);
            if (bufferId === 0) {
                return false;
            }
            vertexBufferIds[index] = bufferId;
            vertexBufferOffsets[index] = vertexBuffer._validOffsetRange ? 0 : vertexBuffer.byteOffset;
        }

        const bindGroupIds = this._scratchBindGroupIds;
        for (let i = 0; i < command.bindGroups.length; i++) {
            const bindGroupId = this._getValidResourceId(provider, command.bindGroups[i]);
            if (bindGroupId === 0) {
                return false;
            }
            bindGroupIds[i] = bindGroupId;
        }

        const indirectDrawBufferId = command.indirectDrawBuffer ? this._getValidResourceId(provider, command.indirectDrawBuffer) : 0;
        if (command.indirectDrawBuffer && indirectDrawBufferId === 0) {
            return false;
        }

        if (this._renderPass && (this._renderPass !== command.renderPass || this._drawCount >= WebGPURenderPassCommandStreamMaxDrawsPerBatch)) {
            this.flush();
            if (this._disabledAfterFailure) {
                return false;
            }
        }

        this._renderPass = command.renderPass;
        if (this._pipelineId !== pipelineId) {
            this._pushU32(WebGPURenderPassCommandOpcode.setPipeline);
            this._pushU64(pipelineId);
            this._retain(command.pipeline);
            this._pipelineId = pipelineId;
        }

        if (isIndexedDraw) {
            if (this._indexBufferId !== indexBufferId || this._indexFormat !== command.indexFormat) {
                this._pushU32(WebGPURenderPassCommandOpcode.setIndexBuffer);
                this._pushU64(indexBufferId);
                this._pushU32(command.indexFormat === WebGPUConstants.IndexFormat.Uint32 ? 1 : 0);
                this._pushU64(DefaultBufferOffset);
                this._pushU64Max();
                this._retain(command.indexBuffer.underlyingResource);
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
                this._retain(command.vertexBuffers[index].effectiveBuffer!.underlyingResource);
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
                this._retain(command.bindGroups[i]);
                this._bindGroupIds[i] = bindGroupId;
            }
        }

        if (command.indirectDrawBuffer) {
            this._pushU32(isIndexedDraw ? WebGPURenderPassCommandOpcode.drawIndexedIndirect : WebGPURenderPassCommandOpcode.drawIndirect);
            this._pushU64(indirectDrawBufferId);
            this._pushU64(DefaultBufferOffset);
            this._retain(command.indirectDrawBuffer);
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

    // Replays the pending batch through direct encoder calls, from the encoded words and the objects
    // retained for them, then resets and disables the stream. Used when the host rejected the batch
    // without recording it, so the frame keeps every draw.
    private _recoverFromRejectedBatch(
        renderPass: GPURenderPassEncoder | GPURenderBundleEncoder,
        reason: WebGPURenderPassCommandStreamDisableReason,
        message: string,
        hostError?: string
    ): void {
        const replayedDrawCount = this._drawCount;
        try {
            this._replayPending(renderPass);
        } finally {
            this.reset();
            this._disable(reason, `${message} The ${replayedDrawCount} draw(s) of this batch were replayed through direct encoder calls.`, hostError, replayedDrawCount);
        }
    }

    private _replayPending(renderPass: GPURenderPassEncoder | GPURenderBundleEncoder): void {
        const words = this._commandWords;
        const wordCount = this._commandWordCount;
        const resources = this._pendingResources;
        let resourceIndex = 0;
        let index = 0;
        while (index < wordCount) {
            const opcode = words[index++];
            switch (opcode) {
                case WebGPURenderPassCommandOpcode.setPipeline: {
                    index += U64WordCount;
                    renderPass.setPipeline(resources[resourceIndex++] as GPURenderPipeline);
                    break;
                }
                case WebGPURenderPassCommandOpcode.setBindGroup: {
                    const slot = words[index++];
                    index += U64WordCount;
                    const dynamicOffsetCount = words[index++];
                    const bindGroup = resources[resourceIndex++] as GPUBindGroup;
                    if (dynamicOffsetCount === 0) {
                        renderPass.setBindGroup(slot, bindGroup);
                    } else {
                        renderPass.setBindGroup(slot, bindGroup, words, index, dynamicOffsetCount);
                        index += dynamicOffsetCount;
                    }
                    break;
                }
                case WebGPURenderPassCommandOpcode.setVertexBuffer: {
                    const slot = words[index++];
                    index += U64WordCount;
                    const offset = ReadU64(words, index);
                    index += U64WordCount * 2; // offset and size (the size is always the whole buffer)
                    renderPass.setVertexBuffer(slot, resources[resourceIndex++] as GPUBuffer, offset);
                    break;
                }
                case WebGPURenderPassCommandOpcode.setIndexBuffer: {
                    index += U64WordCount;
                    const format = words[index++] === 1 ? WebGPUConstants.IndexFormat.Uint32 : WebGPUConstants.IndexFormat.Uint16;
                    const offset = ReadU64(words, index);
                    index += U64WordCount * 2; // offset and size (the size is always the whole buffer)
                    renderPass.setIndexBuffer(resources[resourceIndex++] as GPUBuffer, format, offset);
                    break;
                }
                case WebGPURenderPassCommandOpcode.draw: {
                    renderPass.draw(words[index], words[index + 1], words[index + 2], words[index + 3]);
                    index += 4;
                    break;
                }
                case WebGPURenderPassCommandOpcode.drawIndexed: {
                    renderPass.drawIndexed(words[index], words[index + 1], words[index + 2], words[index + 3] | 0, words[index + 4]);
                    index += 5;
                    break;
                }
                case WebGPURenderPassCommandOpcode.drawIndirect:
                case WebGPURenderPassCommandOpcode.drawIndexedIndirect: {
                    index += U64WordCount;
                    const offset = ReadU64(words, index);
                    index += U64WordCount;
                    const buffer = resources[resourceIndex++] as GPUBuffer;
                    if (opcode === WebGPURenderPassCommandOpcode.drawIndexedIndirect) {
                        renderPass.drawIndexedIndirect(buffer, offset);
                    } else {
                        renderPass.drawIndirect(buffer, offset);
                    }
                    break;
                }
                default: {
                    // The words were encoded by this stream, so this cannot happen; stop rather than guess at a layout.
                    Logger.Error(`WebGPU render pass command stream replay stopped at word ${index - 1}: unknown opcode ${opcode}.`);
                    return;
                }
            }
        }
    }

    private _retain(resource: object): void {
        this._pendingResources[this._pendingResourceCount++] = resource;
    }

    private _getValidResourceId(provider: IWebGPURenderPassCommandRecorderProvider, resource: Nullable<object>): number {
        const id = provider.getResourceId(resource);
        // Ids are encoded into u64 command words from a JS number: reject ids that cannot round-trip exactly.
        return id > 0 && Number.isSafeInteger(id) ? id : 0;
    }

    private _disable(reason: WebGPURenderPassCommandStreamDisableReason, message: string, hostError?: string, replayedDrawCount = 0): void {
        this._disabledAfterFailure = true;
        const loggedMessage = `${message} Subsequent draws fall back to direct encoder calls.`;
        Logger.Error(loggedMessage);

        const provider = this._options.getProvider();
        if (provider?.onDisabled) {
            // A diagnostics hook must never take the frame down with it.
            try {
                provider.onDisabled({ reason, message: loggedMessage, hostError, replayedDrawCount });
            } catch (error) {
                Logger.Error(`WebGPU render pass command stream onDisabled handler threw: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
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
        this._ensureCapacity(U64WordCount);
        this._commandWords[this._commandWordCount++] = normalized >>> 0;
        this._commandWords[this._commandWordCount++] = Math.floor(normalized / 0x100000000) >>> 0;
    }

    private _pushU64Max(): void {
        this._ensureCapacity(U64WordCount);
        this._commandWords[this._commandWordCount++] = 0xffffffff;
        this._commandWords[this._commandWordCount++] = 0xffffffff;
    }
}

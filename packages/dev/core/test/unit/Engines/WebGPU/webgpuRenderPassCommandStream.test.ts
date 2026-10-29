import { describe, expect, it, vi } from "vitest";
import { type VertexBuffer } from "core/Buffers/buffer";
import { type DataBuffer } from "core/Buffers/dataBuffer";
import { type Nullable } from "core/types";
import {
    ApplyWebGPURenderPassDrawCommand,
    type IWebGPURenderPassCommandRecorderProvider,
    type IWebGPURenderPassIndexedDrawCommand,
    type IWebGPURenderPassNonIndexedDrawCommand,
    WebGPURenderPassCommandOpcode,
    WebGPURenderPassCommandStream,
    WebGPURenderPassCommandStreamMaxDrawsPerBatch,
    WebGPURenderPassCommandStreamProtocolVersion,
    WebGPURenderPassDrawKind,
} from "core/Engines/WebGPU/webgpuRenderPassCommandStream";
import * as WebGPUConstants from "core/Engines/WebGPU/webgpuConstants";
import { Logger } from "core/Misc/logger";

const BackendResourceIdName = "__babylonNativeWebGPUHandleId";
const U64Max = 0xffffffff;

type RenderPassCall = [string, ...number[]];

interface IRecordedCommandStream {
    words: number[];
    drawCount: number;
    multiDrawCallCount: number;
    multiDrawDrawCount: number;
    wordCount: number;
}

function getBackendResourceId(resource: Nullable<object>): number {
    const id = (resource as Record<string, unknown> | null)?.[BackendResourceIdName];
    return typeof id === "number" && id > 0 ? id : 0;
}

function setBackendResourceId<T extends object>(resource: T, id: number): T {
    (resource as Record<string, unknown>)[BackendResourceIdName] = id;
    return resource;
}

function createResource<T extends object>(id: number): T {
    return setBackendResourceId({} as T, id);
}

function createDataBuffer(id: number, is32Bits = true): DataBuffer {
    return {
        underlyingResource: createResource<GPUBuffer>(id),
        is32Bits,
    } as unknown as DataBuffer;
}

function createVertexBuffer(id: number, byteOffset = 0, validOffsetRange = true): VertexBuffer {
    return {
        effectiveBuffer: {
            underlyingResource: createResource<GPUBuffer>(id),
        },
        byteOffset,
        _validOffsetRange: validOffsetRange,
    } as unknown as VertexBuffer;
}

function createReplayRenderPass(): { renderPass: GPURenderPassEncoder; calls: RenderPassCall[] } {
    const calls: RenderPassCall[] = [];
    const renderPass = {
        setPipeline: (pipeline: GPURenderPipeline) => calls.push(["setPipeline", getBackendResourceId(pipeline)]),
        setIndexBuffer: (buffer: GPUBuffer, format: string, offset?: number) =>
            calls.push(["setIndexBuffer", getBackendResourceId(buffer), format === WebGPUConstants.IndexFormat.Uint32 ? 1 : 0, offset ?? 0]),
        setVertexBuffer: (slot: number, buffer: GPUBuffer, offset?: number) => calls.push(["setVertexBuffer", slot, getBackendResourceId(buffer), offset ?? 0]),
        setBindGroup: (slot: number, bindGroup: GPUBindGroup) => calls.push(["setBindGroup", slot, getBackendResourceId(bindGroup)]),
        drawIndexed: (indexCount: number, instanceCount?: number, firstIndex?: number, baseVertex?: number, firstInstance?: number) =>
            calls.push(["drawIndexed", indexCount, instanceCount ?? 1, firstIndex ?? 0, baseVertex ?? 0, firstInstance ?? 0]),
        draw: (vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number) =>
            calls.push(["draw", vertexCount, instanceCount ?? 1, firstVertex ?? 0, firstInstance ?? 0]),
        drawIndexedIndirect: (buffer: GPUBuffer, offset: number) => calls.push(["drawIndexedIndirect", getBackendResourceId(buffer), offset]),
        drawIndirect: (buffer: GPUBuffer, offset: number) => calls.push(["drawIndirect", getBackendResourceId(buffer), offset]),
    } as unknown as GPURenderPassEncoder;

    return { renderPass, calls };
}

function createRecordingRenderPass(recordResult = true): { renderPass: GPURenderPassEncoder; records: IRecordedCommandStream[]; calls: RenderPassCall[] } {
    const { renderPass, calls } = createReplayRenderPass();
    const records: IRecordedCommandStream[] = [];

    (renderPass as GPURenderPassEncoder & { _recordCommands: NonNullable<unknown> })._recordCommands = vi.fn(
        (commands: Uint32Array, drawCount: number, multiDrawCallCount: number, multiDrawDrawCount: number, wordCount: number) => {
            records.push({
                words: Array.from(commands.subarray(0, wordCount)),
                drawCount,
                multiDrawCallCount,
                multiDrawDrawCount,
                wordCount,
            });
            return recordResult;
        }
    );

    return { renderPass, records, calls };
}

function createProvider(enabled = true, lastError?: string): IWebGPURenderPassCommandRecorderProvider {
    return {
        protocolVersion: WebGPURenderPassCommandStreamProtocolVersion,
        isEnabled: () => enabled,
        getResourceId: getBackendResourceId,
        getLastError: () => lastError,
    };
}

function createStream(enabled = true, lastError?: string): WebGPURenderPassCommandStream {
    const provider = createProvider(enabled, lastError);
    return new WebGPURenderPassCommandStream({ getProvider: () => provider });
}

function createCommand(overrides: Partial<IWebGPURenderPassIndexedDrawCommand> = {}): IWebGPURenderPassIndexedDrawCommand {
    const renderPass = overrides.renderPass ?? createRecordingRenderPass().renderPass;
    return {
        renderPass,
        drawKind: WebGPURenderPassDrawKind.INDEXED,
        pipeline: createResource<GPURenderPipeline>(100),
        bindGroups: [createResource<GPUBindGroup>(201), createResource<GPUBindGroup>(202)],
        vertexBuffers: [createVertexBuffer(301), createVertexBuffer(302, 8, false)],
        indexBuffer: createDataBuffer(401),
        indexFormat: WebGPUConstants.IndexFormat.Uint32,
        count: 36,
        instancesCount: 2,
        start: 5,
        indirectDrawBuffer: null,
        ...overrides,
    };
}

function createNonIndexedCommand(overrides: Partial<IWebGPURenderPassNonIndexedDrawCommand> = {}): IWebGPURenderPassNonIndexedDrawCommand {
    const renderPass = overrides.renderPass ?? createRecordingRenderPass().renderPass;
    return {
        renderPass,
        drawKind: WebGPURenderPassDrawKind.NON_INDEXED,
        pipeline: createResource<GPURenderPipeline>(100),
        bindGroups: [createResource<GPUBindGroup>(201), createResource<GPUBindGroup>(202)],
        vertexBuffers: [createVertexBuffer(301), createVertexBuffer(302, 8, false)],
        indexBuffer: null,
        indexFormat: null,
        count: 12,
        instancesCount: 1,
        start: 4,
        indirectDrawBuffer: null,
        ...overrides,
    };
}

function parseOpcodes(words: number[]): number[] {
    const opcodes: number[] = [];
    for (let index = 0; index < words.length;) {
        const opcode = words[index];
        opcodes.push(opcode);

        switch (opcode) {
            case WebGPURenderPassCommandOpcode.setPipeline:
                index += 3;
                break;
            case WebGPURenderPassCommandOpcode.setBindGroup:
            case WebGPURenderPassCommandOpcode.draw:
            case WebGPURenderPassCommandOpcode.drawIndirect:
            case WebGPURenderPassCommandOpcode.drawIndexedIndirect:
                index += 5;
                break;
            case WebGPURenderPassCommandOpcode.setVertexBuffer:
            case WebGPURenderPassCommandOpcode.setIndexBuffer:
                index += 8;
                break;
            case WebGPURenderPassCommandOpcode.drawIndexed:
                index += 6;
                break;
            default:
                throw new Error(`Unexpected opcode ${opcode} at word ${index}`);
        }
    }
    return opcodes;
}

function getRetainedResources(stream: WebGPURenderPassCommandStream): Nullable<object>[] {
    const internals = stream as unknown as { _pendingResources: Nullable<object>[]; _pendingResourceCount: number };
    return internals._pendingResources.slice(0, internals._pendingResourceCount);
}

function setRecorder(renderPass: GPURenderPassEncoder, recorder: () => boolean): void {
    (renderPass as GPURenderPassEncoder & { _recordCommands: unknown })._recordCommands = vi.fn(recorder);
}

describe("WebGPURenderPassCommandStream", () => {
    it("does not record anything for an empty stream", () => {
        const stream = createStream();

        expect(stream.flush()).toBe(false);
    });

    it("records one indexed draw with the required state commands", () => {
        const { renderPass, records } = createRecordingRenderPass();
        const stream = createStream();

        expect(stream.tryAppend(createCommand({ renderPass }))).toBe(true);
        expect(stream.flush()).toBe(true);

        expect(records).toHaveLength(1);
        expect(records[0].drawCount).toBe(1);
        expect(records[0].multiDrawCallCount).toBe(0);
        expect(records[0].multiDrawDrawCount).toBe(0);
        expect(records[0].words).toEqual([
            WebGPURenderPassCommandOpcode.setPipeline,
            100,
            0,
            WebGPURenderPassCommandOpcode.setIndexBuffer,
            401,
            0,
            1,
            0,
            0,
            U64Max,
            U64Max,
            WebGPURenderPassCommandOpcode.setVertexBuffer,
            0,
            301,
            0,
            0,
            0,
            U64Max,
            U64Max,
            WebGPURenderPassCommandOpcode.setVertexBuffer,
            1,
            302,
            0,
            8,
            0,
            U64Max,
            U64Max,
            WebGPURenderPassCommandOpcode.setBindGroup,
            0,
            201,
            0,
            0,
            WebGPURenderPassCommandOpcode.setBindGroup,
            1,
            202,
            0,
            0,
            WebGPURenderPassCommandOpcode.drawIndexed,
            36,
            2,
            5,
            0,
            0,
        ]);
    });

    it("records many compatible draws without repeating stable state", () => {
        const { renderPass, records } = createRecordingRenderPass();
        const stream = createStream();

        expect(stream.tryAppend(createCommand({ renderPass, start: 0 }))).toBe(true);
        expect(stream.tryAppend(createCommand({ renderPass, start: 36 }))).toBe(true);
        expect(stream.tryAppend(createCommand({ renderPass, start: 72 }))).toBe(true);
        stream.flush();

        const opcodes = parseOpcodes(records[0].words);
        expect(records[0].drawCount).toBe(3);
        expect(opcodes.filter((opcode) => opcode === WebGPURenderPassCommandOpcode.setPipeline)).toHaveLength(1);
        expect(opcodes.filter((opcode) => opcode === WebGPURenderPassCommandOpcode.setIndexBuffer)).toHaveLength(1);
        expect(opcodes.filter((opcode) => opcode === WebGPURenderPassCommandOpcode.setVertexBuffer)).toHaveLength(2);
        expect(opcodes.filter((opcode) => opcode === WebGPURenderPassCommandOpcode.setBindGroup)).toHaveLength(2);
        expect(opcodes.filter((opcode) => opcode === WebGPURenderPassCommandOpcode.drawIndexed)).toHaveLength(3);
    });

    it("does not lower when the backend capability is absent", () => {
        const { renderPass, calls } = createReplayRenderPass();
        const stream = createStream(false);
        const command = createCommand({ renderPass });

        expect(stream.tryAppend(command)).toBe(false);
        expect(stream.flush()).toBe(false);

        ApplyWebGPURenderPassDrawCommand(command);
        expect(calls.map((call) => call[0])).toEqual(["setPipeline", "setIndexBuffer", "setVertexBuffer", "setVertexBuffer", "setBindGroup", "setBindGroup", "drawIndexed"]);
    });

    it("does not lower when the backend capability is disabled even if backend recording exists", () => {
        const { renderPass, records } = createRecordingRenderPass();
        const stream = createStream(false);

        expect(stream.tryAppend(createCommand({ renderPass }))).toBe(false);
        expect(stream.flush()).toBe(false);

        expect(records).toHaveLength(0);
    });

    it("does not lower when the render pass has no backend recorder", () => {
        const { renderPass, calls } = createReplayRenderPass();
        const stream = createStream();
        const command = createCommand({ renderPass });

        expect(stream.tryAppend(command)).toBe(false);
        ApplyWebGPURenderPassDrawCommand(command);

        expect(calls[calls.length - 1]).toEqual(["drawIndexed", 36, 2, 5, 0, 0]);
    });

    it("does not permanently reject a resource after the backend resource id appears later", () => {
        const { renderPass, records } = createRecordingRenderPass();
        const pipeline = {};
        const stream = createStream();

        expect(stream.tryAppend(createCommand({ renderPass, pipeline: pipeline as GPURenderPipeline }))).toBe(false);

        setBackendResourceId(pipeline, 100);
        expect(stream.tryAppend(createCommand({ renderPass, pipeline: pipeline as GPURenderPipeline }))).toBe(true);
        stream.flush();

        expect(records).toHaveLength(1);
        expect(records[0].drawCount).toBe(1);
    });

    it("does not lower a draw while any required backend resource id is missing", () => {
        const { renderPass, records } = createRecordingRenderPass();
        const stream = createStream();

        expect(stream.tryAppend(createCommand({ renderPass, bindGroups: [createResource<GPUBindGroup>(201), {} as GPUBindGroup] }))).toBe(false);
        expect(stream.tryAppend(createCommand({ renderPass, vertexBuffers: [createVertexBuffer(301), { effectiveBuffer: { underlyingResource: {} } } as VertexBuffer] }))).toBe(
            false
        );
        expect(stream.tryAppend(createCommand({ renderPass, indirectDrawBuffer: {} as GPUBuffer }))).toBe(false);
        expect(stream.flush()).toBe(false);

        expect(records).toHaveLength(0);
    });

    it("does not lower a draw whose resource id exceeds the safe-integer range", () => {
        const { renderPass, records, calls } = createRecordingRenderPass();
        const stream = createStream();
        const command = createCommand({ renderPass, pipeline: createResource<GPURenderPipeline>(2 ** 53) });

        expect(stream.tryAppend(command)).toBe(false);
        expect(stream.flush()).toBe(false);
        expect(records).toHaveLength(0);

        // The draw still renders through direct encoder replay.
        ApplyWebGPURenderPassDrawCommand(command);
        expect(calls.map((call) => call[0])).toContain("drawIndexed");
    });

    it("flushes an existing stream before appending to another render pass", () => {
        const first = createRecordingRenderPass();
        const second = createRecordingRenderPass();
        const stream = createStream();

        expect(stream.tryAppend(createCommand({ renderPass: first.renderPass }))).toBe(true);
        expect(stream.tryAppend(createCommand({ renderPass: second.renderPass }))).toBe(true);

        expect(first.records).toHaveLength(1);
        expect(second.records).toHaveLength(0);

        stream.flush();
        expect(second.records).toHaveLength(1);
    });

    it("re-emits required state after a completed stream is flushed", () => {
        const { renderPass, records } = createRecordingRenderPass();
        const stream = createStream();

        expect(stream.tryAppend(createCommand({ renderPass }))).toBe(true);
        expect(stream.flush()).toBe(true);
        expect(stream.tryAppend(createCommand({ renderPass }))).toBe(true);
        expect(stream.flush()).toBe(true);

        expect(records).toHaveLength(2);
        for (const record of records) {
            const opcodes = parseOpcodes(record.words);
            expect(opcodes).toContain(WebGPURenderPassCommandOpcode.setPipeline);
            expect(opcodes).toContain(WebGPURenderPassCommandOpcode.setIndexBuffer);
            expect(opcodes.filter((opcode) => opcode === WebGPURenderPassCommandOpcode.setBindGroup)).toHaveLength(2);
            expect(opcodes.filter((opcode) => opcode === WebGPURenderPassCommandOpcode.drawIndexed)).toHaveLength(1);
        }
    });

    it("emits a new pipeline command when material-equivalent state changes", () => {
        const { renderPass, records } = createRecordingRenderPass();
        const stream = createStream();

        expect(stream.tryAppend(createCommand({ renderPass, pipeline: createResource<GPURenderPipeline>(100) }))).toBe(true);
        expect(stream.tryAppend(createCommand({ renderPass, pipeline: createResource<GPURenderPipeline>(101) }))).toBe(true);
        stream.flush();

        const opcodes = parseOpcodes(records[0].words);
        expect(opcodes.filter((opcode) => opcode === WebGPURenderPassCommandOpcode.setPipeline)).toHaveLength(2);
        expect(opcodes.filter((opcode) => opcode === WebGPURenderPassCommandOpcode.drawIndexed)).toHaveLength(2);
    });

    it("emits only the changed bind-group slot for adjacent compatible draws", () => {
        const { renderPass, records } = createRecordingRenderPass();
        const stream = createStream();

        expect(stream.tryAppend(createCommand({ renderPass, bindGroups: [createResource<GPUBindGroup>(201), createResource<GPUBindGroup>(202)] }))).toBe(true);
        expect(stream.tryAppend(createCommand({ renderPass, bindGroups: [createResource<GPUBindGroup>(201), createResource<GPUBindGroup>(203)] }))).toBe(true);
        stream.flush();

        const opcodes = parseOpcodes(records[0].words);
        expect(opcodes.filter((opcode) => opcode === WebGPURenderPassCommandOpcode.setBindGroup)).toHaveLength(3);
    });

    it("emits a new index-buffer command when the index format changes", () => {
        const { renderPass, records } = createRecordingRenderPass();
        const stream = createStream();
        const indexBuffer = createDataBuffer(401);

        expect(stream.tryAppend(createCommand({ renderPass, indexBuffer, indexFormat: WebGPUConstants.IndexFormat.Uint32 }))).toBe(true);
        expect(stream.tryAppend(createCommand({ renderPass, indexBuffer, indexFormat: WebGPUConstants.IndexFormat.Uint16 }))).toBe(true);
        stream.flush();

        const opcodes = parseOpcodes(records[0].words);
        expect(opcodes.filter((opcode) => opcode === WebGPURenderPassCommandOpcode.setIndexBuffer)).toHaveLength(2);
    });

    it("emits a new vertex-buffer command when the vertex offset changes", () => {
        const { renderPass, records } = createRecordingRenderPass();
        const stream = createStream();

        expect(stream.tryAppend(createCommand({ renderPass, vertexBuffers: [createVertexBuffer(301), createVertexBuffer(302, 8, false)] }))).toBe(true);
        expect(stream.tryAppend(createCommand({ renderPass, vertexBuffers: [createVertexBuffer(301), createVertexBuffer(302, 12, false)] }))).toBe(true);
        stream.flush();

        const opcodes = parseOpcodes(records[0].words);
        expect(opcodes.filter((opcode) => opcode === WebGPURenderPassCommandOpcode.setVertexBuffer)).toHaveLength(3);
    });

    it("keeps indexed and non-indexed draws as distinct commands", () => {
        const { renderPass, records } = createRecordingRenderPass();
        const stream = createStream();

        expect(stream.tryAppend(createCommand({ renderPass }))).toBe(true);
        expect(stream.tryAppend(createNonIndexedCommand({ renderPass, count: 12, instancesCount: 1, start: 4 }))).toBe(true);
        stream.flush();

        const opcodes = parseOpcodes(records[0].words);
        expect(opcodes).toContain(WebGPURenderPassCommandOpcode.drawIndexed);
        expect(opcodes).toContain(WebGPURenderPassCommandOpcode.draw);
    });

    it("records indirect draw commands without claiming multi-draw count-buffer lowering", () => {
        const { renderPass, records } = createRecordingRenderPass();
        const stream = createStream();

        expect(stream.tryAppend(createCommand({ renderPass, indirectDrawBuffer: createResource<GPUBuffer>(501) }))).toBe(true);
        expect(
            stream.tryAppend(
                createNonIndexedCommand({
                    renderPass,
                    indirectDrawBuffer: createResource<GPUBuffer>(502),
                })
            )
        ).toBe(true);
        stream.flush();

        const opcodes = parseOpcodes(records[0].words);
        expect(records[0].drawCount).toBe(2);
        expect(records[0].multiDrawCallCount).toBe(0);
        expect(records[0].multiDrawDrawCount).toBe(0);
        expect(opcodes).toContain(WebGPURenderPassCommandOpcode.drawIndexedIndirect);
        expect(opcodes).toContain(WebGPURenderPassCommandOpcode.drawIndirect);
    });

    it("grows command storage for long compatible runs without corrupting opcodes", () => {
        const { renderPass, records } = createRecordingRenderPass();
        const stream = createStream();

        for (let drawIndex = 0; drawIndex < 80; drawIndex++) {
            expect(stream.tryAppend(createCommand({ renderPass, start: drawIndex * 3 }))).toBe(true);
        }
        stream.flush();

        const opcodes = parseOpcodes(records[0].words);
        expect(records[0].drawCount).toBe(80);
        expect(opcodes.filter((opcode) => opcode === WebGPURenderPassCommandOpcode.setPipeline)).toHaveLength(1);
        expect(opcodes.filter((opcode) => opcode === WebGPURenderPassCommandOpcode.drawIndexed)).toHaveLength(80);
    });

    it("logs and permanently falls back when the host decoder protocol version does not match", () => {
        const { renderPass, records } = createRecordingRenderPass();
        const provider = createProvider();
        provider.protocolVersion = WebGPURenderPassCommandStreamProtocolVersion + 1;
        const stream = new WebGPURenderPassCommandStream({ getProvider: () => provider });
        const errorSpy = vi.spyOn(Logger, "Error").mockImplementation(() => {});

        try {
            expect(stream.tryAppend(createCommand({ renderPass }))).toBe(false);
            expect(stream.tryAppend(createCommand({ renderPass }))).toBe(false);

            expect(records).toHaveLength(0);
            expect(errorSpy).toHaveBeenCalledTimes(1);
            expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("protocol mismatch"));
        } finally {
            errorSpy.mockRestore();
        }
    });

    it("does not lower when no provider is installed", () => {
        const { renderPass, records } = createRecordingRenderPass();
        const stream = new WebGPURenderPassCommandStream({ getProvider: () => null });

        expect(stream.tryAppend(createCommand({ renderPass }))).toBe(false);
        expect(stream.flush()).toBe(false);

        expect(records).toHaveLength(0);
    });

    it("logs backend diagnostics and permanently falls back when backend recording fails", () => {
        const { renderPass, records } = createRecordingRenderPass(false);
        const stream = createStream(true, "validation failed");
        const errorSpy = vi.spyOn(Logger, "Error").mockImplementation(() => {});

        try {
            expect(stream.tryAppend(createCommand({ renderPass }))).toBe(true);
            expect(stream.flush()).toBe(false);

            expect(errorSpy).toHaveBeenCalledTimes(1);
            expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("validation failed"));

            // After a backend failure the stream must stop lowering so draws replay through direct
            // encoder calls instead of failing (and logging) on every subsequent flush.
            expect(stream.tryAppend(createCommand({ renderPass }))).toBe(false);
            expect(stream.flush()).toBe(false);
            expect(records).toHaveLength(1);
            expect(errorSpy).toHaveBeenCalledTimes(1);
        } finally {
            errorSpy.mockRestore();
        }
    });

    it("retains every referenced backend object until the host has consumed the batch", () => {
        const { renderPass } = createRecordingRenderPass();
        const stream = createStream();
        const pipeline = createResource<GPURenderPipeline>(100);
        const bindGroups = [createResource<GPUBindGroup>(201), createResource<GPUBindGroup>(202)];
        const vertexBuffers = [createVertexBuffer(301), createVertexBuffer(302, 8, false)];
        const indexBuffer = createDataBuffer(401);
        const indirectDrawBuffer = createResource<GPUBuffer>(501);
        const command = createCommand({ renderPass, pipeline, bindGroups, vertexBuffers, indexBuffer, indirectDrawBuffer });

        expect(stream.tryAppend(command)).toBe(true);
        // A second draw with unchanged state only references the indirect buffer again.
        expect(stream.tryAppend(command)).toBe(true);

        expect(getRetainedResources(stream)).toEqual([
            pipeline,
            indexBuffer.underlyingResource,
            vertexBuffers[0].effectiveBuffer!.underlyingResource,
            vertexBuffers[1].effectiveBuffer!.underlyingResource,
            bindGroups[0],
            bindGroups[1],
            indirectDrawBuffer,
            indirectDrawBuffer,
        ]);

        expect(stream.flush()).toBe(true);

        // Released, not shrunk: the slots are cleared so the objects can be collected.
        const internals = stream as unknown as { _pendingResources: Nullable<object>[] };
        expect(getRetainedResources(stream)).toEqual([]);
        expect(internals._pendingResources.every((resource) => resource === null)).toBe(true);
    });

    it("replays a rejected batch through direct encoder calls in encoding order", () => {
        const { renderPass, records, calls } = createRecordingRenderPass(false);
        const onDisabled = vi.fn();
        const provider = createProvider(true, "decoder rejected opcode");
        provider.onDisabled = onDisabled;
        const stream = new WebGPURenderPassCommandStream({ getProvider: () => provider });
        const errorSpy = vi.spyOn(Logger, "Error").mockImplementation(() => {});

        try {
            expect(stream.tryAppend(createCommand({ renderPass, start: 0 }))).toBe(true);
            expect(stream.tryAppend(createCommand({ renderPass, start: 36, bindGroups: [createResource<GPUBindGroup>(201), createResource<GPUBindGroup>(203)] }))).toBe(true);
            expect(stream.flush()).toBe(false);

            expect(records).toHaveLength(1);
            expect(calls).toEqual([
                ["setPipeline", 100],
                ["setIndexBuffer", 401, 1, 0],
                ["setVertexBuffer", 0, 301, 0],
                ["setVertexBuffer", 1, 302, 8],
                ["setBindGroup", 0, 201],
                ["setBindGroup", 1, 202],
                ["drawIndexed", 36, 2, 0, 0, 0],
                ["setBindGroup", 1, 203],
                ["drawIndexed", 36, 2, 36, 0, 0],
            ]);
            expect(errorSpy).toHaveBeenCalledTimes(1);
            expect(onDisabled).toHaveBeenCalledTimes(1);
            expect(onDisabled).toHaveBeenCalledWith({
                reason: "recording-rejected",
                message: expect.stringContaining("decoder rejected opcode"),
                hostError: "decoder rejected opcode",
                replayedDrawCount: 2,
            });

            // Disabled afterwards: nothing is retained and later draws go straight to the encoder.
            expect(getRetainedResources(stream)).toEqual([]);
            expect(stream.tryAppend(createCommand({ renderPass }))).toBe(false);
            expect(stream.flush()).toBe(false);
            expect(records).toHaveLength(1);
        } finally {
            errorSpy.mockRestore();
        }
    });

    it("replays non-indexed and indirect draws from the retained objects", () => {
        const { renderPass, calls } = createRecordingRenderPass(false);
        const stream = createStream();
        const errorSpy = vi.spyOn(Logger, "Error").mockImplementation(() => {});

        try {
            expect(stream.tryAppend(createNonIndexedCommand({ renderPass }))).toBe(true);
            expect(stream.tryAppend(createNonIndexedCommand({ renderPass, indirectDrawBuffer: createResource<GPUBuffer>(502) }))).toBe(true);
            expect(stream.tryAppend(createCommand({ renderPass, indirectDrawBuffer: createResource<GPUBuffer>(501) }))).toBe(true);
            expect(stream.flush()).toBe(false);

            expect(calls.filter((call) => call[0].startsWith("draw"))).toEqual([
                ["draw", 12, 1, 4, 0],
                ["drawIndirect", 502, 0],
                ["drawIndexedIndirect", 501, 0],
            ]);
        } finally {
            errorSpy.mockRestore();
        }
    });

    it("treats a throwing host recorder as a rejected batch", () => {
        const { renderPass, calls } = createRecordingRenderPass();
        setRecorder(renderPass, () => {
            throw new Error("native decoder panicked");
        });
        const onDisabled = vi.fn();
        const provider = createProvider();
        provider.onDisabled = onDisabled;
        const stream = new WebGPURenderPassCommandStream({ getProvider: () => provider });
        const errorSpy = vi.spyOn(Logger, "Error").mockImplementation(() => {});

        try {
            expect(stream.tryAppend(createCommand({ renderPass }))).toBe(true);
            expect(() => stream.flush()).not.toThrow();

            expect(calls.map((call) => call[0])).toContain("drawIndexed");
            expect(errorSpy).toHaveBeenCalledTimes(1);
            expect(onDisabled).toHaveBeenCalledWith(
                expect.objectContaining({ reason: "recording-threw", message: expect.stringContaining("native decoder panicked"), replayedDrawCount: 1 })
            );
        } finally {
            errorSpy.mockRestore();
        }
    });

    it("reports a protocol mismatch through the provider with nothing replayed", () => {
        const { renderPass, calls } = createRecordingRenderPass();
        const onDisabled = vi.fn();
        const provider = createProvider();
        provider.protocolVersion = WebGPURenderPassCommandStreamProtocolVersion + 1;
        provider.onDisabled = onDisabled;
        const stream = new WebGPURenderPassCommandStream({ getProvider: () => provider });
        const errorSpy = vi.spyOn(Logger, "Error").mockImplementation(() => {});

        try {
            expect(stream.tryAppend(createCommand({ renderPass }))).toBe(false);

            expect(calls).toHaveLength(0);
            expect(onDisabled).toHaveBeenCalledTimes(1);
            expect(onDisabled).toHaveBeenCalledWith(expect.objectContaining({ reason: "protocol-mismatch", hostError: undefined, replayedDrawCount: 0 }));
        } finally {
            errorSpy.mockRestore();
        }
    });

    it("keeps rendering when the onDisabled handler throws", () => {
        const { renderPass, calls } = createRecordingRenderPass(false);
        const provider = createProvider();
        provider.onDisabled = () => {
            throw new Error("telemetry offline");
        };
        const stream = new WebGPURenderPassCommandStream({ getProvider: () => provider });
        const errorSpy = vi.spyOn(Logger, "Error").mockImplementation(() => {});

        try {
            expect(stream.tryAppend(createCommand({ renderPass }))).toBe(true);
            expect(() => stream.flush()).not.toThrow();

            expect(calls.map((call) => call[0])).toContain("drawIndexed");
            expect(errorSpy).toHaveBeenCalledTimes(2);
            expect(errorSpy).toHaveBeenLastCalledWith(expect.stringContaining("telemetry offline"));
        } finally {
            errorSpy.mockRestore();
        }
    });

    it("bounds a batch to the maximum draw count and re-emits state in the next batch", () => {
        const { renderPass, records } = createRecordingRenderPass();
        const stream = createStream();

        for (let drawIndex = 0; drawIndex <= WebGPURenderPassCommandStreamMaxDrawsPerBatch; drawIndex++) {
            expect(stream.tryAppend(createCommand({ renderPass, start: drawIndex }))).toBe(true);
        }

        expect(records).toHaveLength(1);
        expect(records[0].drawCount).toBe(WebGPURenderPassCommandStreamMaxDrawsPerBatch);

        expect(stream.flush()).toBe(true);
        expect(records).toHaveLength(2);
        expect(records[1].drawCount).toBe(1);
        expect(parseOpcodes(records[1].words)).toContain(WebGPURenderPassCommandOpcode.setPipeline);
    });
});

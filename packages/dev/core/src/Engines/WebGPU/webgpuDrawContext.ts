import type { VertexBuffer } from "../../Buffers/buffer";
import type { DataBuffer } from "../../Buffers/dataBuffer";
import type { WebGPUDataBuffer } from "../../Meshes/WebGPU/webgpuDataBuffer";
import type { Nullable } from "../../types";
import type { IDrawContext } from "../IDrawContext";
import type { WebGPUBufferManager } from "./webgpuBufferManager";
import type { WebGPUPipelineContext } from "./webgpuPipelineContext";
import * as WebGPUConstants from "./webgpuConstants";

/**
 * WebGPU implementation of the IDrawContext interface.
 * This class manages the draw context for WebGPU, including buffers and indirect draw data.
 */
export class WebGPUDrawContext implements IDrawContext {
    private static _Counter = 0;

    /**
     * Bundle used in fast mode (when compatibilityMode==false)
     */
    public fastBundle?: GPURenderBundle;
    /**
     * Cache of the bind groups. Will be reused for the next draw if isDirty==false (and materialContext.isDirty==false)
     */
    public bindGroups?: GPUBindGroup[];

    public uniqueId: number;

    /**
     * @internal
     * By default, indirect draws are enabled in NON compatibility mode only
     * To enable indirect draws in compatibility mode (done by the end user), enableIndirectDraw must be set to true
     */
    public _enableIndirectDrawInCompatMode = false;

    /**
     * Buffers (uniform / storage) used for the draw call
     */
    public buffers: { [name: string]: Nullable<WebGPUDataBuffer> };

    public indirectDrawBuffer?: GPUBuffer;

    private _materialContextUpdateId: number;
    private _bufferManager: WebGPUBufferManager;
    private _useInstancing: boolean;
    private _indirectDrawData?: Uint32Array;
    private _currentInstanceCount: number;
    private _isDirty: boolean;
    private _enableIndirectDraw: boolean;
    private _vertexPullingEnabled: boolean;

    /**
     * Checks if the draw context is dirty.
     * @param materialContextUpdateId The update ID of the material context associated with the draw context.
     * @returns True if the draw or material context is dirty, false otherwise.
     */
    public isDirty(materialContextUpdateId: number): boolean {
        return this._isDirty || this._materialContextUpdateId !== materialContextUpdateId;
    }

    /**
     * Resets the dirty state of the draw context.
     * @param materialContextUpdateId The update ID of the material context associated with the draw context.
     */
    public resetIsDirty(materialContextUpdateId: number): void {
        this._isDirty = false;
        this._materialContextUpdateId = materialContextUpdateId;
    }

    public get enableIndirectDraw() {
        return this._enableIndirectDraw;
    }

    public set enableIndirectDraw(enable: boolean) {
        this._enableIndirectDrawInCompatMode = true;

        if (this._enableIndirectDraw === enable) {
            return;
        }

        this._enableIndirectDraw = enable;

        if (!enable && !this._useInstancing && this.indirectDrawBuffer) {
            this._bufferManager.releaseBuffer(this.indirectDrawBuffer);
            this.indirectDrawBuffer = undefined;
            this._indirectDrawData = undefined;
        } else if (enable && !this.indirectDrawBuffer) {
            this.indirectDrawBuffer = this._bufferManager.createRawBuffer(
                20,
                WebGPUConstants.BufferUsage.CopyDst | WebGPUConstants.BufferUsage.Indirect | WebGPUConstants.BufferUsage.Storage,
                undefined,
                "IndirectDrawBuffer"
            );
            this._indirectDrawData = new Uint32Array(5);
            this._indirectDrawData[3] = 0;
            this._indirectDrawData[4] = 0;
        }
    }

    public get useInstancing() {
        return this._useInstancing;
    }

    public set useInstancing(use: boolean) {
        if (this._useInstancing === use) {
            return;
        }

        this._useInstancing = use;
        this._currentInstanceCount = -1;

        const enableIndirectDrawInCompatMode = this._enableIndirectDrawInCompatMode;

        this.enableIndirectDraw = use;

        this._enableIndirectDrawInCompatMode = enableIndirectDrawInCompatMode;
    }

    /**
     * Creates a new WebGPUDrawContext.
     * @param bufferManager The buffer manager used to manage WebGPU buffers.
     * @param _dummyIndexBuffer A dummy index buffer to be bound as the "indices"
     * storage buffer when no index buffer is provided.
     */
    constructor(
        bufferManager: WebGPUBufferManager,
        private _dummyIndexBuffer: WebGPUDataBuffer
    ) {
        this._bufferManager = bufferManager;
        this.uniqueId = WebGPUDrawContext._Counter++;
        this._useInstancing = false;
        this._currentInstanceCount = 0;
        this._enableIndirectDraw = false;
        this._vertexPullingEnabled = false;
        this.reset();
    }

    public reset(): void {
        this.buffers = {};
        this._isDirty = true;
        this._materialContextUpdateId = 0;
        this.fastBundle = undefined;
        this.bindGroups = undefined;
        this._vertexPullingEnabled = false;
    }

    /**
     * Associates a buffer to the draw context.
     * @param name The name of the buffer.
     * @param buffer The buffer to set.
     */
    public setBuffer(name: string, buffer: Nullable<WebGPUDataBuffer>): void {
        this._isDirty ||= buffer?.uniqueId !== this.buffers[name]?.uniqueId;

        this.buffers[name] = buffer;
    }

    public setIndirectData(indexOrVertexCount: number, instanceCount: number, firstIndexOrVertex: number, forceUpdate = false): void {
        if ((!forceUpdate && instanceCount === this._currentInstanceCount) || !this.indirectDrawBuffer || !this._indirectDrawData) {
            // The current buffer is already up to date so do nothing
            // Note that we only check for instanceCount and not indexOrVertexCount nor firstIndexOrVertex because those values
            // are supposed to not change during the lifetime of a draw context
            return;
        }
        this._currentInstanceCount = instanceCount;

        this._indirectDrawData[0] = indexOrVertexCount;
        this._indirectDrawData[1] = instanceCount;
        this._indirectDrawData[2] = firstIndexOrVertex;

        this._bufferManager.setRawData(this.indirectDrawBuffer, 0, this._indirectDrawData, 0, 20);
    }

    /**
     * Setup or disable vertex pulling as needed.
     * @param useVertexPulling Use vertex pulling or not
     * @param webgpuPipelineContext The WebGPU pipeline context
     * @param vertexBuffers The current vertex buffers
     * @param indexBuffer The current index buffer
     * @param overrideVertexBuffers The vertex buffers to override
     */
    public setVertexPulling(
        useVertexPulling: boolean,
        webgpuPipelineContext: WebGPUPipelineContext,
        vertexBuffers: { [key: string]: Nullable<VertexBuffer> },
        indexBuffer: Nullable<DataBuffer>,
        overrideVertexBuffers: Nullable<{ [kind: string]: Nullable<VertexBuffer> }>
    ): void {
        if (this._vertexPullingEnabled === useVertexPulling) {
            return;
        }

        this._vertexPullingEnabled = useVertexPulling;
        this._isDirty = true;

        const bufferNames = webgpuPipelineContext.shaderProcessingContext.bufferNames;

        if (overrideVertexBuffers) {
            for (const attributeName in overrideVertexBuffers) {
                const vertexBuffer = overrideVertexBuffers[attributeName];
                if (!vertexBuffer || bufferNames.indexOf(attributeName) === -1) {
                    continue;
                }

                const buffer = vertexBuffer.effectiveBuffer as Nullable<WebGPUDataBuffer>;

                this.setBuffer(attributeName, useVertexPulling ? buffer : null);
            }
        }

        for (const attributeName in vertexBuffers) {
            if (overrideVertexBuffers && attributeName in overrideVertexBuffers) {
                continue;
            }

            const vertexBuffer = vertexBuffers[attributeName];
            if (!vertexBuffer || bufferNames.indexOf(attributeName) === -1) {
                continue;
            }

            const buffer = vertexBuffer.effectiveBuffer as Nullable<WebGPUDataBuffer>;

            this.setBuffer(attributeName, useVertexPulling ? buffer : null);
        }

        if (bufferNames.indexOf("indices") !== -1) {
            this.setBuffer("indices", !useVertexPulling ? null : ((indexBuffer as WebGPUDataBuffer) ?? this._dummyIndexBuffer));
        }
    }

    public dispose(): void {
        if (this.indirectDrawBuffer) {
            this._bufferManager.releaseBuffer(this.indirectDrawBuffer);
            this.indirectDrawBuffer = undefined;
            this._indirectDrawData = undefined;
        }
        this.fastBundle = undefined;
        this.bindGroups = undefined;
        this.buffers = undefined as any;
        this._enableIndirectDraw = false;
    }
}

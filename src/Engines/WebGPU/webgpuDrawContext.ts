import { WebGPUDataBuffer } from "../../Meshes/WebGPU/webgpuDataBuffer";
import { Nullable } from "../../types";
import { IDrawContext } from "../IDrawContext";
import { WebGPUBufferManager } from "./webgpuBufferManager";
import * as WebGPUConstants from './webgpuConstants';

/** @hidden */
export class WebGPUDrawContext implements IDrawContext {
    private static _Counter = 0;

    public fastBundle?: GPURenderBundle; // used only when compatibilityMode==false (fast mode)
    public bindGroups?: GPUBindGroup[]; // cache of the bind groups. Will be reused for the next draw if isDirty==false (and materialContext.isDirty==false)

    public uniqueId: number;

    public isDirty: boolean;
    public buffers: { [name: string]: Nullable<WebGPUDataBuffer> };

    public indirectDrawBuffer?: GPUBuffer;

    private _bufferManager: WebGPUBufferManager;
    private _useInstancing: boolean;
    private _indirectDrawData?: Uint32Array;
    private _currentInstanceCount: number;

    public get useInstancing() {
        return this._useInstancing;
    }

    public set useInstancing(use: boolean) {
        if (this._useInstancing === use) {
            return;
        }

        if (!use) {
            if (this.indirectDrawBuffer) {
                this._bufferManager.releaseBuffer(this.indirectDrawBuffer);
            }
            this.indirectDrawBuffer = undefined;
            this._indirectDrawData = undefined;
        } else {
            this.indirectDrawBuffer = this._bufferManager.createRawBuffer(40, WebGPUConstants.BufferUsage.CopyDst | WebGPUConstants.BufferUsage.Indirect);
            this._indirectDrawData = new Uint32Array(5);
            this._indirectDrawData[3] = 0;
            this._indirectDrawData[4] = 0;
        }

        this._useInstancing = use;
        this._currentInstanceCount = -1;
    }

    constructor(bufferManager: WebGPUBufferManager) {
        this._bufferManager = bufferManager;
        this.uniqueId = WebGPUDrawContext._Counter++;
        this._useInstancing = false;
        this._currentInstanceCount = 0;
        this.reset();
    }

    public reset(): void {
        this.buffers = {};
        this.isDirty = true;
        this.fastBundle = undefined;
        this.bindGroups = undefined;
    }

    public setBuffer(name: string, buffer: Nullable<WebGPUDataBuffer>): void {
        this.isDirty ||= buffer?.uniqueId !== this.buffers[name]?.uniqueId;

        this.buffers[name] = buffer;
    }

    public setIndirectData(indexOrVertexCount: number, instanceCount: number, firstIndexOrVertex: number): void {
        if (instanceCount === this._currentInstanceCount || !this.indirectDrawBuffer || !this._indirectDrawData) {
            // The current buffer is already up to date so do nothing
            // Note that we only check for instanceCount and not indexOrVertexCount nor firstIndexOrVertex because those values
            // are supposed to not change during the lifetime of a draw context
            return;
        }
        this._currentInstanceCount = instanceCount;

        this._indirectDrawData![0] = indexOrVertexCount;
        this._indirectDrawData![1] = instanceCount;
        this._indirectDrawData![2] = firstIndexOrVertex;

        this._bufferManager.setRawData(this.indirectDrawBuffer, 0, this._indirectDrawData, 0, 20);
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
    }
}

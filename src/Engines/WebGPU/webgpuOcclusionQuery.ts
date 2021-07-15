import { Nullable } from "../../types";
import { WebGPUEngine } from "../webgpuEngine";
import { WebGPUBufferManager } from './webgpuBufferManager';
import * as WebGPUConstants from './webgpuConstants';
import { WebGPUQuerySet } from "./webgpuQuerySet";

/** @hidden */
export class WebGPUOcclusionQuery {

    private _engine: WebGPUEngine;
    private _device: GPUDevice;
    private _bufferManager: WebGPUBufferManager;

    private _currentTotalIndices: number;
    private _countIncrement: number;
    private _querySet: WebGPUQuerySet;
    private _availableIndices: number[] = [];
    private _lastBuffer: Nullable<BigUint64Array>;
    private _frameLastBuffer: number;

    public get querySet(): GPUQuerySet {
        return this._querySet.querySet;
    }

    public get hasQueries(): boolean {
        return this._currentTotalIndices !== this._availableIndices.length;
    }

    public get canBeginQuery(): boolean {
        const passIndex = this._engine._getCurrentRenderPassIndex();
        switch (passIndex) {
            case 0: {
                return this._engine._mainRenderPassWrapper.renderPassDescriptor!.occlusionQuerySet !== undefined;
            }
            case 1: {
                return this._engine._rttRenderPassWrapper.renderPassDescriptor!.occlusionQuerySet !== undefined;
            }
        }

        return false;
    }

    constructor(engine: WebGPUEngine, device: GPUDevice, bufferManager: WebGPUBufferManager, startCount = 50, incrementCount = 100) {
        this._engine = engine;
        this._device = device;
        this._bufferManager = bufferManager;

        this._frameLastBuffer = -1;
        this._currentTotalIndices = 0;
        this._countIncrement = incrementCount;

        this._allocateNewIndices(startCount);
    }

    public createQuery(): number {
        if (this._availableIndices.length === 0) {
            this._allocateNewIndices();
        }

        const index = this._availableIndices[this._availableIndices.length - 1];
        this._availableIndices.length--;

        return index;
    }

    public deleteQuery(index: number): void {
        this._availableIndices[this._availableIndices.length - 1] = index;
    }

    public isQueryResultAvailable(index: number): boolean {
        this._retrieveQueryBuffer();

        return !!this._lastBuffer && index < this._lastBuffer.length;
    }

    public getQueryResult(index: number): number {
        return Number(this._lastBuffer?.[index] ?? -1);
    }

    private _retrieveQueryBuffer(): void {
        if (this._lastBuffer && this._frameLastBuffer === this._engine.frameId) {
            return;
        }

        if (this._frameLastBuffer !== this._engine.frameId) {
            this._frameLastBuffer = this._engine.frameId;
            this._querySet.readValues(0, this._currentTotalIndices).then((arrayBuffer) => {
                this._lastBuffer = arrayBuffer;
            });
        }
    }

    private _allocateNewIndices(numIndices?: number): void {
        numIndices = numIndices ?? this._countIncrement;

        this._delayQuerySetDispose();

        for (let i = 0; i < numIndices; ++i) {
            this._availableIndices.push(this._currentTotalIndices + i);
        }

        this._currentTotalIndices += numIndices;
        this._querySet = new WebGPUQuerySet(this._currentTotalIndices, WebGPUConstants.QueryType.Occlusion, this._device, this._bufferManager, false);
    }

    private _delayQuerySetDispose(): void {
        const querySet = this._querySet;
        if (querySet) {
            // Wait a bit before disposing of the queryset, in case some queries are still running for it
            setTimeout(() => querySet.dispose, 1000);
        }
    }

    public dispose(): void {
        this._querySet?.dispose();
        this._availableIndices = [];
    }
}
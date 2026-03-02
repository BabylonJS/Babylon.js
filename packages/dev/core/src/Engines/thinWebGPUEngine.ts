import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import { InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { AbstractEngine } from "./abstractEngine";
import type { WebGPUCacheRenderPipeline } from "./WebGPU/webgpuCacheRenderPipeline";
import type { WebGPUTextureManager } from "./WebGPU/webgpuTextureManager";
import type { WebGPUHardwareTexture } from "./WebGPU/webgpuHardwareTexture";
import type { Nullable } from "core/types";
import { Logger } from "core/Misc/logger";
import { WebGPUTextureHelper } from "./WebGPU/webgpuTextureHelper";
import type { WebGPURenderTargetWrapper } from "./WebGPU/webgpuRenderTargetWrapper";
import { WebGPUPerfCounter } from "./WebGPU/webgpuPerfCounter";
import type { WebGPUSnapshotRendering } from "./WebGPU/webgpuSnapshotRendering";
import { Constants } from "./constants";
import type { WebGPUBundleList } from "./WebGPU/webgpuBundleList";
import type { WebGPUTimestampQuery } from "./WebGPU/webgpuTimestampQuery";
import type { WebGPUOcclusionQuery } from "./WebGPU/webgpuOcclusionQuery";

/**
 * The base engine class for WebGPU
 */
export abstract class ThinWebGPUEngine extends AbstractEngine {
    // TODO WEBGPU remove those variables when code stabilized
    /** @internal */
    public dbgShowShaderCode = false;
    /** @internal */
    public dbgSanityChecks = true;
    /** @internal */
    public dbgLogIfNotDrawWrapper = true;
    /** @internal */
    public dbgShowEmptyEnableEffectCalls = true;

    /** @internal */
    public _textureHelper: WebGPUTextureManager;
    /** @internal */
    public _cacheRenderPipeline: WebGPUCacheRenderPipeline;
    /** @internal */
    public _occlusionQuery: WebGPUOcclusionQuery;

    // Frame Life Cycle (recreated each frame)
    /** @internal */
    public _renderEncoder: GPUCommandEncoder;
    /** @internal */
    public _uploadEncoder: GPUCommandEncoder;

    /** @internal */
    public _currentRenderPass: Nullable<GPURenderPassEncoder> = null;

    protected _snapshotRendering: WebGPUSnapshotRendering;
    protected _snapshotRenderingMode = Constants.SNAPSHOTRENDERING_STANDARD;

    /** @internal */
    public _timestampQuery: WebGPUTimestampQuery;
    /** @internal */
    public _timestampIndex = 0;

    /** @internal */
    public _showGPUDebugMarkersLog = false;
    /** @internal */
    public _debugStackRenderEncoder: string[] = [];
    /** @internal */
    public _debugStackRenderPass: string[] = [];
    /** @internal */
    public _debugNumPopPending = 0;

    /**
     * Gets the GPU time spent in the main render pass for the last frame rendered (in nanoseconds).
     * You have to enable the "timestamp-query" extension in the engine constructor options and set engine.enableGPUTimingMeasurements = true.
     * It will only return time spent in the main pass, not additional render target / compute passes (if any)!
     */
    public readonly gpuTimeInFrameForMainPass?: WebGPUPerfCounter;

    /**
     * Used for both the compatibilityMode=false and the snapshot rendering modes (as both can't be enabled at the same time)
     * @internal
     */
    public _bundleList: WebGPUBundleList;

    /**
     * Enables or disables GPU timing measurements.
     * Note that this is only supported if the "timestamp-query" extension is enabled in the options.
     */
    public get enableGPUTimingMeasurements(): boolean {
        return this._timestampQuery.enable;
    }

    public set enableGPUTimingMeasurements(enable: boolean) {
        if (this._timestampQuery.enable === enable) {
            return;
        }
        (this.gpuTimeInFrameForMainPass as any) = enable ? new WebGPUPerfCounter() : undefined;
        this._timestampQuery.enable = enable;
    }

    protected _currentPassIsMainPass() {
        return this._currentRenderTarget === null;
    }

    /** @internal */
    public _endCurrentRenderPass(): number {
        if (!this._currentRenderPass) {
            return 0;
        }

        if (this._debugStackRenderPass.length !== 0) {
            // We have pushed debug groups without popping them, we need to pop them before ending the render pass to avoid WebGPU validation errors
            // We will re-push them after starting the new render pass (if any)
            for (let i = 0; i < this._debugStackRenderPass.length; ++i) {
                this._currentRenderPass.popDebugGroup();
            }
        }

        const currentPassIndex = this._currentPassIsMainPass() ? 2 : 1;

        if (!this._snapshotRendering.endRenderPass(this._currentRenderPass) && !this.compatibilityMode) {
            this._bundleList.run(this._currentRenderPass);
            this._bundleList.reset();
        }
        this._currentRenderPass.end();

        this._timestampQuery.endPass(
            this._timestampIndex,
            (this._currentRenderTarget && (this._currentRenderTarget as WebGPURenderTargetWrapper).gpuTimeInFrame
                ? (this._currentRenderTarget as WebGPURenderTargetWrapper).gpuTimeInFrame
                : this.gpuTimeInFrameForMainPass) as WebGPUPerfCounter
        );
        this._timestampIndex += 2;

        // Pop all pending debug groups that couldn't be popped while the render pass was active
        while (this._debugNumPopPending-- > 0) {
            if (this._showGPUDebugMarkersLog) {
                Logger.Log(
                    `[${this.frameId}] Re-popping pending debug group on render encoder '${this._renderEncoder.label}' after ending current render pass '${this._currentRenderPass.label}'`
                );
            }
            this._renderEncoder.popDebugGroup();
            this._debugStackRenderEncoder.pop();
        }

        this._currentRenderPass = null;
        this._debugNumPopPending = 0;

        return currentPassIndex;
    }

    /**
     * @internal
     */
    public _generateMipmaps(texture: InternalTexture, commandEncoder?: GPUCommandEncoder) {
        commandEncoder = commandEncoder ?? this._renderEncoder;

        const gpuHardwareTexture = texture._hardwareTexture as Nullable<WebGPUHardwareTexture>;

        if (!gpuHardwareTexture) {
            return;
        }

        if (commandEncoder === this._renderEncoder) {
            // We must close the current pass (if any) because we are going to use the render encoder to generate the mipmaps (so, we are going to create a new render pass)
            this._endCurrentRenderPass();
        }

        const mipmapCount = WebGPUTextureHelper.ComputeNumMipmapLevels(texture.width, texture.height);

        if (texture.isCube) {
            this._textureHelper.generateCubeMipmaps(gpuHardwareTexture, mipmapCount, commandEncoder);
        } else if (texture._source === InternalTextureSource.Raw || texture._source === InternalTextureSource.Raw2DArray) {
            this._textureHelper.generateMipmaps(gpuHardwareTexture, texture.mipLevelCount, 0, commandEncoder);
        } else {
            this._textureHelper.generateMipmaps(gpuHardwareTexture, mipmapCount, 0, commandEncoder);
        }
    }

    protected _debugPushPendingGroups(forRenderPass: boolean) {
        const debugStack = forRenderPass ? this._debugStackRenderPass : this._debugStackRenderEncoder;
        const currentEncoder = forRenderPass ? this._currentRenderPass : this._renderEncoder;

        for (const groupName of debugStack) {
            if (this._showGPUDebugMarkersLog) {
                Logger.Log(
                    `[${this.frameId}] Re-pushing debug group '${groupName}' on ${forRenderPass ? "current render pass '" + this._currentRenderPass?.label + "'" : "render encoder '" + this._renderEncoder.label + "'"} after starting a new ${forRenderPass ? "render pass" : "render encoder"}`
                );
            }
            currentEncoder!.pushDebugGroup(groupName);
        }
    }
}

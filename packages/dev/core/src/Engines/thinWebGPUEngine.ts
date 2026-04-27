import { type InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { AbstractEngine } from "./abstractEngine";
import { type WebGPUCacheRenderPipeline } from "./WebGPU/webgpuCacheRenderPipeline";
import { type WebGPUTextureManager } from "./WebGPU/webgpuTextureManager";
import { type WebGPUHardwareTexture } from "./WebGPU/webgpuHardwareTexture";
import { type Nullable } from "core/types";
import { Logger } from "core/Misc/logger";
import { WebGPUTextureHelper } from "./WebGPU/webgpuTextureHelper";
import { type WebGPURenderTargetWrapper } from "./WebGPU/webgpuRenderTargetWrapper";
import { WebGPUPerfCounter } from "./WebGPU/webgpuPerfCounter";
import { type WebGPUSnapshotRendering } from "./WebGPU/webgpuSnapshotRendering";
import { Constants } from "./constants";
import { type WebGPUBundleList } from "./WebGPU/webgpuBundleList";
import { type WebGPUTimestampQuery } from "./WebGPU/webgpuTimestampQuery";
import { type WebGPUOcclusionQuery } from "./WebGPU/webgpuOcclusionQuery";

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
    public _debugMarkersEncoderGroups: string[] = [];
    /** @internal */
    public _debugMarkersPassGroups: string[] = [];
    /** @internal */
    public _debugMarkersPendingEncoderPops = 0;

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

        this._debugPopBeforeEndOfEncoder();

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

        this._debugPendingPop(this._currentRenderPass);

        this._currentRenderPass = null;

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

    protected _debugPopBeforeEndOfEncoder() {
        if (!this._enableGPUDebugMarkers) {
            return;
        }

        // When a render pass is active, pop its groups; otherwise pop encoder-level groups.
        // Pass-level groups are never pushed on the encoder, so we never pop them from it.
        const groups = this._currentRenderPass ? this._debugMarkersPassGroups : this._debugMarkersEncoderGroups;
        const target = this._currentRenderPass ?? this._renderEncoder;

        for (let i = groups.length - 1; i >= 0; --i) {
            if (this._showGPUDebugMarkersLog) {
                Logger.Log(
                    `[${this.frameId}] [E${this._debugMarkersEncoderGroups.length}|P${this._debugMarkersPassGroups.length}] [automatic] Popping debug group '${groups[i]}' on '${target.label}'.`
                );
            }
            target.popDebugGroup();
        }
    }

    protected _debugPushAfterStartOfEncoder() {
        if (!this._enableGPUDebugMarkers) {
            return;
        }

        // When a render pass is active, re-push its floating groups onto it; otherwise re-push
        // encoder-level groups onto the new render encoder.
        // Pass-level groups stay floating until the next render pass starts.
        const groups = this._currentRenderPass ? this._debugMarkersPassGroups : this._debugMarkersEncoderGroups;
        const target = this._currentRenderPass ?? this._renderEncoder;

        for (const groupName of groups) {
            if (this._showGPUDebugMarkersLog) {
                Logger.Log(
                    `[${this.frameId}] [E${this._debugMarkersEncoderGroups.length}|P${this._debugMarkersPassGroups.length}] [automatic] Pushing debug group '${groupName}' on '${target.label}'.`
                );
            }
            target.pushDebugGroup(groupName);
        }
    }

    protected _debugPendingPop(currentRenderPass: GPURenderPassEncoder) {
        if (!this._enableGPUDebugMarkers) {
            return;
        }

        // The user popped encoder-level groups while a render pass was active (the pass was the live
        // object, so the pops were deferred). Now that the pass has ended we replay them on the render
        // encoder. Because _debugMarkersEncoderGroups only ever contains encoder-level entries, popping
        // from it here can never accidentally consume a pass-level group.
        while (this._debugMarkersPendingEncoderPops-- > 0) {
            const groupName = this._debugMarkersEncoderGroups.pop();

            if (this._showGPUDebugMarkersLog) {
                Logger.Log(
                    `[${this.frameId}] [E${this._debugMarkersEncoderGroups.length}|P${this._debugMarkersPassGroups.length}] [automatic] Popping debug group '${groupName}' on render encoder '${this._renderEncoder.label}' after the end of render pass '${currentRenderPass.label}'.`
                );
            }

            this._renderEncoder.popDebugGroup();
        }

        this._debugMarkersPendingEncoderPops = 0;
    }
}

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
    public _debugMarkersStack: string[] = [];
    /** @internal */
    public _debugNumPopPending = 0;
    /** @internal */
    public _debugMarkersStackRenderPassStartIndex = 9999;

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

        const debugCommands = this._currentRenderPass ?? this._renderEncoder;
        const startIndex = this._currentRenderPass ? this._debugMarkersStackRenderPassStartIndex : 0;

        // When no render pass is active the render encoder only holds encoder-level groups (indices
        // 0 .. RPI-1).  Groups at indices RPI..end are "floating" — they were auto-popped from a
        // render pass that already ended and have not yet been re-pushed on the new encoder.  We
        // must NOT pop those from the render encoder because they were never pushed on it.
        const endIndex =
            !this._currentRenderPass && this._debugMarkersStackRenderPassStartIndex !== 9999 ? this._debugMarkersStackRenderPassStartIndex : this._debugMarkersStack.length;

        if (startIndex < endIndex) {
            // We pushed debug groups to the encoder, that the user hasn't yet popped, but we need to pop them before ending the encoder to avoid WebGPU validation errors.
            // We will re-push them after starting the new encoder (see _debugPushGroupsAfterStartOfEncoder).
            for (let i = endIndex - 1; i >= startIndex; --i) {
                if (this._showGPUDebugMarkersLog) {
                    Logger.Log(
                        `[${this.frameId}] [${this._debugMarkersStack.length}-${this._debugMarkersStackRenderPassStartIndex}] [automatic] Popping debug group '${this._debugMarkersStack[i]}' on '${debugCommands?.label}'.`
                    );
                }
                debugCommands.popDebugGroup();
            }
        }
    }

    protected _debugPushAfterStartOfEncoder() {
        if (!this._enableGPUDebugMarkers) {
            return;
        }

        const debugCommands = this._currentRenderPass ?? this._renderEncoder;
        const startIndex = this._currentRenderPass ? this._debugMarkersStackRenderPassStartIndex : 0;

        if (startIndex < this._debugMarkersStack.length) {
            // We pushed debug groups that the user hadn't yet popped to the encoder, but that we popped ourselves because the encoder ended (see _debugPopGroupsBeforeEndOfEncoder).
            // We need to re-push them on the new encoder to avoid WebGPU validation errors when the user pops them later.
            for (let i = startIndex; i < this._debugMarkersStack.length; ++i) {
                const groupName = this._debugMarkersStack[i];
                if (this._showGPUDebugMarkersLog) {
                    Logger.Log(
                        `[${this.frameId}] [${this._debugMarkersStack.length}-${this._debugMarkersStackRenderPassStartIndex}] [automatic] Pushing debug group '${groupName}' on '${debugCommands?.label}'.`
                    );
                }
                debugCommands.pushDebugGroup(groupName);
            }

            if (!this._currentRenderPass) {
                // We pushed everything to the render encoder, so no groups pushed to a render pass.
                this._debugMarkersStackRenderPassStartIndex = 9999;
            }
        }
    }

    protected _debugPendingPop(currentRenderPass: GPURenderPassEncoder) {
        if (!this._enableGPUDebugMarkers) {
            return;
        }

        // The user popped groups on a render pass, but they were pushed on the render encoder.
        // Now that the render pass has ended, we need to execute the pending pops on the render encoder to avoid WebGPU validation errors.
        //
        // Important: pending pops always target encoder-level groups (indices 0..RPI-1).  If the
        // user also pushed render-pass-level groups after the deferred pops were recorded, those
        // groups now sit *above* the encoder-level ones in the stack (indices RPI..end) after
        // _debugPopBeforeEndOfEncoder auto-popped them from the render pass.  We must therefore
        // pop from just *below* RPI rather than from the absolute top of the stack to avoid
        // consuming the wrong (render-pass-level) entries.
        while (this._debugNumPopPending-- > 0) {
            let groupName: string | undefined;
            if (this._debugMarkersStackRenderPassStartIndex !== 9999) {
                // Floating render-pass groups occupy the top of the stack; pop from just below them.
                const popIndex = this._debugMarkersStackRenderPassStartIndex - 1;
                if (popIndex >= 0) {
                    groupName = this._debugMarkersStack.splice(popIndex, 1)[0];
                    // The render-pass entries shift down by one slot; keep RPI consistent.
                    this._debugMarkersStackRenderPassStartIndex--;
                }
            } else {
                groupName = this._debugMarkersStack.pop();
            }

            if (this._showGPUDebugMarkersLog) {
                Logger.Log(
                    `[${this.frameId}] [${this._debugMarkersStack.length}-${this._debugMarkersStackRenderPassStartIndex}] [automatic] Popping debug group '${groupName}' on render encoder '${this._renderEncoder.label}' after the end of render pass '${currentRenderPass.label}'.`
                );
            }

            this._renderEncoder.popDebugGroup();
        }

        this._debugNumPopPending = 0;
    }
}

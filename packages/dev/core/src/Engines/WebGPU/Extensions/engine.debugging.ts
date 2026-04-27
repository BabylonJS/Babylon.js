/**
 * # WebGPU Debug Marker Implementation — Problem Statement
 *
 * ## Background
 *
 * WebGPU exposes `pushDebugGroup` / `popDebugGroup` on two distinct objects:
 *   - The **render encoder** (`GPUCommandEncoder`), which lives for the lifetime of an entire
 *     submission (one call to `flushFramebuffer`).
 *   - The **render pass encoder** (`GPURenderPassEncoder`), which lives only for the duration of
 *     a single render pass.
 *
 * WebGPU requires that every push/pop pair is issued on the **same** object, and that all open
 * groups are closed before the object ends. Violating either rule is a validation error.
 *
 * ## The Core Problem
 *
 * From the Babylon.js side, the user calls `_debugPushGroup` / `_debugPopGroup` at arbitrary
 * points in time — completely independently of whether a render pass is currently active or not.
 * This creates several mismatched-context scenarios that must be handled transparently.
 *
 * ## Scenario 1 — Push on render encoder, pop inside a render pass
 *
 *   1. User calls `_debugPushGroup` while no render pass is active → group is pushed on the
 *      render encoder and recorded in `_debugMarkersEncoderGroups`.
 *   2. A render pass starts (`_currentRenderPass` becomes non-null).
 *   3. User calls `_debugPopGroup` while the render pass is active. The pop must logically target
 *      the render encoder group, but we cannot call `popDebugGroup` on the render encoder while a
 *      render pass is active (the pass is the live object).
 *   4. We detect this mismatch because `_debugMarkersPassGroups` is empty (no group was pushed
 *      during this render pass), so we increment `_debugMarkersPendingEncoderPops` instead of
 *      issuing the pop immediately.
 *   5. When the render pass ends (`_endCurrentRenderPass`), `_debugPendingPop` drains the
 *      `_debugMarkersPendingEncoderPops` counter and issues the deferred pops on the render encoder.
 *
 *   **Edge case — deferred pop followed by a render-pass push:** if the user pushes another group
 *   during the same render pass *after* the deferred pop was recorded, that new group goes into
 *   `_debugMarkersPassGroups`. When the pass ends, `_debugPopBeforeEndOfEncoder` auto-pops the
 *   pass-level group, leaving it floating in `_debugMarkersPassGroups`. `_debugPendingPop` then
 *   pops from `_debugMarkersEncoderGroups` — a separate array that can never contain pass-level
 *   entries — so the floating pass-level group is preserved intact and will be re-pushed on the
 *   next render pass by `_debugPushAfterStartOfEncoder`.
 *
 * ## Scenario 2 — Push inside a render pass, render pass ends before pop
 *
 *   1. User calls `_debugPushGroup` while a render pass is active → group is pushed on the render
 *      pass encoder and recorded in `_debugMarkersPassGroups`.
 *   2. The render pass ends (e.g. a new render target is bound) before the user calls
 *      `_debugPopGroup`. All open render-pass groups must be closed before
 *      `GPURenderPassEncoder.end()` is called.
 *   3. `_debugPopBeforeEndOfEncoder` auto-pops every group in `_debugMarkersPassGroups` from the
 *      render pass encoder. The names remain in `_debugMarkersPassGroups` (the array is not
 *      cleared) so the logical nesting is preserved and the groups are now "floating".
 *   4. After the next render pass is created, `_debugPushAfterStartOfEncoder` re-pushes all
 *      floating pass groups onto it, so that when the user eventually calls `_debugPopGroup`
 *      there is always a matching push on the current live object.
 *
 * ## Scenario 3 — `flushFramebuffer` called mid-frame (multiple times per frame)
 *
 *   `flushFramebuffer` submits all recorded GPU commands and creates a brand-new pair of encoders.
 *   It can be called more than once during a single Babylon.js frame (e.g. for read-back
 *   operations, multi-view rendering, or explicit flushes). Each call:
 *   1. Ends the current render pass if any (`_endCurrentRenderPass`), which triggers the
 *      render-pass auto-pop and pending-pop handling described above.
 *   2. Calls `_debugPopBeforeEndOfEncoder` to close every still-open group on the render encoder
 *      before it is finalised and submitted. Only encoder-level groups (`_debugMarkersEncoderGroups`)
 *      are popped from the encoder; pass-level groups (`_debugMarkersPassGroups`) are already
 *      floating after step 1 and were never pushed on the encoder, so they are left alone.
 *   3. Creates new `_uploadEncoder` / `_renderEncoder` instances.
 *   4. Calls `_debugPushAfterStartOfEncoder` to re-open the encoder-level groups on the new render
 *      encoder, so the user's subsequent pops still find a matching push.
 *   When `flushFramebuffer` is called from `endFrame` (the last flush of the frame), both arrays
 *   are cleared (`_debugMarkersEncoderGroups` and `_debugMarkersPassGroups`) because any groups
 *   still open at end-of-frame are considered abandoned.
 *
 * ## State variables
 *
 *   - `_debugMarkersEncoderGroups` — names of groups currently open on the render encoder (pushed
 *     while no render pass was active). These are re-pushed on the new render encoder after each
 *     mid-frame flush.
 *   - `_debugMarkersPassGroups` — names of groups pushed while a render pass was active. While a
 *     pass is live these are open on that pass encoder. When a pass ends they become "floating" —
 *     auto-popped from the finished pass but not yet on any GPU object — and remain here until the
 *     next render pass starts and `_debugPushAfterStartOfEncoder` re-opens them on it.
 *   - `_debugMarkersPendingEncoderPops` — count of user pops that arrived while a render pass was
 *     active but whose matching push lived on the render encoder. These pops are deferred and
 *     replayed on the render encoder once the render pass ends.
 */

import { Logger } from "../../../Misc/logger";
import { WebGPUEngine } from "../../webgpuEngine";

WebGPUEngine.prototype._debugPushGroup = function (groupName: string): void {
    if (!this._enableGPUDebugMarkers) {
        return;
    }

    const debugCommands = this._currentRenderPass ?? this._renderEncoder;

    debugCommands.pushDebugGroup(groupName);

    if (this._currentRenderPass) {
        this._debugMarkersPassGroups.push(groupName);
    } else {
        this._debugMarkersEncoderGroups.push(groupName);
    }

    if (this._showGPUDebugMarkersLog) {
        Logger.Log(
            `[${this.frameId}] [E${this._debugMarkersEncoderGroups.length}|P${this._debugMarkersPassGroups.length}] Pushing debug group '${groupName}' on '${debugCommands.label}'.`
        );
    }
};

WebGPUEngine.prototype._debugPopGroup = function (): void {
    if (!this._enableGPUDebugMarkers) {
        return;
    }

    const debugCommands = this._currentRenderPass ?? this._renderEncoder;

    if (this._currentRenderPass) {
        if (this._debugMarkersPassGroups.length > 0) {
            // Normal case: pop the most-recent pass-level group from the active render pass.
            const groupName = this._debugMarkersPassGroups.pop();
            debugCommands.popDebugGroup();
            if (this._showGPUDebugMarkersLog) {
                Logger.Log(
                    `[${this.frameId}] [E${this._debugMarkersEncoderGroups.length}|P${this._debugMarkersPassGroups.length}] Popping debug group '${groupName}' on '${debugCommands.label}'.`
                );
            }
        } else {
            // The group was pushed on the render encoder (before this pass started); we cannot pop
            // it while the pass is active, so defer it until the pass ends.
            this._debugMarkersPendingEncoderPops++;
            if (this._showGPUDebugMarkersLog) {
                Logger.Log(
                    `[${this.frameId}] [E${this._debugMarkersEncoderGroups.length}|P${this._debugMarkersPassGroups.length}] Deferring pop of encoder-level group on '${debugCommands.label}' (pending: ${this._debugMarkersPendingEncoderPops}).`
                );
            }
        }
    } else {
        if (this._debugMarkersPassGroups.length > 0) {
            // The group was pushed during a render pass that has since ended (floating). No GPU
            // object currently holds this push, so we just discard the name without any GPU call.
            const groupName = this._debugMarkersPassGroups.pop();
            if (this._showGPUDebugMarkersLog) {
                Logger.Log(
                    `[${this.frameId}] [E${this._debugMarkersEncoderGroups.length}|P${this._debugMarkersPassGroups.length}] Popping floating pass-level debug group '${groupName}' (no GPU pop needed).`
                );
            }
        } else {
            // Normal case: pop the most-recent encoder-level group from the render encoder.
            const groupName = this._debugMarkersEncoderGroups.pop();
            debugCommands.popDebugGroup();
            if (this._showGPUDebugMarkersLog) {
                Logger.Log(
                    `[${this.frameId}] [E${this._debugMarkersEncoderGroups.length}|P${this._debugMarkersPassGroups.length}] Popping debug group '${groupName}' on '${debugCommands.label}'.`
                );
            }
        }
    }
};

WebGPUEngine.prototype._debugInsertMarker = function (text: string): void {
    if (!this._enableGPUDebugMarkers) {
        return;
    }

    const debugCommands = this._currentRenderPass ?? this._renderEncoder;

    if (this._showGPUDebugMarkersLog) {
        Logger.Log(
            `[${this.frameId}] [E${this._debugMarkersEncoderGroups.length}|P${this._debugMarkersPassGroups.length}] Inserting debug marker '${text}' on '${debugCommands.label}'`
        );
    }

    debugCommands.insertDebugMarker(text);
};

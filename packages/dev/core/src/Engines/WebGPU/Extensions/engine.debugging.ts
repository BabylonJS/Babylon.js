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
 *      render encoder and recorded in `_debugMarkersStack`.
 *   2. A render pass starts (`_currentRenderPass` becomes non-null).
 *   3. User calls `_debugPopGroup` while the render pass is active. The pop must logically target
 *      the render encoder group, but we cannot call `popDebugGroup` on the render encoder while a
 *      render pass is active (the pass is the live object).
 *   4. We detect this mismatch because `_debugMarkersStackRenderPassStartIndex` is 9999 (no group
 *      was pushed during this render pass), so we increment `_debugNumPopPending` instead of
 *      issuing the pop immediately.
 *   5. When the render pass ends (`_endCurrentRenderPass`), `_debugPendingPop` drains the
 *      `_debugNumPopPending` counter and issues the deferred pops on the render encoder.
 *
 *   **Edge case — deferred pop followed by a render-pass push:** if the user pushes another group
 *   during the same render pass *after* the deferred pop was recorded (setting RPI to a value
 *   other than 9999), the render-pass-level group ends up above the encoder-level groups in
 *   `_debugMarkersStack`. When the pass ends, `_debugPopBeforeEndOfEncoder` auto-pops that
 *   render-pass group from the pass encoder, leaving it floating at the top of the stack.
 *   `_debugPendingPop` must therefore pop from just *below* RPI (i.e. from the encoder-level
 *   region), not from the absolute stack top. If it popped from the top instead, it would
 *   silently consume the floating render-pass entry — that entry would then be absent from the
 *   stack when `_debugPushAfterStartOfEncoder` runs for the next render pass, so it would never
 *   be re-pushed there. The user's eventual pop of that group on the next pass would call
 *   `popDebugGroup()` on a pass that has nothing pushed → WebGPU validation error.
 *
 * ## Scenario 2 — Push inside a render pass, render pass ends before pop
 *
 *   1. User calls `_debugPushGroup` while a render pass is active → group is pushed on the render
 *      pass encoder. `_debugMarkersStackRenderPassStartIndex` is set to mark where render-pass
 *      groups begin in `_debugMarkersStack`.
 *   2. The render pass ends (e.g. a new render target is bound) before the user calls
 *      `_debugPopGroup`. All open render-pass groups must be closed before
 *      `GPURenderPassEncoder.end()` is called.
 *   3. `_debugPopBeforeEndOfEncoder` auto-pops every group from `_debugMarkersStackRenderPassStartIndex`
 *      onwards on the render pass encoder. The names remain in `_debugMarkersStack` so the
 *      logical nesting is preserved.
 *   4. After the new render encoder (or the next render pass) is created,
 *      `_debugPushAfterStartOfEncoder` re-pushes those same groups on the new object, so that
 *      when the user eventually calls `_debugPopGroup` there is always a matching push on the
 *      current live object.
 *
 * ## Scenario 3 — `flushFramebuffer` called mid-frame (multiple times per frame)
 *
 *   `flushFramebuffer` submits all recorded GPU commands and creates a brand-new pair of encoders.
 *   It can be called more than once during a single Babylon.js frame (e.g. for read-back
 *   operations, multi-view rendering, or explicit flushes). Each call:
 *   1. Ends the current render pass if any (`_endCurrentRenderPass`), which triggers the
 *      render-pass auto-pop and pending-pop handling described above.
 *   2. Calls `_debugPopBeforeEndOfEncoder` to close every still-open group on the render encoder
 *      before it is finalised and submitted.
 *   3. Creates new `_uploadEncoder` / `_renderEncoder` instances.
 *   4. Calls `_debugPushAfterStartOfEncoder` to re-open those same groups on the new render
 *      encoder, so the user's subsequent pops still find a matching push.
 *   When `flushFramebuffer` is called from `endFrame` (the last flush of the frame), the stacks
 *   are fully reset instead (`_debugMarkersStack` is cleared, `_debugMarkersStackRenderPassStartIndex`
 *   is set back to 9999), because any groups still open at end-of-frame are considered abandoned.
 *
 *   **Edge case — render-pass groups present when `flushFramebuffer` is called:** after step 1
 *   above, `_currentRenderPass` is null but `_debugMarkersStackRenderPassStartIndex` may still
 *   be non-9999 (the render-pass auto-pop in `_endCurrentRenderPass` does not reset it). Those
 *   render-pass-level groups are "floating" — auto-popped from the pass but not yet on the new
 *   encoder. The `_debugPopBeforeEndOfEncoder` call in step 2 must therefore only pop
 *   encoder-level groups (indices 0..RPI-1) from the old render encoder, never the floating
 *   render-pass-level ones (which were never pushed on the encoder).
 *
 * ## State variables
 *
 *   - `_debugMarkersStack` — parallel stack of group names for every group the user has pushed
 *     but not yet popped. Acts as the source of truth for the logical nesting, independent of
 *     which underlying GPU object currently holds the live push.
 *   - `_debugMarkersStackRenderPassStartIndex` — index into `_debugMarkersStack` of the first
 *     group that was pushed while the current render pass was active (i.e. groups that live on
 *     the render pass encoder rather than on the render encoder). Sentinel value 9999 means no
 *     group has been pushed to the current render pass yet. Note: this value is NOT reset when a
 *     render pass ends — it remains non-9999 while groups are "floating" (auto-popped from the
 *     pass, not yet re-pushed on the next encoder/pass), allowing other methods to distinguish
 *     encoder-level from render-pass-level stack entries even after the pass has closed.
 *   - `_debugNumPopPending` — count of user pops that arrived while a render pass was active but
 *     whose matching push lived on the render encoder. These pops are deferred and replayed on
 *     the render encoder once the render pass ends.
 */

import { Logger } from "../../../Misc/logger";
import { WebGPUEngine } from "../../webgpuEngine";

WebGPUEngine.prototype._debugPushGroup = function (groupName: string): void {
    if (!this._enableGPUDebugMarkers) {
        return;
    }

    const debugCommands = this._currentRenderPass ?? this._renderEncoder;

    debugCommands.pushDebugGroup(groupName);
    this._debugMarkersStack.push(groupName);

    if (this._debugMarkersStackRenderPassStartIndex === 9999 && this._currentRenderPass) {
        this._debugMarkersStackRenderPassStartIndex = this._debugMarkersStack.length - 1;
    }

    if (this._showGPUDebugMarkersLog) {
        Logger.Log(
            `[${this.frameId}] [${this._debugMarkersStack.length}-${this._debugMarkersStackRenderPassStartIndex}] Pushing debug group '${groupName}' on '${debugCommands.label}' and to the debug stack.`
        );
    }
};

WebGPUEngine.prototype._debugPopGroup = function (): void {
    if (!this._enableGPUDebugMarkers) {
        return;
    }

    const debugCommands = this._currentRenderPass ?? this._renderEncoder;

    if (this._debugMarkersStackRenderPassStartIndex === 9999 && this._currentRenderPass) {
        this._debugNumPopPending++;

        if (this._showGPUDebugMarkersLog) {
            Logger.Log(
                `[${this.frameId}] [${this._debugMarkersStack.length}-${this._debugMarkersStackRenderPassStartIndex}] Popping debug group on '${debugCommands.label}' but no group was pushed to it, so recording a pending pop to be executed on the render encoder instead (num pop pending: ${this._debugNumPopPending}).`
            );
        }
    } else {
        const groupName = this._debugMarkersStack.pop();

        const currentIndex = this._debugMarkersStackRenderPassStartIndex;

        if (this._debugMarkersStack.length <= this._debugMarkersStackRenderPassStartIndex) {
            this._debugMarkersStackRenderPassStartIndex = 9999;
        }

        if (!this._currentRenderPass && currentIndex !== 9999) {
            if (this._showGPUDebugMarkersLog) {
                Logger.Log(
                    `[${this.frameId}] [${this._debugMarkersStack.length}-${this._debugMarkersStackRenderPassStartIndex}] Popping debug group '${groupName}' ONLY from the debug stack.`
                );
            }
        } else {
            debugCommands.popDebugGroup();

            if (this._showGPUDebugMarkersLog) {
                Logger.Log(
                    `[${this.frameId}] [${this._debugMarkersStack.length}-${this._debugMarkersStackRenderPassStartIndex}] Popping debug group '${groupName}' on '${debugCommands.label}' and from the debug stack.`
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
            `[${this.frameId}] [${this._debugMarkersStack.length}-${this._debugMarkersStackRenderPassStartIndex}] Inserting debug marker '${text}' on '${debugCommands.label}'`
        );
    }

    debugCommands.insertDebugMarker(text);
};

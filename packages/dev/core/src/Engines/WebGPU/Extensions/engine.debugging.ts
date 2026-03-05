import { Logger } from "../../../Misc/logger";
import { WebGPUEngine } from "../../webgpuEngine";

WebGPUEngine.prototype._debugPushGroup = function (groupName: string): void {
    if (!this._enableGPUDebugMarkers) {
        return;
    }

    if (this._currentRenderPass) {
        if (this._showGPUDebugMarkersLog) {
            Logger.Log(`[${this.frameId}] Pushing debug group '${groupName}' on current render pass '${this._currentRenderPass.label}'`);
        }
        this._currentRenderPass.pushDebugGroup(groupName);
        this._debugStackRenderPass.push(groupName);
    } else {
        if (this._showGPUDebugMarkersLog) {
            Logger.Log(`[${this.frameId}] Pushing debug group '${groupName}' on render encoder '${this._renderEncoder.label}'`);
        }
        this._renderEncoder.pushDebugGroup(groupName);
        this._debugStackRenderEncoder.push(groupName);
    }
};

WebGPUEngine.prototype._debugPopGroup = function (): void {
    if (!this._enableGPUDebugMarkers) {
        return;
    }

    if (this._currentRenderPass) {
        if (this._debugStackRenderPass.length === 0) {
            if (this._showGPUDebugMarkersLog) {
                Logger.Log(
                    `[${this.frameId}] Popping debug group on current render pass '${this._currentRenderPass.label}' but no group was pushed on it, so recording a pending pop to be executed after ending the current render pass`
                );
            }

            this._debugNumPopPending++;
        } else {
            if (this._showGPUDebugMarkersLog) {
                Logger.Log(`[${this.frameId}] Popping debug group on current render pass '${this._currentRenderPass.label}'`);
            }

            this._currentRenderPass.popDebugGroup();
            this._debugStackRenderPass.pop();
        }
    } else {
        if (this._showGPUDebugMarkersLog) {
            Logger.Log(`[${this.frameId}] Popping debug group on render encoder '${this._renderEncoder.label}'`);
        }
        this._renderEncoder.popDebugGroup();
        this._debugStackRenderEncoder.pop();
    }
};

WebGPUEngine.prototype._debugInsertMarker = function (text: string): void {
    if (!this._enableGPUDebugMarkers) {
        return;
    }

    if (this._currentRenderPass) {
        if (this._showGPUDebugMarkersLog) {
            Logger.Log(`[${this.frameId}] Inserting debug marker '${text}' on current render pass '${this._currentRenderPass.label}'`);
        }
        this._currentRenderPass.insertDebugMarker(text);
    } else {
        if (this._showGPUDebugMarkersLog) {
            Logger.Log(`[${this.frameId}] Inserting debug marker '${text}' on render encoder '${this._renderEncoder.label}'`);
        }
        this._renderEncoder.insertDebugMarker(text);
    }
};

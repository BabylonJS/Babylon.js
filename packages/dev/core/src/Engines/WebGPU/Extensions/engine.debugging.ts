import { WebGPUEngine } from "../../webgpuEngine";

WebGPUEngine.prototype._debugPushGroup = function (groupName: string): void {
    if (!this._options.enableGPUDebugMarkers) {
        return;
    }

    if (this._currentRenderTarget && !this._currentRenderPass) {
        this._startRenderTargetRenderPass(this._currentRenderTarget, false, null, false, false);
    }

    if (this._currentRenderPass) {
        this._currentRenderPass.pushDebugGroup(groupName);
    } else {
        this._renderEncoder.pushDebugGroup(groupName);
    }
};

WebGPUEngine.prototype._debugPopGroup = function (): void {
    if (!this._options.enableGPUDebugMarkers) {
        return;
    }

    if (this._currentRenderTarget && !this._currentRenderPass) {
        this._startRenderTargetRenderPass(this._currentRenderTarget, false, null, false, false);
    }

    if (this._currentRenderPass) {
        this._currentRenderPass.popDebugGroup();
    } else {
        this._renderEncoder.popDebugGroup();
    }
};

WebGPUEngine.prototype._debugInsertMarker = function (text: string): void {
    if (!this._options.enableGPUDebugMarkers) {
        return;
    }

    if (this._currentRenderTarget && !this._currentRenderPass) {
        this._startRenderTargetRenderPass(this._currentRenderTarget, false, null, false, false);
    }

    if (this._currentRenderPass) {
        this._currentRenderPass.insertDebugMarker(text);
    } else {
        this._renderEncoder.insertDebugMarker(text);
    }
};

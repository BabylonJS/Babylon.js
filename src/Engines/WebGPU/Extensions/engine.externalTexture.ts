import { WebGPUEngine } from "../../webgpuEngine";
import { ExternalTexture } from "../../../Materials/Textures/externalTexture";
import { Nullable } from "../../../types";
import { WebGPUExternalTexture } from "../webgpuExternalTexture";

WebGPUEngine.prototype.createExternalTexture = function (video: HTMLVideoElement): Nullable<ExternalTexture> {
    const texture = new WebGPUExternalTexture(
        this._device.importExternalTexture({
            source: video
        })
    );
    return texture;
};

WebGPUEngine.prototype.setExternalTexture = function (name: string, texture: Nullable<ExternalTexture>): void {
    if (this._currentEffect) {
        if (!texture) {
            this._currentMaterialContext.setTexture(name, null);
            return;
        }
        this._setInternalTexture(name, texture);
    }
};

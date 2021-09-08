import { ExternalTexture } from "../../Materials/Textures/externalTexture";

/** @hidden */
export class WebGPUExternalTexture extends ExternalTexture {
    private _texture: GPUExternalTexture;

    public constructor(resource: GPUExternalTexture) {
        super();
        this._texture = resource;
    }

    public get underlyingResource(): GPUExternalTexture {
        return this._texture;
    }
}
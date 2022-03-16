import { ExternalTexture } from "../../Materials/Textures/externalTexture";

/**
 * Nothing specific to WebGPU in this class, but the spec is not final yet so let's remove it later on
 * if it is not needed
 * @hidden
 **/
export class WebGPUExternalTexture extends ExternalTexture {
    public constructor(video: HTMLVideoElement) {
        super(video);
    }
}
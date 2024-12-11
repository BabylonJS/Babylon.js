import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { IAudioPositionerOptions } from "../spatial/audioPositioner";
import { AudioPositioner } from "../spatial/audioPositioner";
import type { ISpatialAudioTransformOptions } from "../spatial/spatialAudioTransform";

/** @internal */
export interface IWebAudioPositionerOptions extends IAudioPositionerOptions {}

/** @internal */
export async function _CreateAudioPositionerAsync(parent: AbstractAudioNode, options: Nullable<IWebAudioPositionerOptions> = null): Promise<AudioPositioner> {
    return new WebAudioPositioner(parent, options);
}

class WebAudioPositioner extends AudioPositioner {
    /** @internal */
    constructor(parent: AbstractAudioNode, options: Nullable<ISpatialAudioTransformOptions> = null) {
        super(parent, options);
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioPositioner";
    }
}

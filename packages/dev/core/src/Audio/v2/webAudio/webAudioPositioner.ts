import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AudioPositionerOptions } from "../audioPositioner";
import { AudioPositioner } from "../audioPositioner";
import type { SpatialAudioTransformOptions } from "../spatialAudioTransform";

/** @internal */
export interface WebAudioPositionerOptions extends AudioPositionerOptions {}

/** @internal */
export async function CreateAudioPositionerAsync(parent: AbstractAudioNode, options: Nullable<WebAudioPositionerOptions> = null): Promise<AudioPositioner> {
    return new WebAudioPositioner(parent, options);
}

class WebAudioPositioner extends AudioPositioner {
    /** @internal */
    constructor(parent: AbstractAudioNode, options: Nullable<SpatialAudioTransformOptions> = null) {
        super(parent, options);
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioPositioner";
    }
}

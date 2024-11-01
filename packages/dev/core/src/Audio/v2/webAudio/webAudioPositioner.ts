import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import { AudioPositioner } from "../audioPositioner";
import type { SpatialAudioTransformOptions } from "../spatialAudioTransform";

/** @internal */
export class WebAudioPositioner extends AudioPositioner {
    /** @internal */
    constructor(parent: AbstractAudioNode, options: Nullable<SpatialAudioTransformOptions> = null) {
        super(parent, options);
    }
}

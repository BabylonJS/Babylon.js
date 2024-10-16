import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import { AbstractAudioPositioner } from "../abstractAudioPositioner";
import type { ISpatialAudioTransformOptions } from "../spatialAudioTransform";

export class WebAudioPositioner extends AbstractAudioPositioner {
    public constructor(parent: AbstractAudioNode, options: Nullable<ISpatialAudioTransformOptions> = null) {
        super(parent, options);
    }
}

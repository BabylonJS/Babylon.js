import type { AbstractAudioNode } from "../abstractAudioNode";
import { AbstractAudioPositioner } from "../abstractAudioPositioner";
import type { ISpatialAudioTransformOptions } from "../spatialAudioTransform";

export class WebAudioPositioner extends AbstractAudioPositioner {
    public constructor(parent: AbstractAudioNode, options?: ISpatialAudioTransformOptions) {
        super(parent, options);
    }
}

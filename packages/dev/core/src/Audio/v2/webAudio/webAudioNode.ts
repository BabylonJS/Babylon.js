import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AbstractAudioSubNode } from "../abstractAudioSubNode";
import type { AbstractAudioSuperNode } from "../abstractAudioSuperNode";
import type { _WebAudioEngine } from "./webAudioEngine";

/** @internal */
export interface IWebAudioInputNode extends AbstractAudioNode {
    /** @internal */
    webAudioInputNode: Nullable<AudioNode>;
}

/** @internal */
export interface IWebAudioOutputNode extends AbstractAudioNode {
    /** @internal */
    webAudioOutputNode: Nullable<AudioNode>;
}

/** @internal */
export interface IWebAudioSuperNode extends AbstractAudioSuperNode, IWebAudioInputNode, IWebAudioOutputNode {
    /** @internal */
    engine: _WebAudioEngine;
}

/** @internal */
export interface IWebAudioSubNode extends AbstractAudioSubNode {
    /** @internal */
    node: AudioNode;
}

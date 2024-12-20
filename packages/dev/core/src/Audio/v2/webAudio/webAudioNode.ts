import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { _AbstractAudioSubNode } from "../subNodes/abstractAudioSubNode";
import type { _WebAudioEngine } from "./webAudioEngine";

/** @internal */
export interface IWebAudioInNode extends AbstractAudioNode {
    /** @internal */
    inNode: Nullable<AudioNode>;
}

/** @internal */
export interface IWebAudioOutNode extends AbstractAudioNode {
    /** @internal */
    outNode: Nullable<AudioNode>;
}

/** @internal */
export interface IWebAudioSubNode extends _AbstractAudioSubNode {
    /** @internal */
    node: AudioNode;
}

/** @internal */
export interface IWebAudioSuperNode extends IWebAudioInNode, IWebAudioOutNode {
    /** @internal */
    engine: _WebAudioEngine;
}

/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioNode } from "./abstractAudioNode";
import type { IDisposable } from "../../scene";

export interface IAudioNodeParent extends IDisposable {
    _addChildNode(node: AbstractAudioNode): void;
    _removeChildNode(node: AbstractAudioNode): void;
}

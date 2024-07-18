/* eslint-disable */

import { Matrix, Vector2 } from "../../../Maths";
import type { Nullable } from "../../../types";

/*
Questions:
- Can we add a `name` option instead of requiring it as a constructor parameter?
    - ...
- Can we add a Sound/StreamedSound `ready` callback as an option?
    - ...
*/

type Id = number;

let currentAudioEngine: Nullable<AudioEngine> = null;

export function getCurrentAudioEngine(): AudioEngine {
    if (!currentAudioEngine) {
        currentAudioEngine = new AudioEngine();
    }
    return currentAudioEngine;
}

export class AudioEngine {
    _nextId: Id = 1;

    audioContext = new AudioContext();
    objects = new Map<Id, AudioEngineObject>();

    addObject(object: AudioEngineObject, id?: Id): void {
        if (id !== undefined && id >= this._nextId) {
            this._nextId = id + 1;
        } else {
            id = this._nextId++;
        }
        object.id = id;
        this.objects.set(id, object);
    }
}

abstract class AudioEngineObject {
    audioEngine: AudioEngine;
    id: Id;

    constructor(audioEngine?: AudioEngine) {
        this.audioEngine = audioEngine ?? getCurrentAudioEngine();
        this.audioEngine.addObject(this);
    }
}

abstract class AbstractSoundSource extends AudioEngineObject {
    constructor(audioEngine?: AudioEngine) {
        super(audioEngine);
    }
}

export class SoundSourceOptions {
    sourceUrl?: string;
    sourceUrls?: Array<string>;
}

export class StaticSoundSource extends AbstractSoundSource {
    arrayBuffer: ArrayBuffer;

    constructor(options?: SoundSourceOptions, audioEngine?: AudioEngine) {
        super(audioEngine);
    }
}

export class StreamedSoundSource extends AbstractSoundSource {
    audioElement: HTMLAudioElement;

    constructor(options?: SoundSourceOptions, audioEngine?: AudioEngine) {
        super(audioEngine);
    }
}

abstract class NamedAudioEngineObject extends AudioEngineObject {
    name: string;

    constructor(name: string, audioEngine?: AudioEngine) {
        super(audioEngine);
        this.name = name;
    }
}

export interface AudioEffectsChainOptions {
    // ...
}

export class AudioEffectsChain extends NamedAudioEngineObject {
    nodes: Nullable<Array<AudioNode>>;

    get firstNode(): Nullable<AudioNode> {
        return this.nodes && this.nodes.length ? this.nodes[0] : null;
    }

    get lastNode(): Nullable<AudioNode> {
        return this.nodes && this.nodes.length ? this.nodes[this.nodes.length - 1] : null;
    }

    constructor(name: string, options?: AudioEffectsChainOptions, audioEngine?: AudioEngine) {
        super(name, audioEngine);
    }
}

export class CustomAudioPositioningAttenuation {
    curve: Array<Vector2>;
    // ...
}

interface AudioPositioningSourceLike {
    getWorldMatrix(): Matrix;
}

interface AudioGraphObjectOptions {
    effectsChain?: AudioEffectsChain;
    gain?: number; // aka `volume`
    parent?: AbstractAudioGraphObject;
    positioning?: {
        attenuation?: CustomAudioPositioningAttenuation;
        coneInnerAngle?: number;
        coneOuterAngle?: number;
        coneOuterGain?: number;
        distanceModel?: "linear" | "inverse" | "exponential";
        maxDistance?: number;
        minDistance?: number;
        rolloffFactor?: number;
        source?: AudioPositioningSourceLike;
        speakerPanning?: boolean;
    };
}

abstract class AbstractAudioGraphObject extends NamedAudioEngineObject {
    get firstNode(): AudioNode {
        return this._firstInternalNode ?? this.lastNode;
    }

    get lastNode(): AudioNode {
        return this._lastInternalNode ?? this.firstNode;
    }

    get _firstInternalNode(): Nullable<AudioNode> {
        if (this.effectsChain && this.effectsChain.firstNode) {
            return this.effectsChain.firstNode;
        }
        if (this.pannerNode) {
            return this.pannerNode;
        }
        if (this.spatializerNode) {
            return this.spatializerNode;
        }
        if (this.positioningMixNode) {
            return this.positioningMixNode;
        }
        return null;
    }

    get _lastInternalNode(): Nullable<AudioNode> {
        if (this.positioningMixNode) {
            return this.positioningMixNode;
        }
        if (this.spatializerNode) {
            return this.spatializerNode;
        }
        if (this.pannerNode) {
            return this.pannerNode;
        }
        if (this.effectsChain && this.effectsChain.lastNode) {
            return this.effectsChain.lastNode;
        }
        return null;
    }

    effectsChain: Nullable<AudioEffectsChain>;

    pannerNode: Nullable<StereoPannerNode>;
    spatializerNode: Nullable<PannerNode | AudioWorkletNode>;
    positioningMixNode: Nullable<GainNode>;

    outputs: Map<Id, Array<AudioBus>>;

    constructor(name: string, options?: AudioGraphObjectOptions, audioEngine?: AudioEngine) {
        super(name, audioEngine);
    }
}

export interface AudioBusOptions extends AudioGraphObjectOptions {
    // ...
}

export class AudioBus extends AbstractAudioGraphObject {
    gainNode: GainNode;

    inputs: Map<Id, Array<AbstractAudioGraphObject>>;

    override get lastNode(): GainNode {
        return this.gainNode;
    }

    constructor(name: string, options?: AudioBusOptions, audioEngine?: AudioEngine) {
        super(name, options, audioEngine);
    }
}

interface CommonSoundOptions extends AudioGraphObjectOptions {
    sourceId?: Id;
    sourceUrl?: string;
    sourceUrls?: Array<string>;
}

abstract class AbstractSound extends AbstractAudioGraphObject {
    abstract source: AbstractSoundSource;
    abstract sourceNode: AudioNode;

    override get firstNode(): AudioNode {
        return this.sourceNode;
    }

    constructor(name: string, options?: CommonSoundOptions, audioEngine?: AudioEngine) {
        super(name, options, audioEngine);
    }
}

export interface SoundOptions extends CommonSoundOptions {
    // ...
}

// Static/buffered sound. Loops are as seamless as possible with the given codec.
export class Sound extends AbstractSound {
    source: StaticSoundSource;
    sourceNode: AudioBufferSourceNode;

    constructor(name: string, options?: SoundOptions, audioEngine?: AudioEngine) {
        super(name, options, audioEngine);

        this.source = new StaticSoundSource(options, audioEngine);
    }
}

export interface StreamedSoundOptions extends CommonSoundOptions {
    // ...
}

// Streamed/non-static sound. Loops are likely to have gaps.
export class StreamedSound extends AbstractSound {
    source: StreamedSoundSource;
    sourceNode: MediaElementAudioSourceNode;

    constructor(name: string, options?: StreamedSoundOptions, audioEngine?: AudioEngine) {
        super(name, options, audioEngine);

        this.source = new StreamedSoundSource(options, audioEngine);
    }
}

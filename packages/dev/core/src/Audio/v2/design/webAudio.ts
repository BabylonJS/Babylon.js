/* eslint-disable */

import * as Physical from "./physical";
import { Vector3 } from "../../../Maths";

export class Engine implements Physical.IEngine {
    audioContext: AudioContext;

    inputs: Array<Bus>;
    graphObjects: Map<number, AbstractGraphObject>;
}

abstract class AbstractSubGraph {
    abstract firstNode: AudioNode;
    abstract lastNode: AudioNode;
}

class EffectChain extends AbstractSubGraph {
    nodes: Array<AudioNode>;

    get firstNode(): AudioNode {
        return this.nodes[0];
    }

    get lastNode(): AudioNode {
        return this.nodes[this.nodes.length - 1];
    }
}

class Positioner extends AbstractSubGraph implements Physical.IPositioner {
    nodes: Array<AudioNode>;

    get firstNode(): AudioNode {
        return this.nodes[0]; // varies depending on settings
    }

    get lastNode(): AudioNode {
        return this.nodes[this.nodes.length - 1]; // varies depending on settings.
    }

    get position(): Vector3 {
        return new Vector3();
    }
    set position(position: Vector3) {}
}

abstract class AbstractGraphObject {
    id: number;

    abstract node: AudioNode;

    effectChain: EffectChain;
    positioner: Positioner;
    outputs: Array<Bus>;
}

export class Bus extends AbstractGraphObject implements Physical.IBus {
    node: GainNode;

    inputs: Array<AbstractGraphObject>;
}

abstract class AbstractSource extends AbstractGraphObject implements Physical.IVoice {
    abstract start(): void;
    abstract stop(): void;
}

export class Sound extends AbstractSource {
    node: AudioBufferSourceNode;

    start(): void {}
    stop(): void {}
}

export class StreamedSound extends AbstractSource {
    node: MediaElementAudioSourceNode;

    start(): void {}
    stop(): void {}
}

class AdvancedBus extends Bus implements Physical.IAdvancedBus {
    physicalImplementation: Physical.Bus;

    constructor() {
        super();
        this.physicalImplementation = new Physical.Bus(this);
    }
}

class AdvancedSound extends Sound implements Physical.IAdvancedVoice {
    physicalImplementation: Physical.Voice;

    constructor() {
        super();
        this.physicalImplementation = new Physical.Voice(this);
    }
}

class AdvancedStreamedSound extends StreamedSound implements Physical.IAdvancedVoice {
    physicalImplementation: Physical.Voice;

    constructor() {
        super();
        this.physicalImplementation = new Physical.Voice(this);
    }
}

export class AdvancedEngine extends Engine implements Physical.IAdvancedEngine {
    physicalImplementation: Physical.Engine;

    constructor() {
        super();
        this.physicalImplementation = new Physical.Engine(this);
    }

    createBus(): AdvancedBus {
        return new AdvancedBus();
    }

    createVoice(): AdvancedSound {
        return new AdvancedSound();
    }

    createStreamedVoice(): AdvancedStreamedSound {
        return new AdvancedStreamedSound();
    }
}

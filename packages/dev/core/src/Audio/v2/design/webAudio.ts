/* eslint-disable */

import { VirtualVoice } from "./common";
import * as Physical from "./physical";
import { Vector3 } from "../../../Maths";

export class Engine implements Physical.IEngine {
    audioContext: AudioContext;

    graphItems: Map<number, AbstractGraphItem>;
    sources: Map<number, AbstractSource>;

    inputs: Array<Bus>;
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

abstract class AbstractGraphItem {
    id: number;

    abstract node: AudioNode;

    effectChain: EffectChain;
    positioner: Positioner;
    outputs: Array<Bus>;
}

export class Bus extends AbstractGraphItem implements Physical.IBus {
    node: GainNode;

    inputs: Array<AbstractGraphItem>;
}

abstract class AbstractSource implements Physical.ISource {
    id: number;
}

class Source extends AbstractSource {
    buffer: AudioBuffer;
}

class StreamedSource extends AbstractSource {
    audioElement: HTMLAudioElement;
}

abstract class AbstractSound extends AbstractGraphItem implements Physical.IVoice {
    abstract source: AbstractSource;

    abstract start(): void;
    abstract stop(): void;
}

export class Sound extends AbstractSound {
    node: AudioBufferSourceNode;
    source: Source;

    start(): void {}
    stop(): void {}
}

export class StreamedSound extends AbstractSound {
    node: MediaElementAudioSourceNode;
    source: StreamedSource;

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

class AdvancedSource extends Source implements Physical.IAdvancedSource {
    physicalImplementation: Physical.Source;

    constructor() {
        super();
        this.physicalImplementation = new Physical.Source(this);
    }
}

class AdvancedStreamedSource extends StreamedSource implements Physical.IAdvancedSource {
    physicalImplementation: Physical.Source;

    constructor() {
        super();
        this.physicalImplementation = new Physical.Source(this);
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

    createBus(options?: any): Physical.IAdvancedBus {
        return new AdvancedBus();
    }

    createSource(options?: any): Physical.IAdvancedSource {
        return options?.streaming ? new AdvancedStreamedSource() : new AdvancedSource();
    }

    createVoice(options?: any): Physical.IAdvancedVoice {
        return options?.streaming ? new AdvancedStreamedSound() : new AdvancedSound();
    }

    update(voices: Array<VirtualVoice>): void {
        //
    }
}

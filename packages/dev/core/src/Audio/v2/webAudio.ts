/* eslint-disable */

import * as Physical from "./physical";
import { Vector3 } from "../../Maths/math.vector";

/*
WebAudio backend.

The core classes in this module will replace our legacy audio engine ...
    - CoreEngine
    - CoreBus
    - CoreSound
    - CoreSoundStream

The advanced classes extend the core classes to implement the advanced audio engine's physical interfaces.

TODO: Split file into webAudioCore.ts and webAudio.ts?
*/

export class CoreEngine implements Physical.ICoreEngine {
    audioContext: AudioContext;

    inputs = new Array<CoreBus>();

    get unlocked(): boolean {
        return this.audioContext.state !== "suspended";
    }

    constructor(options?: any) {
        this.audioContext = options?.audioContext ?? new AudioContext();

        if (!this.unlocked) {
            if (options?.autoUnlock !== false) {
                const onWindowClick = () => {
                    this.unlock();
                    window.removeEventListener("click", onWindowClick);
                };
                window.addEventListener("click", onWindowClick);
            }

            const onAudioContextStateChange = () => {
                if (this.unlocked) {
                    this.audioContext.removeEventListener("statechange", onAudioContextStateChange);
                }
            };
            this.audioContext.addEventListener("statechange", onAudioContextStateChange);
        }
    }

    /**
     * Sends an audio context unlock request.
     *
     * Called automatically on user interaction when the `autoUnlock` option is `true`.
     *
     * Note that the audio context cannot be locked again after it is unlocked, and it this function should not need to
     * be called again after the audio context is successfully unlocked. The audio context should stay unlocked for the
     * the audio context lifetime.
     */
    public unlock(): void {
        this.audioContext.resume();
    }
}

// Advanced
export class Engine extends CoreEngine implements Physical.IEngine {
    physicalEngine: Physical.AbstractEngine;
    startTime: number;

    override inputs = new Array<Bus>();

    get currentTime(): number {
        return this.unlocked ? this.startTime + this.audioContext.currentTime : (performance.now() - this.startTime) / 1000;
    }

    constructor(options?: any) {
        super(options);

        if (!this.unlocked) {
            // Keep track of time while the audio context is locked so the engine still seems like it's running.
            this.startTime = performance.now();

            const onAudioContextStateChange = () => {
                if (this.unlocked) {
                    this.startTime = (performance.now() - this.startTime) / 1000;
                    this.audioContext.removeEventListener("statechange", onAudioContextStateChange);
                }
            };
            this.audioContext.addEventListener("statechange", onAudioContextStateChange);
        }
    }

    createBus(options?: any): Physical.IBus {
        return new Bus(this, options);
    }

    createSource(options?: any): Physical.ISource {
        return options?.stream ? new StreamSource(this, options) : new StaticSource(this, options);
    }

    createVoice(options?: any): Physical.IVoice {
        return options?.stream ? new StreamVoice(this, options) : new StaticVoice(this, options);
    }
}

export class PhysicalEngine extends Physical.AbstractEngine {
    constructor(options?: any) {
        super(new Engine(options), options);

        this.backend.physicalEngine = this;
    }
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
    engine: CoreEngine;
    abstract node: AudioNode;

    effectChain?: EffectChain;
    positioner?: Positioner;

    outputs = new Array<Bus>();

    get audioContext(): AudioContext {
        return this.engine.audioContext;
    }

    constructor(engine: CoreEngine, options?: any) {
        this.engine = engine;
    }
}

export class CoreBus extends AbstractGraphItem implements Physical.ICoreBus {
    node: GainNode;

    inputs = new Array<AbstractGraphItem>();

    constructor(engine: CoreEngine, options?: any) {
        super(engine, options);

        this.node = new GainNode(this.audioContext);
    }
}

class Bus extends CoreBus implements Physical.IBus {
    override engine: Engine;
    physicalBus: Physical.Bus;

    constructor(engine: Engine, options?: any) {
        super(engine, options);

        this.engine = engine;
        this.physicalBus = new Physical.Bus(this);
    }
}

abstract class AbstractSource implements Physical.ICoreSource {
    constructor(engine: CoreEngine, options?: any) {
        //
    }
}

class CoreStaticSource extends AbstractSource {
    buffer: AudioBuffer;

    constructor(engine: CoreEngine, options?: any) {
        super(engine, options);
    }
}

class StaticSource extends CoreStaticSource implements Physical.ISource {
    engine: Engine;
    physicalSource: Physical.Source;

    constructor(engine: Engine, options?: any) {
        super(engine, options);

        this.engine = engine;
        this.physicalSource = new Physical.Source(this, options);
    }
}

class CoreStreamSource extends AbstractSource {
    audioElement: HTMLAudioElement;
}

class StreamSource extends CoreStreamSource implements Physical.ISource {
    engine: Engine;
    physicalSource: Physical.Source;

    constructor(engine: Engine, options?: any) {
        super(engine, options);

        this.engine = engine;
        this.physicalSource = new Physical.Source(this, options);
    }
}

abstract class AbstractSound extends AbstractGraphItem implements Physical.ICoreVoice {
    abstract source: AbstractSource;

    abstract start(): void;
    abstract stop(): void;
}

export class CoreSound extends AbstractSound {
    node: AudioBufferSourceNode;
    source: CoreStaticSource;

    start(): void {}
    stop(): void {}
}

class StaticVoice extends CoreSound implements Physical.IVoice {
    override engine: Engine;
    physicalVoice: Physical.Voice;

    constructor(engine: Engine, options?: any) {
        super(engine, options);
        this.engine = engine;
        this.physicalVoice = new Physical.Voice(this, options);
    }
}

export class CoreSoundStream extends AbstractSound {
    node: MediaElementAudioSourceNode;
    source: CoreStreamSource;

    start(): void {}
    stop(): void {}
}

class StreamVoice extends CoreSoundStream implements Physical.IVoice {
    override engine: Engine;
    physicalVoice: Physical.Voice;

    constructor(engine: Engine, options?: any) {
        super(engine, options);
        this.engine = engine;
        this.physicalVoice = new Physical.Voice(this, options);
    }
}

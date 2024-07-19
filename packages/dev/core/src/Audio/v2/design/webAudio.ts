/* eslint-disable */

import * as Physical from "./physical";
import { Vector3 } from "../../../Maths/math.vector";

/*
WebAudio backend.

The core classes in this module will replace our legacy audio engine.
They are ...
    - Engine
    - Bus
    - Sound
    - StreamedSound (considering rename to SoundStream)

The advanced classes extend the core classes to implement the advanced audio engine's physical interfaces.

Maybe break this file up into webAudioCore.ts and webAudioAdvanced.ts?
*/

// Core
// TODO: Is there any reason to mark this as implementing IEngine anymore? (Same for other core classes).
export class Engine implements Physical.IEngine {
    audioContext: AudioContext;

    inputs = new Array<Bus>();

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
export class AdvancedEngine extends Engine implements Physical.IAdvancedEngine {
    physicalImplementation: Physical.AbstractEngine;
    startTime: number;

    override inputs = new Array<AdvancedBus>();

    get currentTime(): number {
        return this.unlocked ? this.startTime + this.audioContext.currentTime : (performance.now() - this.startTime) / 1000;
    }

    constructor(options?: any) {
        super(options);

        // this.physicalImplementation = new Physical.AbstractEngine(this, options);

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

    createBus(options?: any): Physical.IAdvancedBus {
        return new AdvancedBus(this, options);
    }

    createSource(options?: any): Physical.IAdvancedSource {
        return options?.stream ? new AdvancedStreamedSource(this, options) : new AdvancedSource(this, options);
    }

    createVoice(options?: any): Physical.IAdvancedVoice {
        return options?.stream ? new AdvancedStreamedSound(this, options) : new AdvancedSound(this, options);
    }
}

// Advanced
export class PhysicalEngine extends Physical.AbstractEngine {
    constructor(options?: any) {
        super(new AdvancedEngine(options), options);

        this.backend.physicalImplementation = this;
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
    engine: Engine;
    abstract node: AudioNode;

    effectChain?: EffectChain;
    positioner?: Positioner;

    outputs = new Array<Bus>();

    get audioContext(): AudioContext {
        return this.engine.audioContext;
    }

    constructor(engine: Engine, options?: any) {
        this.engine = engine;
    }
}

// Core
export class Bus extends AbstractGraphItem implements Physical.IBus {
    node: GainNode;

    inputs = new Array<AbstractGraphItem>();

    constructor(engine: Engine, options?: any) {
        super(engine, options);

        this.node = new GainNode(this.audioContext);
    }
}

class AdvancedBus extends Bus implements Physical.IAdvancedBus {
    override engine: AdvancedEngine;
    physicalImplementation: Physical.Bus;

    constructor(engine: AdvancedEngine, options?: any) {
        super(engine, options);

        this.engine = engine;
        this.physicalImplementation = new Physical.Bus(this);
    }
}

abstract class AbstractSource implements Physical.ISource {
    constructor(engine: Engine, options?: any) {
        //
    }
}

class Source extends AbstractSource {
    buffer: AudioBuffer;

    constructor(engine: Engine, options?: any) {
        super(engine, options);
    }
}

class AdvancedSource extends Source implements Physical.IAdvancedSource {
    engine: AdvancedEngine;
    physicalImplementation: Physical.Source;

    constructor(engine: AdvancedEngine, options?: any) {
        super(engine, options);

        this.engine = engine;
        this.physicalImplementation = new Physical.Source(this, options);
    }
}

class StreamedSource extends AbstractSource {
    audioElement: HTMLAudioElement;
}

class AdvancedStreamedSource extends StreamedSource implements Physical.IAdvancedSource {
    engine: AdvancedEngine;
    physicalImplementation: Physical.Source;

    constructor(engine: AdvancedEngine, options?: any) {
        super(engine, options);

        this.engine = engine;
        this.physicalImplementation = new Physical.Source(this, options);
    }
}

abstract class AbstractSound extends AbstractGraphItem implements Physical.IVoice {
    abstract source: AbstractSource;

    abstract start(): void;
    abstract stop(): void;
}

// Core
export class Sound extends AbstractSound {
    node: AudioBufferSourceNode;
    source: Source;

    start(): void {}
    stop(): void {}
}

class AdvancedSound extends Sound implements Physical.IAdvancedVoice {
    override engine: AdvancedEngine;
    physicalImplementation: Physical.Voice;

    constructor(engine: AdvancedEngine, options?: any) {
        super(engine, options);
        this.engine = engine;
        this.physicalImplementation = new Physical.Voice(this, options);
    }
}

// Core
// TODO: Maybe rename this to `SoundStream`?
export class StreamedSound extends AbstractSound {
    node: MediaElementAudioSourceNode;
    source: StreamedSource;

    start(): void {}
    stop(): void {}
}

class AdvancedStreamedSound extends StreamedSound implements Physical.IAdvancedVoice {
    override engine: AdvancedEngine;
    physicalImplementation: Physical.Voice;

    constructor(engine: AdvancedEngine, options?: any) {
        super(engine, options);
        this.engine = engine;
        this.physicalImplementation = new Physical.Voice(this, options);
    }
}

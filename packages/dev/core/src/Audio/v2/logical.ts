/* eslint-disable */

import { VoiceState, VirtualVoice } from "./common";
import * as Physical from "./physical";
import * as WebAudio from "./webAudio"; // TODO: Remove this. Doesn't belong here.
import { IDisposable } from "../../scene";
import { Nullable } from "../../types";

/*
Logical layer of the advanced audio engine. Communicates with the physical layer using virtual voices.

The logical layer wants to play all the virtual voices it's asked to play, but the physical layer limits the actual
number of voices that can be played at once. The logical layer sorts the virtual voices by importance, and the physical
layer mutes the least important virtual voices when there are too many of them trying to play.

See the `Engine.update` function.
*/

let currentEngine: Nullable<Engine> = null;

function getCurrentEngine(): Engine {
    return currentEngine ?? createDefaultEngine();
}

let setCurrentEngine = (engine: Engine) => {
    currentEngine = engine;
};

export class Engine {
    physicalEngine: Physical.AbstractEngine;
    mainBusses = new Array<Bus>(); // TODO: Add public `addBus` and `removeBus` (except for first bus).

    voices = new Array<VirtualVoice>();
    voicesDirty: boolean = false;
    inactiveVoiceIndex: number = 1;

    get mainBus(): Bus {
        return this.mainBusses[0];
    }

    constructor(physicalEngine: Physical.AbstractEngine, options?: any) {
        this.physicalEngine = physicalEngine;
        this.mainBusses.push(new Bus(this));

        setCurrentEngine(this);
    }

    getVoices(count: number, physicalSource: Physical.Source, options?: any): Array<VirtualVoice> {
        const voices = new Array<VirtualVoice>(count);
        if (count === 0) {
            return voices;
        }

        this.inactiveVoiceIndex = 0;

        for (let i = 0; i < count; i++) {
            while (this.inactiveVoiceIndex < this.voices.length && this.voices[this.inactiveVoiceIndex].state !== VoiceState.Stopped) {
                this.inactiveVoiceIndex++;
            }

            const voice = this.inactiveVoiceIndex < this.voices.length ? this.voices[this.inactiveVoiceIndex] : this._createVoice();
            voices[i] = voice;

            voice.init(physicalSource, options);
        }

        this.voicesDirty = true;

        return voices;
    }

    freeVoices(voices: Array<VirtualVoice>): void {
        for (const voice of voices) {
            voice.stop();
        }
        // TODO: Free resources.
    }

    /**
     * Updates virtual and physical voices.
     *
     * TODO: Add an option to make this get called automatically by the engine.
     */
    update(): void {
        // TODO: Uncomment this when observing virtual voice changes is implemented.
        // if (!this.voicesDirty) {
        //     return;
        // }

        // TODO: There maybe be a faster way to sort since we don't care about the order of inactive voices.
        //
        // Inactive voices are only required to be at the end of the array, after the active voices.
        //
        // Active voices need to be sorted amongs themselves using `compare`, but inactive voices don't. They just need
        // to come after all active voices in the array.
        //
        this.voices.sort((a, b) => a.compare(b));

        this.voicesDirty = false;
        this.physicalEngine.update(this.voices);
    }

    _createVoice(): VirtualVoice {
        const voice = new VirtualVoice();

        voice.onStateChangedObservable.add(() => {
            this.voicesDirty = true;
        });

        this.voices.push(voice);
        this.inactiveVoiceIndex = this.voices.length;

        return voice;
    }
}

abstract class EngineObject {
    engine: Engine;

    get physicalEngine(): Physical.AbstractEngine {
        return this.engine.physicalEngine;
    }

    constructor(engine?: Engine, options?: any) {
        this.engine = engine ?? getCurrentEngine();
    }
}

export class Bus extends EngineObject {
    physicalBus: Physical.Bus;

    constructor(engine?: Engine, options?: any) {
        super(engine);

        this.physicalBus = this.physicalEngine.createBus(options);
    }
}

export class Sound extends EngineObject implements IDisposable {
    outputBus: Bus;
    physicalSource: Physical.Source;

    voices: Array<VirtualVoice>;
    nextVoiceIndex: number = 0;

    paused: boolean = false;

    constructor(name: string, options?: any, engine?: Engine) {
        super(engine);

        this.outputBus = options?.outputBus ?? this.engine.mainBus;
        this.physicalSource = options?.physicalSource ?? this.physicalEngine.createSource(options);
        this.voices = this.engine.getVoices(options?.maxVoices ?? 1, this.physicalSource, options);
    }

    public dispose(): void {
        this.stop();
        this.engine.freeVoices(this.voices);
    }

    play(): VirtualVoice {
        this.resume();

        const voice = this.voices[this.nextVoiceIndex];
        voice.start();

        this.nextVoiceIndex = (this.nextVoiceIndex + 1) % this.voices.length;

        return voice;
    }

    stop(): void {
        for (const voice of this.voices) {
            voice.stop();
        }
    }

    pause(): void {
        if (this.paused) {
            return;
        }

        for (const voice of this.voices) {
            voice.pause();
        }

        this.paused = true;
    }

    resume(): void {
        if (!this.paused) {
            return;
        }

        for (const voice of this.voices) {
            voice.resume();
        }

        this.paused = false;
    }
}

// TODO: Move this. It doesn't belong in the logical layer.
export class WebAudioEngine extends Engine {
    constructor(options?: any) {
        super(new WebAudio.PhysicalEngine(), options);
    }
}

export let createDefaultEngine = (): Engine => {
    return new WebAudioEngine();
};

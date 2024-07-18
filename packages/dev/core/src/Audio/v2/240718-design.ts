/* eslint-disable */

import { Nullable } from "../../types";

interface SoundOptions {
    streaming: boolean;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Physical
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

abstract class AbstractPhysicalSound {
    //
}

abstract class AbstractStaticPhysicalSound extends AbstractPhysicalSound {
    // Implement using WebAudio AudioBufferSourceNode.
}

abstract class AbstractStreamingPhysicalSound extends AbstractPhysicaSound {
    // Implement using WebAudio MediaElementAudioSourceNode.
}

abstract class AbstractPhysicalEngine {
    abstract createBus(options: BusOptions): AbstractPhysicalBus;

    // Return AbstractStreamingPhysicalSound if options.streaming is true; otherwise return AbstractStaticPhysicalSound.
    abstract createSound(options: SoundOptions): AbstractPhysicalSound;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Core
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Engine {
    physicalEngine: AbstractPhysicalEngine;
}

class Bus {
    //
}

class Effect {
    //
}

class EffectsChain {
    //
}

class Sound {
    physicalSound: PhysicalSound;

    constructor(options: SoundOptions, engine: Engine) {
        this.physicalSound = engine.physicalEngine.createSound(options);
    }

    play(): void {
        this.physicalSound.play();
    }
}

interface AdvancedSoundOptions extends SoundOptions {
    maxVoices: number;
}

class AdvancedSound {
    options: AdvancedSoundOptions;

    physicalSound: PhysicalSound;
    voices: Array<VirtualVoice>;

    constructor(options: AdvancedSoundOptions, engine: Engine) {
        this.options = options;

        this.physicalSound = engine.physicalEngine.createSound(options);

        this.voices = new Array<VirtualVoice>(options.maxVoices);
        for (let i = 0; i < options.maxVoices; i++) {
            this.voices[i] = new VirtualVoice();
        }
    }

    play(): VirtualVoice {
        this.resume();
        return this._startNextVoice();
    }

    pause(): void {
        // Pause all voices.
    }

    resume(): void {
        // Resume all paused voices.
    }

    stop(): void {
        // Stop all voices.
    }

    _nextVoiceIndex: number = 0;

    _startNextVoice(): VirtualVoice {
        const voice = this.voices[this._nextVoiceIndex];
        this._nextVoiceIndex = (this._nextVoiceIndex + 1) % this.options.maxVoices;
        voice.start(this);
        return voice;
    }
}

class VirtualVoice {
    sound: AdvancedSound;

    start(): void {
        //
    }
}

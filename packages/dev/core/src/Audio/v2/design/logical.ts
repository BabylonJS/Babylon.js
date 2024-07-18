/* eslint-disable */

import * as Physical from "./physical";
import { Observable } from "../../../Misc/observable";

export class Engine {
    physicalEngine: Physical.IAdvancedEngine;
    mainBusses: Array<Bus>; // public add and remove except for first item.

    voices = new Array<VirtualVoice>();
    voicesDirty: boolean = false;
    inactiveVoiceIndex: number = 1;

    get mainBus(): Bus {
        return this.mainBusses[0];
    }

    constructor(physicalEngine: Physical.IAdvancedEngine, options?: any) {
        this.physicalEngine = physicalEngine;
        this.mainBusses = [new Bus(this)];
    }

    getVoices(count: number, physicalSource: Physical.IAdvancedSource, options?: any): Array<VirtualVoice> {
        const voices = new Array<VirtualVoice>(count);
        if (count === 0) {
            return voices;
        }

        this.inactiveVoiceIndex = 0;

        for (let i = 0; i < count; i++) {
            while (this.inactiveVoiceIndex < this.voices.length && this.voices[this.inactiveVoiceIndex].state !== Physical.VoiceState.Stopped) {
                this.inactiveVoiceIndex++;
            }

            const voice = this.inactiveVoiceIndex < this.voices.length ? this.voices[this.inactiveVoiceIndex] : this.createVoice();
            voices[i] = voice;

            voice.init(physicalSource, options);
        }

        this.voicesDirty = true;

        return voices;
    }

    createVoice(): VirtualVoice {
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

    constructor(engine: Engine, options?: any) {
        this.engine = engine;
    }
}

export class Bus extends EngineObject {
    physicalBus: Physical.IAdvancedBus;

    constructor(engine: Engine, options?: any) {
        super(engine);
        this.physicalBus = engine.physicalEngine.createBus(options);
    }
}

export class Sound extends EngineObject {
    voices: Array<VirtualVoice>;

    constructor(engine: Engine, options?: any) {
        super(engine);
    }

    play(): VirtualVoice {
        // TODO: Reuse oldest voice in preallocated `voices` pool and return it here.
        return this.voices[0];
    }
}

export class VirtualVoice {
    physicalSource: Physical.IAdvancedSource;
    options: any;

    _state: Physical.VoiceState = Physical.VoiceState.Starting;
    onStateChangedObservable = new Observable<VirtualVoice>();

    init(physicalSource: Physical.IAdvancedSource, options?: any): void {
        this.physicalSource = physicalSource;
        this.options = options;
    }

    get state(): Physical.VoiceState {
        return this._state;
    }

    set state(value: Physical.VoiceState) {
        this.setState(value);
    }

    setState(value: Physical.VoiceState) {
        if (this._state === value) {
            return;
        }
        this._state = value;
        this.onStateChangedObservable.notifyObservers(this);
    }

    get priority(): number {
        return this.options?.priority !== undefined ? this.options.priority : 0;
    }

    get loop(): boolean {
        return this.options?.loop === true;
    }

    get static(): boolean {
        return this.options?.stream !== true;
    }

    get streamed(): boolean {
        return this.options?.stream === true;
    }

    get updated(): boolean {
        return (
            this._state === Physical.VoiceState.Muted ||
            this._state === Physical.VoiceState.Paused ||
            this._state === Physical.VoiceState.Started ||
            this._state === Physical.VoiceState.Stopped
        );
    }

    get active(): boolean {
        return this.state < Physical.VoiceState.Pausing;
    }

    get waitingToStart(): boolean {
        return this.state < Physical.VoiceState.Started;
    }

    get started(): boolean {
        return this.state === Physical.VoiceState.Started;
    }

    get muting(): boolean {
        return this.state === Physical.VoiceState.Muting;
    }

    get muted(): boolean {
        return this.state === Physical.VoiceState.Muted;
    }

    get pausing(): boolean {
        return this.state === Physical.VoiceState.Pausing;
    }

    get stopping(): boolean {
        return this.state === Physical.VoiceState.Stopping;
    }

    compare(other: VirtualVoice): number {
        if (this.state !== other.state) {
            return this.state - other.state;
        }
        if (this.priority === other.priority) {
            return 0;
        }
        if (this.priority > other.priority) {
            return -1;
        }

        // Looped voices are more noticeable when they stop and start, so they are prioritized over non-looped voices.
        if (!this.loop && other.loop) {
            return -1;
        }

        // Streamed voices are hard to restart cleanly, so they are prioritized over static voices.
        if (this.static && other.streamed) {
            return -1;
        }

        return 1;
    }

    start(): void {
        if (this._state === Physical.VoiceState.Muted) {
            this.state = Physical.VoiceState.Unmuting;
        } else if (this._state === Physical.VoiceState.Paused) {
            this.state = Physical.VoiceState.Resuming;
        } else if (this._state === Physical.VoiceState.Stopped) {
            this.state = Physical.VoiceState.Restarting;
        } else if (this._state === Physical.VoiceState.Muting || this._state === Physical.VoiceState.Pausing) {
            this.state = Physical.VoiceState.Started;
        }
    }

    mute(): void {
        this.state = Physical.VoiceState.Muting;
    }

    pause(): void {
        this.state = Physical.VoiceState.Pausing;
    }

    resume(): void {
        this.state = Physical.VoiceState.Resuming;
    }

    stop(): void {
        this.state = Physical.VoiceState.Stopping;
    }
}

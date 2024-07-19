/* eslint-disable */

import { VirtualVoice, VoiceState } from "./common";
import { Vector3 } from "../../../Maths";
import { Nullable } from "core/types";

/*
Physical layer of the advanced audio engine.

All interfaces in this file must be implemented by the backend, and they should only be used by the physical layer.
The logical and common layers should not use these interfaces! They should only use the classes.
*/

export interface IEngine {
    inputs: Array<IBus>;
}

export interface IAdvancedEngine extends IEngine {
    physicalEngine: AbstractEngine;
    currentTime: number;

    createBus(options?: any): IAdvancedBus;
    createSource(options?: any): IAdvancedSource;
    createVoice(options?: any): IAdvancedVoice;
}

export abstract class AbstractEngine {
    backend: IAdvancedEngine;

    graphItems = new Map<number, AbstractEngineItem>();
    nextItemId: number = 1;

    maxSpatialVoices: number = 0;
    staticVoices: Array<Voice>;
    streamVoices: Array<Voice>;

    get currentTime(): number {
        return this.backend.currentTime;
    }

    lastUpdateTime: number = 0;

    constructor(backend: IAdvancedEngine, options?: any) {
        this.backend = backend;

        this.maxSpatialVoices = options?.maxSpatialVoices ?? 64;
        this.staticVoices = new Array<Voice>(options?.maxStaticVoices ?? 128);
        this.streamVoices = new Array<Voice>(options?.maxStreamVoices ?? 8);

        for (let i = 0; i < this.staticVoices.length; i++) {
            this.staticVoices[i] = this.createVoice();
        }
        for (let i = 0; i < this.streamVoices.length; i++) {
            this.streamVoices[i] = this.createVoice({ stream: true });
        }
    }

    createBus(options?: any): Bus {
        const bus = this.backend.createBus(options).physicalBus;
        this._addItem(bus, options);
        return bus;
    }

    createSource(options?: any): Source {
        const source = this.backend.createSource(options).physicalSource;
        this._addItem(source, options);
        return source;
    }

    createVoice(options?: any): Voice {
        const voice = this.backend.createVoice(options).physicalVoice;
        this._addItem(voice, options);
        return voice;
    }

    _addItem(item: AbstractEngineItem, options?: any): void {
        if (options?.id) {
            item.id = options.id;
            this.nextItemId = Math.max(this.nextItemId, options.id + 1);
        } else {
            item.id = this.nextItemId++;
        }
        this.graphItems.set(item.id, item);
    }

    update(virtualVoices: Array<VirtualVoice>): void {
        const currentTime = this.currentTime;
        if (this.lastUpdateTime == currentTime) {
            return;
        }
        this.lastUpdateTime = currentTime;

        // Update virtual voice states according to the number of physical voices available.
        let spatialCount = 0;
        let staticCount = 0;
        let streamedCount = 0;
        let spatialMaxed = false;
        let staticMaxed = false;
        let streamedMaxed = false;
        let allMaxed = false;

        for (let i = 0; i < virtualVoices.length; i++) {
            const virtualVoice = virtualVoices[i];

            if (!virtualVoice.active) {
                break;
            }

            if (allMaxed || (virtualVoice.spatial && spatialMaxed)) {
                virtualVoice.mute();
                return;
            }

            if (virtualVoice.static) {
                if (staticMaxed) {
                    virtualVoice.mute();
                    return;
                }
                virtualVoice.start();

                staticCount++;
                if (staticCount >= this.staticVoices.length) {
                    staticMaxed = true;
                }
            }

            if (virtualVoice.streamed) {
                if (streamedMaxed) {
                    virtualVoice.mute();
                    return;
                }
                virtualVoice.start();

                streamedCount++;
                if (streamedCount >= this.streamVoices.length) {
                    streamedMaxed = true;
                }
            }

            if (virtualVoice.spatial) {
                spatialCount++;
                if (spatialCount >= this.maxSpatialVoices) {
                    spatialMaxed = true;
                }
            }

            if (spatialMaxed && staticMaxed && streamedMaxed) {
                allMaxed = true;
            }
        }

        // Sort active/unmuted voices to the top of the physical voice array while muting, pausing, or stopping virtual
        // voices that can be physically ignored.
        //
        // When complete, `pastLastActiveIndex` is set to one past the last active and unmuted voice. Starting at this
        // index, physical voices can be used by virtual voices waiting to start.
        //
        // Note that it is assumed the number of virtual voices waiting to start is not more than than the number of
        // physical voices available. This assumption is not checked here, which means any virtual voices waiting to
        // start are ignored beyond the number of physical voices available. This can result in voices not playing when
        // they are supposed to.
        //
        let pastLastActiveIndex = 0;
        for (let i = 0; i < this.staticVoices.length; i++) {
            const voice = this.staticVoices[i];

            if (voice.available) {
                break;
            }

            const virtualVoice = voice.virtualVoice!;

            if (virtualVoice.active && !virtualVoice.muted) {
                if (pastLastActiveIndex < i) {
                    this.staticVoices[pastLastActiveIndex].copyFrom(voice);
                }
                pastLastActiveIndex++;
            } else if (virtualVoice.muting) {
                voice.mute();
            } else if (virtualVoice.pausing) {
                voice.pause();
            } else if (virtualVoice.stopping) {
                voice.stop();
            }
        }

        // Physically start virtual voices waiting to start.
        let virtualVoiceIndex = virtualVoices.findIndex((virtualVoice) => virtualVoice.waitingToStart);
        if (virtualVoiceIndex !== -1) {
            while (pastLastActiveIndex < this.staticVoices.length) {
                const voice = this.staticVoices[pastLastActiveIndex];

                voice.init(virtualVoices[virtualVoiceIndex]);
                voice.start();

                pastLastActiveIndex++;

                // Set `virtualVoiceIndex` to the next virtual voice waiting to start.
                let done = false;
                do {
                    virtualVoiceIndex++;
                    done = virtualVoiceIndex >= virtualVoices.length;
                } while (!done && !virtualVoices[virtualVoiceIndex].waitingToStart);

                // Exit the loop if there are no more virtual voices waiting to start.
                if (done) {
                    break;
                }
            }
        }

        // Clear the first inactive voice to make it available and stop the active/unmuted voices sort early in the
        // next update.
        if (pastLastActiveIndex < this.staticVoices.length) {
            this.staticVoices[pastLastActiveIndex].clear();
        }

        console.log(this.staticVoices);

        // TODO: Update stream voices.
    }
}

export interface IPositioner {
    position: Vector3;
}

export interface IGraphItem {
    outputs: Array<IBus>;
    positioner?: IPositioner;
}

interface IAdvancedEngineItem {
    engine: IAdvancedEngine;
}

abstract class AbstractEngineItem {
    abstract backend: IAdvancedEngineItem;

    get engine(): AbstractEngine {
        return this.backend.engine.physicalEngine;
    }

    id: number;
}

export interface IBus extends IGraphItem {
    inputs: Array<IGraphItem>;
}

export interface IAdvancedBus extends IBus {
    engine: IAdvancedEngine;
    physicalBus: Bus;
}

type IAdvancedBusBackend = IAdvancedBus & IAdvancedEngineItem;

export class Bus extends AbstractEngineItem {
    backend: IAdvancedBusBackend;

    constructor(backend: IAdvancedBusBackend, options?: any) {
        super();

        this.backend = backend;
    }
}

export interface ISource {
    //
}

export interface IAdvancedSource extends ISource {
    engine: IAdvancedEngine;
    physicalSource: Source;
}

type IAdvancedSourceBackend = IAdvancedSource & IAdvancedEngineItem;

export class Source extends AbstractEngineItem {
    backend: IAdvancedSourceBackend;

    constructor(backend: IAdvancedSourceBackend, options?: any) {
        super();

        this.backend = backend;
    }
}

export interface IVoice extends IGraphItem {
    source: ISource;

    start(): void;
    stop(): void;
}

export interface IAdvancedVoice extends IVoice {
    engine: IAdvancedEngine;
    physicalVoice: Voice;
}

type IAdvancedVoiceBackend = IAdvancedVoice & IAdvancedEngineItem;

export class Voice extends AbstractEngineItem {
    backend: IAdvancedVoiceBackend;

    virtualVoice: Nullable<VirtualVoice> = null;

    get available(): boolean {
        return this.virtualVoice === null;
    }

    constructor(backend: IAdvancedVoiceBackend, options?: any) {
        super();

        this.backend = backend;
    }

    init(virtualVoice: VirtualVoice): void {
        if (!this.available) {
            throw new Error("Voice is not available.");
            return;
        }
        this.virtualVoice = virtualVoice;
    }

    copyFrom(voice: Voice): void {
        this.virtualVoice = voice.virtualVoice;
    }

    clear(): void {
        this.virtualVoice = null;
    }

    start(): void {
        if (!this.virtualVoice || this.virtualVoice?.updated) {
            return;
        }
        this.virtualVoice?.setState(VoiceState.Started);
        console.log("Voice.start()");
    }

    mute(): void {
        if (!this.virtualVoice || this.virtualVoice?.updated) {
            return;
        }
        this.virtualVoice?.setState(VoiceState.Muted);
        console.log("Voice.mute()");
    }

    pause(): void {
        if (!this.virtualVoice || this.virtualVoice?.updated) {
            return;
        }
        this.virtualVoice?.setState(VoiceState.Paused);
        console.log("Voice.pause()");
    }

    stop(): void {
        if (!this.virtualVoice || this.virtualVoice?.updated) {
            return;
        }
        this.virtualVoice?.setState(VoiceState.Stopped);
        console.log("Voice.stop()");
    }
}

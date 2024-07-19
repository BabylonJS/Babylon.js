/* eslint-disable */

import { VirtualVoice } from "./common";
import { Vector3 } from "../../../Maths";

export interface IEngine {
    inputs: Array<IBus>;
}

export interface IAdvancedEngine extends IEngine {
    physicalImplementation: Engine;

    graphItems: Map<number, IGraphItem>;

    createBus(options?: any): IAdvancedBus;
    createSource(options?: any): IAdvancedSource;
    createVoice(options?: any): IAdvancedVoice;

    update(voices: Array<VirtualVoice>): void;
}

export class Engine {
    backend: IAdvancedEngine;

    staticVoices: Array<IAdvancedVoice>;
    streamedVoices: Array<IAdvancedVoice>;

    constructor(backend: IAdvancedEngine, options?: any) {
        this.backend = backend;

        this.staticVoices = new Array<IAdvancedVoice>(options?.maxStaticVoices ?? 128);
        this.streamedVoices = new Array<IAdvancedVoice>(options?.maxStreamVoices ?? 8);

        for (let i = 0; i < this.staticVoices.length; i++) {
            this.staticVoices[i] = this.backend.createVoice();
        }
        for (let i = 0; i < this.streamedVoices.length; i++) {
            this.streamedVoices[i] = this.backend.createVoice({ stream: true });
        }
    }
}

export interface IPositioner {
    position: Vector3;
}

export interface IGraphItem {
    outputs: Array<IBus>;
    positioner?: IPositioner;
}

export interface IBus extends IGraphItem {
    inputs: Array<IGraphItem>;
}

export interface IAdvancedBus extends IBus {
    physicalImplementation: Bus;
}

export class Bus {
    backend: IAdvancedBus;

    constructor(backend: IAdvancedBus, options?: any) {
        this.backend = backend;
    }
}

export interface ISource {}

export interface IAdvancedSource extends ISource {
    physicalImplementation: Source;
}

export class Source {
    backend: IAdvancedSource;

    constructor(backend: IAdvancedSource, options?: any) {
        this.backend = backend;
    }
}

export interface IVoice extends IGraphItem {
    source: ISource;

    start(): void;
    stop(): void;
}

export interface IAdvancedVoice extends IVoice {
    physicalImplementation: Voice;
}

export class Voice {
    backend: IAdvancedVoice;

    constructor(backend: IAdvancedVoice, options?: any) {
        this.backend = backend;
    }
}

/* eslint-disable */

import { VirtualVoice } from "./common";
import { Vector3 } from "../../../Maths";

export interface IEngine {
    inputs: Array<IBus>;
    graphItems: Map<number, IGraphItem>;
}

export interface IAdvancedEngine extends IEngine {
    physicalImplementation: Engine;

    createBus(options?: any): IAdvancedBus;
    createSource(options?: any): IAdvancedSource;
    createVoice(options?: any): IAdvancedVoice;

    update(voices: Array<VirtualVoice>): void;
}

export class Engine {
    backend: IEngine;

    constructor(backend: IEngine) {
        this.backend = backend;
    }
}

export interface IPositioner {
    position: Vector3;
}

export interface IGraphItem {
    id: number;
    outputs: Array<IBus>;
    positioner: IPositioner;
}

export interface IBus extends IGraphItem {
    inputs: Array<IGraphItem>;
}

export interface IAdvancedBus extends IBus {
    physicalImplementation: Bus;
}

export class Bus {
    backend: IAdvancedBus;

    constructor(backend: IAdvancedBus) {
        this.backend = backend;
    }
}

export interface ISource {
    id: number;
}

export interface IAdvancedSource extends ISource {
    physicalImplementation: Source;
}

export class Source {
    backend: IAdvancedSource;

    constructor(backend: IAdvancedSource) {
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
    logicalSoundId: number;

    constructor(backend: IAdvancedVoice) {
        this.backend = backend;
    }
}

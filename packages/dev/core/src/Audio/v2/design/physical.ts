/* eslint-disable */

import { Vector3 } from "../../../Maths";

export interface IEngine {
    inputs: Array<IBus>;
    graphObjects: Map<number, IGraphObject>;
}

export interface IAdvancedEngine extends IEngine {
    physicalImplementation: Engine;

    createBus(): IAdvancedBus;
    createVoice(): IAdvancedVoice;
    createStreamedVoice(): IAdvancedVoice;
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

export interface IGraphObject {
    id: number;
    outputs: Array<IBus>;
    positioner: IPositioner;
}

export interface IBus extends IGraphObject {
    inputs: Array<IGraphObject>;
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

export interface IVoice extends IGraphObject {
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

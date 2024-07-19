/* eslint-disable */

import { VirtualVoice } from "./common";
import { Vector3 } from "../../../Maths";

export interface IEngine {
    inputs: Array<IBus>;
}

export interface IAdvancedEngine extends IEngine {
    physicalImplementation: Engine;

    createBus(options?: any): IAdvancedBus;
    createSource(options?: any): IAdvancedSource;
    createVoice(options?: any): IAdvancedVoice;

    update(voices: Array<VirtualVoice>): void;
}

export class Engine {
    backend: IAdvancedEngine;

    graphItems: Map<number, AbstractEngineItem>;
    nextItemId: number = 1;

    staticVoices: Array<Voice>;
    streamVoices: Array<Voice>;

    constructor(backend: IAdvancedEngine, options?: any) {
        this.backend = backend;

        this.staticVoices = new Array<Voice>(options?.maxStaticVoices ?? 128);
        this.streamVoices = new Array<Voice>(options?.maxStreamVoices ?? 8);

        // Each call to `createVoice` should result in calls to `_addItem` and `_addVoice` when created by the backend.
        for (let i = 0; i < this.staticVoices.length; i++) {
            this.backend.createVoice();
        }
        for (let i = 0; i < this.streamVoices.length; i++) {
            this.backend.createVoice({ stream: true });
        }
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

    _addVoice(voice: Voice, options?: any): void {
        if (options?.stream) {
            this.streamVoices.push(voice);
        } else {
            this.staticVoices.push(voice);
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

interface IAdvancedEngineItem {
    engine: IAdvancedEngine;
}

abstract class AbstractEngineItem {
    abstract backend: IAdvancedEngineItem;

    get engine(): Engine {
        return this.backend.engine.physicalImplementation;
    }

    id: number;

    constructor(backend: IAdvancedEngineItem, options?: any) {
        backend.engine.physicalImplementation._addItem(this, options);
    }
}

export interface IBus extends IGraphItem {
    inputs: Array<IGraphItem>;
}

export interface IAdvancedBus extends IBus {
    engine: IAdvancedEngine;
    physicalImplementation: Bus;
}

type IAdvancedBusBackend = IAdvancedBus & IAdvancedEngineItem;

export class Bus extends AbstractEngineItem {
    backend: IAdvancedBusBackend;

    constructor(backend: IAdvancedBusBackend, options?: any) {
        super(options);

        this.backend = backend;
    }
}

export interface ISource {
    //
}

export interface IAdvancedSource extends ISource {
    engine: IAdvancedEngine;
    physicalImplementation: Source;
}

type IAdvancedSourceBackend = IAdvancedSource & IAdvancedEngineItem;

export class Source extends AbstractEngineItem {
    backend: IAdvancedSourceBackend;

    constructor(backend: IAdvancedSourceBackend, options?: any) {
        super(options);

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
    physicalImplementation: Voice;
}

type IAdvancedVoiceBackend = IAdvancedVoice & IAdvancedEngineItem;

export class Voice extends AbstractEngineItem {
    backend: IAdvancedVoiceBackend;

    constructor(backend: IAdvancedVoiceBackend, options?: any) {
        super(options);

        this.backend = backend;

        this.engine._addVoice(this, options);
    }
}

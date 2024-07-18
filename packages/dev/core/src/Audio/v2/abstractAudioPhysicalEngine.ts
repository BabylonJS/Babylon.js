/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { type AudioBusOptions } from "./audioBus";
import { type AudioSpatializerOptions } from "./audioSpatializer";
import { type SoundOptions } from "./sound";
import { type VirtualVoice } from "./virtualVoice";
import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";

export abstract class AbstractAudioNode {
    public readonly id: number;

    public constructor(id: number) {
        this.id = id;
    }
}

// TODO: Maybe rename this to `AbstractAudioPhysicalBus` so it's not confused with the logical `AudioBus` class?
export abstract class AbstractAudioBus extends AbstractAudioNode {
    private readonly _inputs = new Map<number, Array<AbstractAudioNode>>();
    private readonly _outputs = new Map<number, Array<AbstractAudioBus>>();

    public constructor(id: number) {
        super(id);
    }

    public addInput(node: AbstractAudioNode): void {
        const nodes = this._inputs.get(node.id);
        if (nodes) {
            nodes.push(node);
        } else {
            this._inputs.set(node.id, [node]);
        }
    }

    public getInput(id: number, index: number = -1): Nullable<AbstractAudioNode> {
        return this._inputs.get(id)?.at(index >= 0 ? index : 0) ?? null;
    }

    public removeInput(node: AbstractAudioNode, index: number = -1): void {
        const nodes = this._inputs.get(node.id);
        if (nodes !== undefined) {
            if (nodes.length > 0) {
                if (index === -1) {
                    index = 0;
                }
                nodes.splice(index, 1);
            }
            if (nodes.length === 0) {
                this._inputs.delete(node.id);
            }
        }
    }

    public addOutput(node: AbstractAudioBus): void {
        const nodes = this._outputs.get(node.id);
        if (nodes) {
            nodes.push(node);
        } else {
            this._outputs.set(node.id, [node]);
        }
    }

    public getOutput(id: number, index: number = -1): Nullable<AbstractAudioBus> {
        return this._outputs.get(id)?.at(index >= 0 ? index : 0) ?? null;
    }

    public removeOutput(node: AbstractAudioBus, index: number = -1): void {
        const nodes = this._outputs.get(node.id);
        if (nodes !== undefined) {
            if (nodes.length > 0) {
                if (index === -1) {
                    index = 0;
                }
                nodes.splice(index, 1);
            }
            if (nodes.length === 0) {
                this._outputs.delete(node.id);
            }
        }
    }
}

export abstract class AbstractAudioSpatializer extends AbstractAudioNode {
    public readonly inputs = new Map<number, AbstractAudioNode>();

    public constructor(id: number) {
        super(id);
    }
}

export abstract class AbstractAudioStaticSource extends AbstractAudioNode {
    public onLoadObservable = new Observable<AbstractAudioStaticSource>();

    public abstract loaded: boolean;
    public abstract duration: number; // seconds

    public constructor(id: number) {
        super(id);
    }
}

export abstract class AbstractAudioStreamedSource extends AbstractAudioNode {
    public constructor(id: number) {
        super(id);
    }
}

export abstract class AbstractAudioPhysicalEngine {
    private _nextBusId: number = 1;
    private _nextSoundFieldRotatorId: number = 1;
    private _nextSpatializerId: number = 1;
    private _nextSourceId: number = 1;

    /**
     * An ever-increasing hardware time in seconds used for scheduling. Starts at 0.
     */
    public abstract currentTime: number;

    public abstract update(voices: Array<VirtualVoice>): void;

    public abstract createBus(options?: AudioBusOptions, outputBusId?: number): number;
    public abstract createSpatializer(options?: AudioSpatializerOptions): number;
    public abstract createSource(options?: SoundOptions): number;

    protected _getNextBusId(): number {
        return this._nextBusId++;
    }

    protected _getNextSoundFieldRotatorId(): number {
        return this._nextSoundFieldRotatorId++;
    }

    protected _getNextSpatializerId(): number {
        return this._nextSpatializerId++;
    }

    protected _getNextSourceId(): number {
        return this._nextSourceId++;
    }
}

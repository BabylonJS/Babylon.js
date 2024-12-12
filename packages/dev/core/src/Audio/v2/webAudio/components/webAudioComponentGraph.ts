import type { Nullable } from "core/types";
import type { AbstractAudioComponent } from "../../components/abstractAudioComponent";
import type { IVolumeAudioOptions } from "../../components/volumeAudioComponent";
import type { IWebAudioComponentOwner } from "../webAudioComponentOwner";
import { _CreateVolumeAudioComponentAsync, type _VolumeWebAudioComponent } from "./volumeWebAudioComponent";

/** @internal */
export interface IWebAudioComponentGraphOptions extends IVolumeAudioOptions {}

/** @internal */
export async function _CreateAudioComponentGraphAsync(owner: IWebAudioComponentOwner, options: Nullable<IWebAudioComponentGraphOptions>): Promise<_WebAudioComponentGraph> {
    const graph = new _WebAudioComponentGraph(owner);
    await graph.init(options);
    return graph;
}

/** @internal */
export class _WebAudioComponentGraph {
    /** @internal */
    public readonly owner: IWebAudioComponentOwner;

    /** @internal */
    public volumeComponent: _VolumeWebAudioComponent;

    /** @internal */
    public constructor(owner: IWebAudioComponentOwner) {
        if (!owner.upstreamNodes || !owner.downstreamNodes) {
            throw new Error("A WebAudio component owner must have upstreamNodes and downstreamNodes.");
        }

        this.owner = owner;
    }

    /** @internal */
    public async init(options: Nullable<IWebAudioComponentGraphOptions>): Promise<void> {
        this.volumeComponent = await _CreateVolumeAudioComponentAsync(this.owner, options);
    }

    /** @internal */
    public get webAudioInputNode(): AudioNode {
        return this.volumeComponent.node;
    }

    /** @internal */
    public get webAudioOutputNode(): AudioNode {
        return this.volumeComponent.node;
    }

    /** @internal */
    public get volume(): number {
        return this.volumeComponent.volume;
    }

    /** @internal */
    public set volume(value: number) {
        this.volumeComponent.volume = value;
    }

    /** @internal */
    public onComponentAdded(component: AbstractAudioComponent): void {}

    /** @internal */
    public onComponentRemoved(component: AbstractAudioComponent): void {}
}

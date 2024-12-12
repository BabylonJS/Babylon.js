import type { Nullable } from "core/types";
import { _AbstractAudioComponentGraph } from "../abstractAudioComponentGraph";
import type { AbstractAudioComponent } from "../components/abstractAudioComponent";
import type { IStereoAudioOptions } from "../components/stereoAudioComponent";
import type { IVolumeAudioOptions } from "../components/volumeAudioComponent";
import type { _StereoWebAudioComponent } from "./components/stereoWebAudioComponent";
import { _CreateStereoAudioComponentAsync } from "./components/stereoWebAudioComponent";
import type { _VolumeWebAudioComponent } from "./components/volumeWebAudioComponent";
import { _CreateVolumeAudioComponentAsync } from "./components/volumeWebAudioComponent";
import type { IWebAudioComponentOwner } from "./webAudioComponentOwner";

/** @internal */
export interface IWebAudioComponentGraphOptions extends IVolumeAudioOptions, IStereoAudioOptions {}

/** @internal */
export async function _CreateAudioComponentGraphAsync(owner: IWebAudioComponentOwner, options: Nullable<IWebAudioComponentGraphOptions>): Promise<_WebAudioComponentGraph> {
    const graph = new _WebAudioComponentGraph(owner);
    await graph.init(options);
    return graph;
}

/** @internal */
export class _WebAudioComponentGraph extends _AbstractAudioComponentGraph {
    /** @internal */
    public readonly owner: IWebAudioComponentOwner;

    /** @internal */
    public volumeComponent: _VolumeWebAudioComponent;

    /** @internal */
    public stereoComponent: Nullable<_StereoWebAudioComponent> = null;

    private _stereoPan: number = 0;

    /** @internal */
    public constructor(owner: IWebAudioComponentOwner) {
        super();

        if (!owner.upstreamNodes || !owner.downstreamNodes) {
            throw new Error("A WebAudio component owner must have upstreamNodes and downstreamNodes.");
        }

        this.owner = owner;
    }

    /** @internal */
    public async init(options: Nullable<IWebAudioComponentGraphOptions>): Promise<void> {
        this.volumeComponent = await _CreateVolumeAudioComponentAsync(this.owner, options);

        if (options?.stereoPan !== undefined) {
            this.stereoComponent = await _CreateStereoAudioComponentAsync(this.owner, { stereoPan: options.stereoPan });
        }

        this._updateComponents();
    }

    /** @internal */
    public get webAudioInputNode(): AudioNode {
        if (this.stereoComponent) {
            return this.stereoComponent.node;
        }
        return this.volumeComponent.node;
    }

    /** @internal */
    public get webAudioOutputNode(): AudioNode {
        return this.volumeComponent.node;
    }

    /** @internal */
    public get stereoPan(): number {
        return this.stereoComponent?.pan ?? this._stereoPan;
    }

    /** @internal */
    public set stereoPan(value: number) {
        if (this.stereoComponent) {
            this.stereoComponent.pan = value;
        } else {
            this._stereoPan = value;
            _CreateStereoAudioComponentAsync(this.owner, { stereoPan: value });
        }
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
    public onComponentAdded(component: AbstractAudioComponent): void {
        this._updateComponents();

        if (component.getClassName() === "StereoWebAudioComponent") {
            this.stereoComponent = component as _StereoWebAudioComponent;
        }
    }

    /** @internal */
    public onComponentRemoved(component: AbstractAudioComponent): void {
        this._updateComponents();

        if (component.getClassName() === "StereoWebAudioComponent") {
            this.stereoComponent = null;
        }
    }

    protected override _getComponent(componentClassName: string): Nullable<AbstractAudioComponent> {
        return this.owner.getComponent(componentClassName);
    }
}

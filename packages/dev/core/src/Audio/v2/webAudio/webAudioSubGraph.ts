import type { Nullable } from "core/types";
import { _AbstractAudioSubGraph } from "../abstractAudioSubGraph";
import type { AbstractAudioSubNode } from "../abstractAudioSubNode";
import type { ISpatialAudioOptions } from "../subNodes/spatialAudioSubNode";
import { spatialAudioOptionsAreDefined } from "../subNodes/spatialAudioSubNode";
import { stereoAudioOptionsAreDefined, type IStereoAudioOptions } from "../subNodes/stereoAudioSubNode";
import type { IVolumeAudioOptions } from "../subNodes/volumeAudioSubNode";
import type { _SpatialWebAudioSubNode } from "./subNodes/spatialWebAudioSubNode";
import { _CreateSpatialAudioSubNodeAsync } from "./subNodes/spatialWebAudioSubNode";
import type { _StereoWebAudioSubNode } from "./subNodes/stereoWebAudioSubNode";
import { _CreateStereoAudioSubNodeAsync } from "./subNodes/stereoWebAudioSubNode";
import type { _VolumeWebAudioSubNode } from "./subNodes/volumeWebAudioSubNode";
import { _CreateVolumeAudioSubNodeAsync } from "./subNodes/volumeWebAudioSubNode";
import type { IWebAudioSuperNode } from "./webAudioSuperNode";

/** @internal */
export interface IWebAudioSubGraphOptions extends ISpatialAudioOptions, IStereoAudioOptions, IVolumeAudioOptions {}

/** @internal */
export async function _CreateAudioSubGraphAsync(owner: IWebAudioSuperNode, options: Nullable<IWebAudioSubGraphOptions>): Promise<_WebAudioSubGraph> {
    const graph = new _WebAudioSubGraph(owner);
    await graph.init(options);
    return graph;
}

/** @internal */
export class _WebAudioSubGraph extends _AbstractAudioSubGraph {
    /** @internal */
    public readonly owner: IWebAudioSuperNode;

    /** @internal */
    public spatialComponent: Nullable<_SpatialWebAudioSubNode> = null;

    /** @internal */
    public stereoComponent: Nullable<_StereoWebAudioSubNode> = null;

    /** @internal */
    public volumeComponent: _VolumeWebAudioSubNode;

    /** @internal */
    public constructor(owner: IWebAudioSuperNode) {
        super();

        this.owner = owner;
    }

    /** @internal */
    public async init(options: Nullable<IWebAudioSubGraphOptions>): Promise<void> {
        this.volumeComponent = await _CreateVolumeAudioSubNodeAsync(this.owner, options);

        if (options) {
            if (spatialAudioOptionsAreDefined(options)) {
                this.spatialComponent = await _CreateSpatialAudioSubNodeAsync(this.owner, options);
            }

            if (stereoAudioOptionsAreDefined(options)) {
                this.stereoComponent = await _CreateStereoAudioSubNodeAsync(this.owner, options);
            }
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
        return this.stereoComponent?.pan ?? 0;
    }

    /** @internal */
    public set stereoPan(value: number) {
        if (this.stereoComponent) {
            this.stereoComponent.pan = value;
        } else {
            _CreateStereoAudioSubNodeAsync(this.owner, { stereoPan: value });
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
    public onComponentAdded(component: AbstractAudioSubNode): void {
        this._updateComponents();

        const className = component.getClassName();

        if (className === "SpatialWebAudioSubNode") {
            this.spatialComponent = component as _SpatialWebAudioSubNode;
        } else if (className === "StereoWebAudioSubNode") {
            this.stereoComponent = component as _StereoWebAudioSubNode;
        }
    }

    /** @internal */
    public onComponentRemoved(component: AbstractAudioSubNode): void {
        this._updateComponents();

        const className = component.getClassName();

        if (className === "SpatialWebAudioSubNode") {
            this.spatialComponent = null;
        } else if (className === "StereoWebAudioSubNode") {
            this.stereoComponent = null;
        }
    }

    protected override _getComponent(componentClassName: string): Nullable<AbstractAudioSubNode> {
        return this.owner.getComponent(componentClassName);
    }
}

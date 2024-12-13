import type { Nullable } from "core/types";
import type { IAudioSubGraphOptions } from "../abstractAudioSubGraph";
import { _AbstractAudioSubGraph } from "../abstractAudioSubGraph";
import type { AbstractAudioSubNode } from "../abstractAudioSubNode";
import { AudioSubNode } from "../subNodes/audioSubNode";
import type { _SpatialWebAudioSubNode } from "./subNodes/spatialWebAudioSubNode";
import { _CreateSpatialAudioSubNodeAsync } from "./subNodes/spatialWebAudioSubNode";
import type { _StereoWebAudioSubNode } from "./subNodes/stereoWebAudioSubNode";
import { _CreateStereoAudioSubNodeAsync } from "./subNodes/stereoWebAudioSubNode";
import type { _VolumeWebAudioSubNode } from "./subNodes/volumeWebAudioSubNode";
import { _CreateVolumeAudioSubNodeAsync } from "./subNodes/volumeWebAudioSubNode";
import type { IWebAudioSuperNode } from "./webAudioSuperNode";

/** @internal */
export async function _CreateAudioSubGraphAsync(owner: IWebAudioSuperNode, options: Nullable<IAudioSubGraphOptions>): Promise<_WebAudioSubGraph> {
    const graph = new _WebAudioSubGraph(owner);
    await graph.init(options);
    return graph;
}

/** @internal */
export class _WebAudioSubGraph extends _AbstractAudioSubGraph {
    /** @internal */
    public readonly owner: IWebAudioSuperNode;

    /** @internal */
    public constructor(owner: IWebAudioSuperNode) {
        super();
        this.owner = owner;
    }

    /** @internal */
    public async init(options: Nullable<IAudioSubGraphOptions>): Promise<void> {
        await this._init(options);
    }

    /** @internal */
    public get webAudioInputNode(): AudioNode {
        if (this._hasSubNode(AudioSubNode.Spatial)) {
            return this._getSubNode<_SpatialWebAudioSubNode>(AudioSubNode.Stereo)!.node;
        }
        if (this._hasSubNode(AudioSubNode.Stereo)) {
            return this._getSubNode<_StereoWebAudioSubNode>(AudioSubNode.Stereo)!.node;
        }
        return this._getSubNode<_VolumeWebAudioSubNode>(AudioSubNode.Volume)!.node;
    }

    /** @internal */
    public get webAudioOutputNode(): AudioNode {
        return this._getSubNode<_VolumeWebAudioSubNode>(AudioSubNode.Volume)!.node;
    }

    /** @internal */
    public updateSubNodes(): void {
        this._updateSubNodes();
    }

    protected _createSubNode(name: string, options?: Nullable<IAudioSubGraphOptions>): Nullable<Promise<AbstractAudioSubNode>> {
        switch (name) {
            case AudioSubNode.Volume:
                return _CreateVolumeAudioSubNodeAsync(this.owner, options);
            case AudioSubNode.Spatial:
                return _CreateSpatialAudioSubNodeAsync(this.owner, options);
            case AudioSubNode.Stereo:
                return _CreateStereoAudioSubNodeAsync(this.owner, options);
            default:
                return null;
        }
    }

    protected _disconnectSubNodes(): void {
        this.owner.disconnectSubNodes();
    }

    protected _getSubNode<T extends AbstractAudioSubNode = AbstractAudioSubNode>(subNodeClassName: string): Nullable<T> {
        return this.owner.getSubNode(subNodeClassName) as T;
    }

    protected _hasSubNode(name: string): boolean {
        return this.owner.hasSubNode(name);
    }
}
